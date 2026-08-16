import { catalogue } from '../../src/data/catalogue.js'
import { TEST_PRODUCT_ID, TEST_PRODUCT_PRICE, TEST_PRODUCT_TYPE } from '../../src/data/sales.js'

export type CartLineInput = {
  productType?: string
  productId?: string
  artworkNumber?: number
  formatId?: string
  finishId?: string
  quantity: number
}

export type PricedLine = CartLineInput & {
  productType: 'print' | typeof TEST_PRODUCT_TYPE
  title: string
  formatLabel: string
  finishLabel: string
  unitPrice: number
  lineTotal: number
}

export class PricingError extends Error {}

export type PricedCart = {
  kind: 'prints' | 'test'
  lines: PricedLine[]
  total: number
}

// Recalcule chaque ligne et le total à partir du catalogue officiel (src/data/catalogue.ts) :
// le montant envoyé par le client n'est jamais utilisé pour la commande PayPal.
export function priceCartLines(input: unknown): PricedCart {
  if (!Array.isArray(input) || input.length === 0) {
    throw new PricingError('Le panier est vide.')
  }
  if (input.length > 50) {
    throw new PricingError('Panier trop volumineux.')
  }

  const containsTestMarker = input.some((raw) => {
    const line = raw as Partial<CartLineInput>
    return line.productType === TEST_PRODUCT_TYPE || line.productId === TEST_PRODUCT_ID
  })

  if (containsTestMarker) {
    const line = input[0] as Partial<CartLineInput>
    if (input.length !== 1
      || line.productType !== TEST_PRODUCT_TYPE
      || line.productId !== TEST_PRODUCT_ID
      || Number(line.quantity) !== 1) {
      throw new PricingError('L’article test doit être commandé seul, en un seul exemplaire.')
    }

    return {
      kind: 'test',
      lines: [{
        productType: TEST_PRODUCT_TYPE,
        productId: TEST_PRODUCT_ID,
        quantity: 1,
        title: 'Article test PayPal Live',
        formatLabel: 'Test paiement',
        finishLabel: 'PayPal Live',
        unitPrice: TEST_PRODUCT_PRICE,
        lineTotal: TEST_PRODUCT_PRICE,
      }],
      total: TEST_PRODUCT_PRICE,
    }
  }

  const lines = input.map((raw): PricedLine => {
    const line = raw as Partial<CartLineInput>
    const artworkNumber = Number(line.artworkNumber)
    const quantity = Number(line.quantity)

    if (!Number.isInteger(artworkNumber)) {
      throw new PricingError('Œuvre invalide.')
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new PricingError('Quantité invalide.')
    }
    if (typeof line.formatId !== 'string' || typeof line.finishId !== 'string') {
      throw new PricingError('Format ou finition invalide.')
    }

    const entry = catalogue.find((candidate) => candidate.number === artworkNumber)
    if (!entry) throw new PricingError(`Œuvre inconnue : n°${artworkNumber}.`)

    const format = entry.formats.find((candidate) => candidate.id === line.formatId)
    if (!format) throw new PricingError(`Format inconnu pour l'œuvre n°${artworkNumber}.`)

    const finish = format.options.find((candidate) => candidate.id === line.finishId)
    if (!finish) throw new PricingError(`Finition inconnue pour l'œuvre n°${artworkNumber}.`)

    return {
      productType: 'print',
      artworkNumber,
      formatId: format.id,
      finishId: finish.id,
      quantity,
      title: entry.title,
      formatLabel: format.label,
      finishLabel: finish.label.fr,
      unitPrice: finish.price,
      lineTotal: Math.round(finish.price * quantity * 100) / 100,
    }
  })

  const total = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100
  if (total <= 0) throw new PricingError('Montant invalide.')

  return { kind: 'prints', lines, total }
}
