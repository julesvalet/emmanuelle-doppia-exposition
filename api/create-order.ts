import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildPaypalAmount, centsToPaypalValue } from './_lib/money.js'
import { getAccessToken, paypalErrorDiagnostic, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { priceCartLines, PricingError } from './_lib/pricing.js'
import {
  arePublicSalesOpen,
  checkPromoCode,
  PROMO_ORDER_MARKER,
  PROMO_PRICE,
  PromoCodeError,
  PromoExpiredError,
  SalesClosedError,
} from './_lib/sales.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { lines, totalCents: catalogueTotalCents } = priceCartLines(body?.items)
    const promoWasSubmitted = typeof body?.promoCode === 'string' && body.promoCode.trim() !== ''
    const promoStatus = checkPromoCode(body?.promoCode)
    const promoApplied = promoStatus === 'valid'

    if (promoWasSubmitted && promoStatus === 'expired') {
      throw new PromoExpiredError('Ce code promotionnel n’était valable que le 17 août 2026. Il n’est plus disponible.')
    }
    if (promoWasSubmitted && promoStatus === 'invalid') {
      throw new PromoCodeError('Ce code promotionnel est invalide ou a expiré.')
    }

    if (!arePublicSalesOpen() && !promoApplied) {
      throw new SalesClosedError('Les précommandes ouvrent le 17 août à 19:00, heure de Paris.')
    }

    if (promoApplied && (lines.length !== 1 || lines[0].quantity !== 1)) {
      throw new PromoCodeError('Ce code promotionnel est valable pour un seul tirage, en un seul exemplaire.')
    }

    const finalTotalCents = promoApplied
      ? Math.round(PROMO_PRICE * 100)
      : catalogueTotalCents
    const amount = buildPaypalAmount(catalogueTotalCents, finalTotalCents)

    const accessToken = await getAccessToken()
    const order = await paypalFetch<{ id: string }>('/v2/checkout/orders', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: promoApplied ? PROMO_ORDER_MARKER : 'photographic-prints',
          amount,
          items: lines.map((line) => ({
            name: `${line.title} — ${line.formatLabel} (${line.finishLabel})`.slice(0, 127),
            quantity: String(line.quantity),
            unit_amount: { currency_code: 'EUR', value: centsToPaypalValue(line.unitPriceCents) },
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
    if (error instanceof PromoExpiredError) {
      return res.status(400).json({ code: 'PROMO_EXPIRED', error: error.message })
    }
    if (error instanceof PromoCodeError) {
      return res.status(400).json({ code: 'PROMO_INVALID', error: error.message })
    }
    if (error instanceof PaypalApiError) {
      const diagnostic = paypalErrorDiagnostic(error)
      console.error('create-order: PayPal error', JSON.stringify(diagnostic))
      if (diagnostic.details.some((detail) => detail.issue === 'PAYEE_ACCOUNT_RESTRICTED')) {
        return res.status(503).json({
          error: 'Le compte marchand PayPal Live ne peut pas recevoir ce paiement pour le moment.',
          code: 'PAYPAL_PAYEE_RESTRICTED',
        })
      }
      return res.status(502).json({
        error: 'La création de la commande PayPal a échoué.',
        code: 'PAYPAL_CREATE_FAILED',
      })
    }
    console.error('create-order: unexpected error', error)
    return res.status(500).json({ error: 'Erreur serveur inattendue.' })
  }
}
