const isLive = process.env.PAYPAL_ENV === 'live'

export const PAYPAL_API_BASE = isLive
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export class PaypalApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

type PaypalErrorDetail = {
  issue?: unknown
  description?: unknown
  field?: unknown
  location?: unknown
}

type PaypalErrorBody = {
  name?: unknown
  message?: unknown
  debug_id?: unknown
  details?: unknown
}

function stringOrUndefined(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

// Strict allow-list for diagnostics: credentials, OAuth tokens, request headers, payment
// sources and customer data are never copied into logs or responses.
export function paypalErrorDiagnostic(error: PaypalApiError) {
  const body = error.details && typeof error.details === 'object'
    ? error.details as PaypalErrorBody
    : null
  const details = Array.isArray(body?.details)
    ? body.details.map((raw) => {
      const detail = raw && typeof raw === 'object' ? raw as PaypalErrorDetail : {}
      return {
        issue: stringOrUndefined(detail.issue),
        description: stringOrUndefined(detail.description),
        field: stringOrUndefined(detail.field),
        location: stringOrUndefined(detail.location),
      }
    })
    : []

  return {
    status: error.status,
    name: stringOrUndefined(body?.name),
    message: stringOrUndefined(body?.message),
    debug_id: stringOrUndefined(body?.debug_id),
    details,
  }
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) {
    throw new Error('PAYPAL_CLIENT_ID / PAYPAL_SECRET ne sont pas configurées sur le serveur.')
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new PaypalApiError('Authentification PayPal échouée.', response.status, await response.text().catch(() => undefined))
  }

  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function paypalFetch<T = unknown>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new PaypalApiError('Erreur PayPal.', response.status, data)
  }
  return data as T
}
