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
