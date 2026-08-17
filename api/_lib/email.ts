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

// One structured line per artwork ordered — built server-side from the priced catalogue lines
// (api/_lib/pricing.ts), never from PayPal's flattened item name string, so the artist always
// gets the exact photo number, format and Dibond option, not a truncated free-text summary.
export type OrderNotificationLine = {
  artworkNumber: number
  title: string
  formatLabel: string
  dibond: boolean
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type OrderNotificationParams = {
  orderID: string
  captureID?: string
  amountValue: string
  amountCurrency: string
  nominalTotal: number
  promoApplied: boolean
  capturedAt: Date
  customerName?: string
  customerEmail?: string
  lines: OrderNotificationLine[]
  shipping: ShippingAddress | null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ))
}

function formatEuros(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
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

function lineDescription(line: OrderNotificationLine): string {
  return `N° ${line.artworkNumber} — ${line.title} — Format ${line.formatLabel} — Dibond : ${line.dibond ? 'Oui' : 'Non'} — `
    + `Qté ${line.quantity} — Prix unitaire ${formatEuros(line.unitPrice)} — Sous-total ${formatEuros(line.lineTotal)}`
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

  const lineDescriptions = params.lines.map(lineDescription)
  const addressLines = shippingLines(params.shipping)
  const customerEmail = params.customerEmail || 'Non communiqué par PayPal.'
  const customerName = params.customerName || 'Non communiqué par PayPal.'
  const discount = params.promoApplied ? Math.max(0, params.nominalTotal - Number(params.amountValue)) : 0

  const text = [
    'Nouvelle commande confirmée',
    '',
    `Date : ${formattedDate}`,
    `Commande PayPal : ${params.orderID}${params.captureID ? ` (capture ${params.captureID})` : ''}`,
    `Client : ${customerName}`,
    `Email client : ${customerEmail}`,
    '',
    'Détail de la commande :',
    ...lineDescriptions.map((line) => `- ${line}`),
    '',
    `Sous-total catalogue : ${formatEuros(params.nominalTotal)}`,
    ...(params.promoApplied ? [`Réduction (code promo) : -${formatEuros(discount)}`] : []),
    `Total payé : ${params.amountValue} ${params.amountCurrency}`,
    '',
    'Adresse de livraison :',
    ...addressLines,
  ].join('\n')

  const html = `
    <h2>Nouvelle commande confirmée</h2>
    <p>
      <strong>Date :</strong> ${escapeHtml(formattedDate)}<br>
      <strong>Commande PayPal :</strong> ${escapeHtml(params.orderID)}${params.captureID ? ` (capture ${escapeHtml(params.captureID)})` : ''}<br>
      <strong>Client :</strong> ${escapeHtml(customerName)}<br>
      <strong>Email client :</strong> ${escapeHtml(customerEmail)}
    </p>
    <h3>Détail de la commande</h3>
    <ul>${lineDescriptions.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    <p>
      <strong>Sous-total catalogue :</strong> ${escapeHtml(formatEuros(params.nominalTotal))}<br>
      ${params.promoApplied ? `<strong>Réduction (code promo) :</strong> -${escapeHtml(formatEuros(discount))}<br>` : ''}
      <strong>Total payé :</strong> ${escapeHtml(params.amountValue)} ${escapeHtml(params.amountCurrency)}
    </p>
    <h3>Adresse de livraison</h3>
    <p>${addressLines.map(escapeHtml).join('<br>')}</p>
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
