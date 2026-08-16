import {
  PREOPENING_PROMO_CODE,
  PREOPENING_PROMO_ORDER_MARKER,
  PREOPENING_PROMO_PRICE,
  SALES_OPEN_AT_ISO,
  SALES_OPEN_AT_MS,
} from '../../src/data/sales.js'

export { PREOPENING_PROMO_ORDER_MARKER, PREOPENING_PROMO_PRICE, SALES_OPEN_AT_ISO }

export function arePublicSalesOpen(now = Date.now()) {
  return now >= SALES_OPEN_AT_MS
}

export class SalesClosedError extends Error {}
export class PromoCodeError extends Error {}

export function isPreopeningPromoCode(value: unknown) {
  return !arePublicSalesOpen()
    && typeof value === 'string'
    && value.trim().toLowerCase() === PREOPENING_PROMO_CODE
}
