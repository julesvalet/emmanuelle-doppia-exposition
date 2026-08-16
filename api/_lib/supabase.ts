import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type TestAvailability = { stock: number; available: number }
type TestReservation = { status: 'reserved' | 'capturing' | 'captured' | 'released' }

let client: SupabaseClient | null = null

function getServerSupabase() {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured on the server.')
  }
  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}

function firstRow<T>(data: unknown): T {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') throw new Error('Unexpected Supabase RPC response.')
  return row as T
}

export async function getTestAvailability(): Promise<TestAvailability> {
  const { data, error } = await getServerSupabase().rpc('get_paypal_test_availability')
  if (error) throw error
  const row = firstRow<{ stock: number | string; available: number | string }>(data)
  return { stock: Number(row.stock), available: Number(row.available) }
}

export async function reserveTestOrder(orderID: string): Promise<boolean> {
  const { data, error } = await getServerSupabase().rpc('reserve_paypal_test_order', { p_paypal_order_id: orderID })
  if (error) throw error
  return data === true
}

export async function getTestReservation(orderID: string): Promise<TestReservation | null> {
  const { data, error } = await getServerSupabase()
    .from('paypal_test_reservations')
    .select('status')
    .eq('paypal_order_id', orderID)
    .maybeSingle()
  if (error) throw error
  return data as TestReservation | null
}

export async function claimTestOrder(orderID: string): Promise<boolean> {
  const { data, error } = await getServerSupabase().rpc('claim_paypal_test_order', { p_paypal_order_id: orderID })
  if (error) throw error
  return data === true
}

export async function releaseTestClaim(orderID: string): Promise<void> {
  const { error } = await getServerSupabase().rpc('release_paypal_test_claim', { p_paypal_order_id: orderID })
  if (error) throw error
}

export async function finalizeTestCapture(orderID: string, captureID: string): Promise<number> {
  const { data, error } = await getServerSupabase().rpc('finalize_paypal_test_capture', {
    p_paypal_order_id: orderID,
    p_capture_id: captureID,
  })
  if (error) throw error
  if (typeof data !== 'number') throw new Error('Unexpected stock response after capture.')
  return data
}
