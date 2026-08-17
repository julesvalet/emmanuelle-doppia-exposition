import type { ShippingAddress } from './shipping.js'

const RESEND_API_URL = 'https://api.resend.com/emails'
const NOTIFICATION_RECIPIENT = 'emmanuelledoppia@photo-ml.fr'

export class EmailError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export type OrderNotificationItem = {
  name: string
  quantity: string
  unitAmount: string
  currency: string
}

export type OrderNotificationParams = {
  orderID: string
  captureID?: string
  amountValue: string
  amountCurrency: string
  capturedAt: Date
  customerEmail?: string
  items: OrderNotificationItem[]
  shipping: ShippingAddress | null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ))
}

function shippingLines(shipping: ShippingAddress | null): string[] {
  if (!shipping) return ['Adresse de livraison non renseignée.']
  const lines = [
    shipping.address,
    `${shipping.postalCode} ${shipping.city}`,
    shipping.country,
  ]
  if (shipping.floor) lines.push(`Étage : ${shipping.floor}`)
  if (shipping.doorName) lines.push(`Nom sur la porte / boîte aux lettres : ${shipping.doorName}`)
  return lines
}

// Never lets a notification failure affect the payment response — the capture has already
// succeeded by the time this runs (see api/capture-order.ts), so the caller wraps this in a
// try/catch and only logs on failure.
export async function sendOrderNotificationEmail(params: OrderNotificationParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('sendOrderNotificationEmail: RESEND_API_KEY is not configured — notification email skipped.')
    return
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const formattedDate = params.capturedAt.toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const itemLines = params.items.map((item) => `${item.quantity} × ${item.name} — ${item.unitAmount} ${item.currency}`)
  const addressLines = shippingLines(params.shipping)
  const customerEmail = params.customerEmail || 'Non communiqué par PayPal.'

  const text = [
    'Nouvelle commande confirmée',
    '',
    `Montant : ${params.amountValue} ${params.amountCurrency}`,
    `Date : ${formattedDate}`,
    `Commande PayPal : ${params.orderID}${params.captureID ? ` (capture ${params.captureID})` : ''}`,
    '',
    'Détail de la commande :',
    ...itemLines.map((line) => `- ${line}`),
    '',
    'Adresse de livraison :',
    ...addressLines,
    '',
    `Contact client : ${customerEmail}`,
  ].join('\n')

  const html = `
    <h2>Nouvelle commande confirmée</h2>
    <p>
      <strong>Montant :</strong> ${escapeHtml(params.amountValue)} ${escapeHtml(params.amountCurrency)}<br>
      <strong>Date :</strong> ${escapeHtml(formattedDate)}<br>
      <strong>Commande PayPal :</strong> ${escapeHtml(params.orderID)}${params.captureID ? ` (capture ${escapeHtml(params.captureID)})` : ''}
    </p>
    <h3>Détail de la commande</h3>
    <ul>${itemLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    <h3>Adresse de livraison</h3>
    <p>${addressLines.map(escapeHtml).join('<br>')}</p>
    <h3>Contact client</h3>
    <p>${escapeHtml(customerEmail)}</p>
  `

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: NOTIFICATION_RECIPIENT,
      subject: `Nouvelle commande — ${params.amountValue} ${params.amountCurrency}`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new EmailError(`Resend API error: ${details}`, response.status)
  }
}
