import { createClient, type User } from '@supabase/supabase-js'

// Server-side only: the service role key bypasses RLS, so this client must never be exposed to
// the browser. Reuses VITE_SUPABASE_URL — Vite's VITE_ prefix only controls what gets bundled
// into client JS, Vercel still exposes the variable to serverless functions regardless.
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// Resolves the customer's Supabase user from the access token their browser session holds —
// never trust a client-submitted user id directly, always re-verify the token server-side.
export async function getUserFromAccessToken(accessToken: unknown): Promise<User | null> {
  if (!supabaseAdmin || typeof accessToken !== 'string' || !accessToken) return null
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}
