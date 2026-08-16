import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, paypalErrorDiagnostic, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { priceCartLines, PricingError } from './_lib/pricing.js'
import {
  arePublicSalesOpen,
  isPreopeningPromoCode,
  PREOPENING_PROMO_ORDER_MARKER,
  PREOPENING_PROMO_PRICE,
  PromoCodeError,
  SalesClosedError,
} from './_lib/sales.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { lines, total: catalogueTotal } = priceCartLines(body?.items)
    const promoWasSubmitted = typeof body?.promoCode === 'string' && body.promoCode.trim() !== ''
    const promoApplied = isPreopeningPromoCode(body?.promoCode)

    if (promoWasSubmitted && !promoApplied) {
      throw new PromoCodeError('Ce code promotionnel est invalide ou a expiré.')
    }

    if (!arePublicSalesOpen() && !promoApplied) {
      throw new SalesClosedError('Les précommandes ouvrent le 17 août à 10:30, heure de Paris.')
    }

    if (promoApplied && (lines.length !== 1 || lines[0].quantity !== 1)) {
      throw new PromoCodeError('Le code teste07 est valable pour un seul tirage, en un seul exemplaire.')
    }

    const payableLines = promoApplied
      ? [{ ...lines[0], unitPrice: PREOPENING_PROMO_PRICE, lineTotal: PREOPENING_PROMO_PRICE }]
      : lines
    const total = promoApplied ? PREOPENING_PROMO_PRICE : catalogueTotal

    const accessToken = await getAccessToken()
    const order = await paypalFetch<{ id: string }>('/v2/checkout/orders', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: promoApplied ? PREOPENING_PROMO_ORDER_MARKER : 'photographic-prints',
          amount: {
            currency_code: 'EUR',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'EUR', value: total.toFixed(2) },
            },
          },
          items: payableLines.map((line) => ({
            name: `${line.title} — ${line.formatLabel} (${line.finishLabel})`.slice(0, 127),
            quantity: String(line.quantity),
            unit_amount: { currency_code: 'EUR', value: line.unitPrice.toFixed(2) },
            category: 'PHYSICAL_GOODS',
          })),
        }],
        application_context: {
          shipping_preference: 'GET_FROM_FILE',
          user_action: 'PAY_NOW',
        },
      }),
    })

    return res.status(200).json({ orderID: order.id })
  } catch (error) {
    if (error instanceof PricingError) {
      return res.status(400).json({ error: error.message })
    }
    if (error instanceof SalesClosedError) {
      return res.status(403).json({ code: 'SALES_NOT_OPEN', error: error.message })
    }
    if (error instanceof PromoCodeError) {
      return res.status(400).json({ code: 'PROMO_INVALID', error: error.message })
    }
    if (error instanceof PaypalApiError) {
      const diagnostic = paypalErrorDiagnostic(error)
      console.error('create-order: PayPal error', JSON.stringify(diagnostic))
      return res.status(502).json({
        error: 'La création de la commande PayPal a échoué.',
        code: 'PAYPAL_CREATE_FAILED',
        paypalIssue: diagnostic.details[0]?.issue,
        paypalField: diagnostic.details[0]?.field,
        paypalDebugId: diagnostic.debugId,
      })
    }
    console.error('create-order: unexpected error', error)
    return res.status(500).json({ error: 'Erreur serveur inattendue.' })
  }
}
