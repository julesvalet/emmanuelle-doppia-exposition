import { catalogue } from '../../src/data/catalogue.js'

export type CartLineInput = {
  artworkNumber: number
  formatId: string
  finishId: string
  quantity: number
}

export type PricedLine = CartLineInput & {
  title: string
  formatLabel: string
  finishLabel: string
  unitPrice: number
  lineTotal: number
}

export class PricingError extends Error {}

// Recalcule chaque ligne et le total à partir du catalogue officiel (src/data/catalogue.ts) :
// le montant envoyé par le client n'est jamais utilisé pour la commande PayPal.
export function priceCartLines(input: unknown): { lines: PricedLine[]; total: number } {
  if (!Array.isArray(input) || input.length === 0) {
    throw new PricingError('Le panier est vide.')
  }
  if (input.length > 50) {
    throw new PricingError('Panier trop volumineux.')
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

  return { lines, total }
}
