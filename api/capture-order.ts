import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, paypalErrorDiagnostic, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { arePublicSalesOpen, PREOPENING_PROMO_ORDER_MARKER } from './_lib/sales.js'

type CaptureOrderResponse = {
  id: string
  status: string
  payer?: {
    name?: { given_name?: string; surname?: string }
    email_address?: string
  }
  purchase_units?: Array<{
    custom_id?: string
    amount?: { currency_code: string; value: string }
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
    const orderPath = `/v2/checkout/orders/${encodeURIComponent(orderID)}`
    let capture = await paypalFetch<CaptureOrderResponse>(orderPath, accessToken)
    const isPromoOrder = capture.purchase_units?.[0]?.custom_id === PREOPENING_PROMO_ORDER_MARKER

    if (isPromoOrder) {
      const orderAmount = capture.purchase_units?.[0]?.amount
      if (orderAmount?.currency_code !== 'EUR' || orderAmount.value !== '1.00') {
        return res.status(409).json({ code: 'PROMO_INVALID', error: 'La commande promotionnelle ne correspond pas au prix officiel.' })
      }
    }

    if (!arePublicSalesOpen() && !isPromoOrder) {
      return res.status(403).json({
        code: 'SALES_NOT_OPEN',
        error: 'Les précommandes ouvrent le 17 août à 19:00, heure de Paris.',
      })
    }

    if (capture.status !== 'COMPLETED') {
      try {
        capture = await paypalFetch<CaptureOrderResponse>(`${orderPath}/capture`, accessToken, { method: 'POST' })
      } catch (captureError) {
        // A network/PayPal error can arrive after PayPal accepted the capture. Re-read the
        // same order so the client can safely retry without creating another payment.
        try {
          const recovered = await paypalFetch<CaptureOrderResponse>(orderPath, accessToken)
          if (recovered.status === 'COMPLETED') {
            capture = recovered
          } else {
            throw captureError
          }
        } catch (recoveryError) {
          if (recoveryError === captureError) throw recoveryError
          throw captureError
        }
      }
    }

    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Le paiement n’a pas pu être finalisé.', status: capture.status })
    }

    const purchaseUnit = capture.purchase_units?.[0]
    const captureDetail = purchaseUnit?.payments?.captures?.[0]

    if (isPromoOrder) {
      const isOfficialPromoPayment = captureDetail?.amount?.currency_code === 'EUR'
        && captureDetail.amount.value === '1.00'
        && typeof captureDetail.id === 'string'

      if (!isOfficialPromoPayment) {
        console.error('capture-order: invalid promotional order payload', orderID)
        return res.status(409).json({ code: 'PROMO_INVALID', error: 'La commande promotionnelle ne correspond pas au prix officiel.' })
      }
    }

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
      console.error('capture-order: PayPal error', JSON.stringify(paypalErrorDiagnostic(error)))
      return res.status(502).json({ error: 'La capture du paiement PayPal a échoué.' })
    }
    console.error('capture-order: unexpected error', error)
    return res.status(500).json({ error: 'Erreur serveur inattendue.' })
  }
}
