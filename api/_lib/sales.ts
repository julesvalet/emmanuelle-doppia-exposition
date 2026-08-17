import {
  PROMO_CODE,
  PROMO_ORDER_MARKER,
  PROMO_PRICE,
  PROMO_VALID_FROM_MS,
  PROMO_VALID_UNTIL_MS,
  SALES_OPEN_AT_ISO,
  SALES_OPEN_AT_MS,
} from '../../src/data/sales.js'

export { PROMO_ORDER_MARKER, PROMO_PRICE, SALES_OPEN_AT_ISO }

export function arePublicSalesOpen(now = Date.now()) {
  return now >= SALES_OPEN_AT_MS
}

export class SalesClosedError extends Error {}
export class PromoCodeError extends Error {}
export class PromoExpiredError extends Error {}

function isPromoCodeText(value: unknown) {
  return typeof value === 'string' && value.trim().toLowerCase() === PROMO_CODE
}

export function isPromoWindowOpen(now = Date.now()) {
  return now >= PROMO_VALID_FROM_MS && now < PROMO_VALID_UNTIL_MS
}

// The code and the date window are checked separately so the caller can tell "wrong code" apart
// from "right code, but no longer valid" and show the appropriate message for each.
export function checkPromoCode(value: unknown, now = Date.now()): 'valid' | 'expired' | 'invalid' {
  if (!isPromoCodeText(value)) return 'invalid'
  return isPromoWindowOpen(now) ? 'valid' : 'expired'
}
