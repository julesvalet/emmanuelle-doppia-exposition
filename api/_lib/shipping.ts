export type ShippingAddress = {
  address: string
  postalCode: string
  city: string
  country: string
  floor?: string
  doorName?: string
}

// Required fields mirror the client-side form (api/../src/components/CartPanel.tsx): address,
// postal code, city, country. Floor and door name are optional delivery hints. Returns null
// rather than throwing — a missing/malformed address must never block the payment capture that
// already succeeded, it just means the notification email says so instead.
export function parseShippingAddress(input: unknown): ShippingAddress | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''

  const address = text(raw.address)
  const postalCode = text(raw.postalCode)
  const city = text(raw.city)
  const country = text(raw.country)
  const floor = text(raw.floor)
  const doorName = text(raw.doorName)

  if (!address || !postalCode || !city || !country) return null

  return {
    address,
    postalCode,
    city,
    country,
    ...(floor ? { floor } : {}),
    ...(doorName ? { doorName } : {}),
  }
}
