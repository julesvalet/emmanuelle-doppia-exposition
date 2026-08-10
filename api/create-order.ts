import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { priceCartLines, PricingError } from './_lib/pricing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { lines, total } = priceCartLines(body?.items)

    const accessToken = await getAccessToken()
    const order = await paypalFetch<{ id: string }>('/v2/checkout/orders', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'EUR', value: total.toFixed(2) },
            },
          },
          items: lines.map((line) => ({
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
    if (error instanceof PaypalApiError) {
      console.error('create-order: PayPal error', error.status, error.details)
      return res.status(502).json({ error: 'La création de la commande PayPal a échoué.' })
    }
    console.error('create-order: unexpected error', error)
    return res.status(500).json({ error: 'Erreur serveur inattendue.' })
  }
}
