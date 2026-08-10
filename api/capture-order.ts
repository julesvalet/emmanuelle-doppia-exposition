import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, paypalFetch, PaypalApiError } from './_lib/paypal.js'

type CaptureOrderResponse = {
  id: string
  status: string
  payer?: {
    name?: { given_name?: string; surname?: string }
    email_address?: string
  }
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string
        amount?: { currency_code: string; value: string }
      }>
    }
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const orderID = body?.orderID
    if (typeof orderID !== 'string' || !orderID) {
      return res.status(400).json({ error: 'Identifiant de commande manquant.' })
    }

    const accessToken = await getAccessToken()
    const capture = await paypalFetch<CaptureOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, accessToken, {
      method: 'POST',
    })

    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Le paiement n’a pas pu être finalisé.', status: capture.status })
    }

    const purchaseUnit = capture.purchase_units?.[0]
    const captureDetail = purchaseUnit?.payments?.captures?.[0]

    return res.status(200).json({
      orderID: capture.id,
      status: capture.status,
      captureID: captureDetail?.id,
      amount: captureDetail?.amount,
      payer: {
        name: [capture.payer?.name?.given_name, capture.payer?.name?.surname].filter(Boolean).join(' '),
        email: capture.payer?.email_address,
      },
    })
  } catch (error) {
    if (error instanceof PaypalApiError) {
      console.error('capture-order: PayPal error', error.status, error.details)
      return res.status(502).json({ error: 'La capture du paiement PayPal a échoué.' })
    }
    console.error('capture-order: unexpected error', error)
    return res.status(500).json({ error: 'Erreur serveur inattendue.' })
  }
}
