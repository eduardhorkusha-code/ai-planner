// server-only, ніколи не імпортувати в клієнтський компонент
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

/**
 * Returns a Supabase service-role client for server-side admin reads (bypasses RLS).
 * Returns null gracefully if env vars are missing — build stays green without service key.
 * NEVER import this in a 'use client' component.
 */
export function getAdminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!_admin) {
    _admin = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _admin
}
