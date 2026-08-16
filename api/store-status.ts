import type { VercelRequest, VercelResponse } from '@vercel/node'
import { arePublicSalesOpen, SALES_OPEN_AT_ISO } from './_lib/sales.js'
import { getTestAvailability } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const availability = await getTestAvailability()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      serverTime: new Date().toISOString(),
      salesOpenAt: SALES_OPEN_AT_ISO,
      salesOpen: arePublicSalesOpen(),
      testStock: availability.stock,
      testAvailable: availability.available,
    })
  } catch (error) {
    console.error('store-status: unexpected error', error)
    return res.status(503).json({ error: 'Le statut de la boutique est temporairement indisponible.' })
  }
}
