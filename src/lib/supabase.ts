import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed.replace(/\/rest\/v1$/i, '') : undefined
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && key)

const client: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error('SantaSwap is not configured yet. Please try again later.')
  }
  return client
}
