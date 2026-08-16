type PaypalMoney = { currency_code: 'EUR'; value: string }

export function centsToPaypalValue(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('Invalid integer amount in cents.')
  }
  return (cents / 100).toFixed(2)
}

export function buildPaypalAmount(itemTotalCents: number, finalTotalCents: number) {
  if (!Number.isSafeInteger(itemTotalCents) || !Number.isSafeInteger(finalTotalCents)) {
    throw new Error('PayPal amounts must be integer cents.')
  }
  if (finalTotalCents <= 0 || itemTotalCents < finalTotalCents) {
    throw new Error('PayPal final amount must be positive and no greater than item total.')
  }

  const money = (cents: number): PaypalMoney => ({
    currency_code: 'EUR',
    value: centsToPaypalValue(cents),
  })
  const discountCents = itemTotalCents - finalTotalCents

  return {
    currency_code: 'EUR' as const,
    value: centsToPaypalValue(finalTotalCents),
    breakdown: {
      item_total: money(itemTotalCents),
      ...(discountCents > 0 ? { discount: money(discountCents) } : {}),
    },
  }
}
