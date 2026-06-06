import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Returns a Supabase browser client for client-side use (anon key, insert funnel_responses).
 * Returns null gracefully if env vars are missing — callers must handle null without throwing.
 */
export function getBrowserSupabase(): ReturnType<typeof createBrowserClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!_client) {
    _client = createBrowserClient(url, key)
  }
  return _client
}
