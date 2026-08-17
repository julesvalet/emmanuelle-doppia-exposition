import type { VercelRequest, VercelResponse } from '@vercel/node'
import { EmailError, sendOrderNotificationEmail } from './_lib/email.js'
import { centsToPaypalValue } from './_lib/money.js'
import { getAccessToken, paypalErrorDiagnostic, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { arePublicSalesOpen, PROMO_ORDER_MARKER, PROMO_PRICE } from './_lib/sales.js'
import { parseShippingAddress } from './_lib/shipping.js'
import { getUserFromAccessToken, supabaseAdmin } from './_lib/supabase.js'

const PROMO_PRICE_VALUE = centsToPaypalValue(Math.round(PROMO_PRICE * 100))

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
    items?: Array<{
      name: string
      quantity: string
      unit_amount?: { currency_code: string; value: string }
    }>
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
    const isPromoOrder = capture.purchase_units?.[0]?.custom_id === PROMO_ORDER_MARKER

    if (isPromoOrder) {
      const orderAmount = capture.purchase_units?.[0]?.amount
      if (orderAmount?.currency_code !== 'EUR' || orderAmount.value !== PROMO_PRICE_VALUE) {
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
        && captureDetail.amount.value === PROMO_PRICE_VALUE
        && typeof captureDetail.id === 'string'

      if (!isOfficialPromoPayment) {
        console.error('capture-order: invalid promotional order payload', orderID)
        return res.status(409).json({ code: 'PROMO_INVALID', error: 'La commande promotionnelle ne correspond pas au prix officiel.' })
      }
    }

    const resolvedAmountValue = captureDetail?.amount?.value ?? purchaseUnit?.amount?.value ?? '0.00'
    const resolvedAmountCurrency = captureDetail?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code ?? 'EUR'
    const orderItems = (purchaseUnit?.items ?? []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitAmount: item.unit_amount?.value ?? '',
      currency: item.unit_amount?.currency_code ?? 'EUR',
    }))
    const shippingAddress = parseShippingAddress(body?.shippingAddress)

    // The payment already succeeded above — a notification failure must never turn a
    // successful purchase into an error response for the customer.
    try {
      await sendOrderNotificationEmail({
        orderID: capture.id,
        captureID: captureDetail?.id,
        amountValue: resolvedAmountValue,
        amountCurrency: resolvedAmountCurrency,
        capturedAt: new Date(),
        customerEmail: capture.payer?.email_address,
        items: orderItems,
        shipping: shippingAddress,
      })
    } catch (emailError) {
      if (emailError instanceof EmailError) {
        console.error('capture-order: order notification email failed', emailError.status, emailError.message)
      } else {
        console.error('capture-order: order notification email failed', emailError)
      }
    }

    // Same rule as the email above: recording the order for the customer's order history must
    // never turn an already-successful payment into an error response.
    if (supabaseAdmin) {
      try {
        const user = await getUserFromAccessToken(body?.accessToken)
        const { error: insertError } = await supabaseAdmin.from('commandes').insert({
          user_id: user?.id ?? null,
          email_client: capture.payer?.email_address ?? null,
          articles: orderItems,
          montant_total: Number(resolvedAmountValue),
          numero_paypal: captureDetail?.id ?? capture.id,
          statut: capture.status,
          adresse_livraison: shippingAddress,
        })
        if (insertError) console.error('capture-order: failed to record order in Supabase', insertError)
      } catch (dbError) {
        console.error('capture-order: failed to record order in Supabase', dbError)
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
