import type { VercelRequest, VercelResponse } from '@vercel/node'
import { EmailError, sendOrderNotificationEmail, type OrderNotificationLine } from './_lib/email.js'
import { centsToPaypalValue } from './_lib/money.js'
import { getAccessToken, paypalErrorDiagnostic, paypalFetch, PaypalApiError } from './_lib/paypal.js'
import { priceCartLines } from './_lib/pricing.js'
import { arePublicSalesOpen, PROMO_ORDER_MARKER, PROMO_PRICE } from './_lib/sales.js'
import { parseShippingAddress } from './_lib/shipping.js'
import { getUserFromAccessToken, supabaseAdmin } from './_lib/supabase.js'

const PROMO_PRICE_VALUE = centsToPaypalValue(Math.round(PROMO_PRICE * 100))
const UNIQUE_VIOLATION = '23505'

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
    const shippingAddress = parseShippingAddress(body?.shippingAddress)
    const numeroPaypal = captureDetail?.id ?? capture.id
    const customerName = [capture.payer?.name?.given_name, capture.payer?.name?.surname].filter(Boolean).join(' ')

    // Re-derive the full, structured line detail (title, artwork number, format, Dibond option,
    // quantity, unit price) from the trusted server-side catalogue — never from PayPal's own
    // flattened, 127-char-truncated item name string, and never from a price the client sent.
    // priceCartLines() ignores any price the client supplies; it only reads *which* artworks
    // were selected and re-prices them from src/data/catalogue.ts, exactly like create-order.ts.
    let lines: OrderNotificationLine[] = []
    let nominalTotal = 0
    try {
      const priced = priceCartLines(body?.items)
      lines = priced.lines.map((line) => ({
        artworkNumber: line.artworkNumber,
        title: line.title,
        formatLabel: line.formatLabel,
        dibond: line.finishId === 'with-support',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      }))
      nominalTotal = priced.total
    } catch (pricingError) {
      // The payment already succeeded — a malformed/missing items payload must not block the
      // response, it just means the email/history fall back to PayPal's own (less detailed)
      // item summary below instead of the fully structured breakdown.
      console.error('capture-order: could not re-derive priced lines for the receipt', pricingError)
      lines = (purchaseUnit?.items ?? []).map((item) => ({
        artworkNumber: 0,
        title: item.name,
        formatLabel: '',
        dibond: false,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unit_amount?.value ?? 0),
        lineTotal: (Number(item.unit_amount?.value ?? 0)) * (Number(item.quantity) || 1),
      }))
      nominalTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
    }

    // The payment already succeeded above — a notification failure must never turn a
    // successful purchase into an error response for the customer.
    try {
      await sendOrderNotificationEmail({
        orderID: capture.id,
        captureID: captureDetail?.id,
        amountValue: resolvedAmountValue,
        amountCurrency: resolvedAmountCurrency,
        nominalTotal,
        promoApplied: isPromoOrder,
        capturedAt: new Date(),
        customerName,
        customerEmail: capture.payer?.email_address,
        lines,
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
          articles: lines,
          montant_total: Number(resolvedAmountValue),
          numero_paypal: numeroPaypal,
          statut: capture.status,
          adresse_livraison: shippingAddress,
        })
        if (insertError) {
          // A unique violation on numero_paypal means this exact capture was already recorded
          // (capture-order called twice for the same order) — expected on retry, not an error.
          if (insertError.code === UNIQUE_VIOLATION) {
            console.log('capture-order: order already recorded for this PayPal capture, skipped duplicate insert', numeroPaypal)
          } else {
            console.error('capture-order: failed to record order in Supabase', insertError)
          }
        }
      } catch (dbError) {
        console.error('capture-order: failed to record order in Supabase', dbError)
      }
    } else {
      console.error('capture-order: Supabase service role not configured — order history was not recorded for', numeroPaypal)
    }

    return res.status(200).json({
      orderID: capture.id,
      status: capture.status,
      captureID: captureDetail?.id,
      amount: captureDetail?.amount,
      payer: {
        name: customerName,
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
