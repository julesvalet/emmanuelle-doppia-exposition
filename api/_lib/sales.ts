import { SALES_OPEN_AT_ISO, SALES_OPEN_AT_MS, TEST_PRODUCT_ID } from '../../src/data/sales.js'

export { SALES_OPEN_AT_ISO, TEST_PRODUCT_ID }

export function arePublicSalesOpen(now = Date.now()) {
  return now >= SALES_OPEN_AT_MS
}

export class SalesClosedError extends Error {}
