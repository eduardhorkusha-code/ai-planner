import { getBrowserSupabase } from '@/lib/supabase/browser'

export type FunnelResponse = {
  purpose: string
  persona: string
  answers: Record<string, unknown>
}

const SESSION_ID_KEY = 'ai_planner_session_id'
const FUNNEL_LOCAL_KEY = 'ai_planner_funnel'

function getSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  let id = localStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

export async function submitFunnel(
  r: FunnelResponse
): Promise<{ ok: boolean; via: 'supabase' | 'local' }> {
  const client = getBrowserSupabase()

  if (client) {
    try {
      const { error } = await client.from('funnel_responses').insert({
        session_id: getSessionId(),
        purpose: r.purpose,
        persona: r.persona,
        answers: r.answers,
      })
      if (!error) return { ok: true, via: 'supabase' }
      // fall through to local on Supabase error
    } catch {
      // fall through to local on network error
    }
  }

  // Fallback: persist to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(FUNNEL_LOCAL_KEY) ?? '[]') as unknown[]
    existing.push({ ...r, session_id: getSessionId(), created_at: new Date().toISOString() })
    localStorage.setItem(FUNNEL_LOCAL_KEY, JSON.stringify(existing))
  } catch {
    // ignore storage errors — silent degradation
  }

  return { ok: true, via: 'local' }
}
