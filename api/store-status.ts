import type { VercelRequest, VercelResponse } from '@vercel/node'
import { arePublicSalesOpen, SALES_OPEN_AT_ISO } from './_lib/sales.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    serverTime: new Date().toISOString(),
    salesOpenAt: SALES_OPEN_AT_ISO,
    salesOpen: arePublicSalesOpen(),
  })
}
