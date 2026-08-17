export const SALES_OPEN_AT_ISO = '2026-08-17T17:00:00.000Z'
export const SALES_OPEN_AT_MS = Date.parse(SALES_OPEN_AT_ISO)

// Valid for 2026-08-17 only, Europe/Paris time (CEST, UTC+2 in August):
// 00:00 Paris = 2026-08-16T22:00:00Z, next midnight Paris = 2026-08-17T22:00:00Z.
export const PROMO_CODE = 'vlt07test'
export const PROMO_PRICE = 1
export const PROMO_ORDER_MARKER = 'promo-vlt07test'
export const PROMO_VALID_FROM_ISO = '2026-08-16T22:00:00.000Z'
export const PROMO_VALID_UNTIL_ISO = '2026-08-17T22:00:00.000Z'
export const PROMO_VALID_FROM_MS = Date.parse(PROMO_VALID_FROM_ISO)
export const PROMO_VALID_UNTIL_MS = Date.parse(PROMO_VALID_UNTIL_ISO)
