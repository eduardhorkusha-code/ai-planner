import { getAdminSupabase } from '@/lib/supabase/admin'

interface FunnelRow {
  id: string
  session_id: string
  purpose: string | null
  persona: string | null
  answers: Record<string, unknown> | null
  created_at: string
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-ios-caption text-ios-label2 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-ios-gray3 rounded-full h-2">
        <div
          className="bg-ios-blue h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso.slice(0, 16)
  }
}

export default async function AdminPage({ searchParams }: Props) {
  // Key gate
  const adminKey = process.env.ADMIN_KEY
  if (adminKey) {
    const params = await searchParams
    const provided = Array.isArray(params.key) ? params.key[0] : params.key
    if (provided !== adminKey) {
      return (
        <main className="min-h-screen bg-ios-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <p className="text-ios-label2 text-ios-footnote">
              Доступ за ключем: додайте{' '}
              <code className="bg-ios-bg2 px-1 rounded text-ios-blue">?key=...</code>
            </p>
          </div>
        </main>
      )
    }
  }

  const supabase = getAdminSupabase()

  if (!supabase) {
    return (
      <main className="min-h-screen bg-ios-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <p className="text-ios-label2 text-ios-footnote">
            Supabase не налаштовано (додайте{' '}
            <code className="bg-ios-bg2 px-1 rounded text-ios-blue">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            )
          </p>
        </div>
      </main>
    )
  }

  // Fetch all rows for metrics + last 10
  const { data: rows, error } = await supabase
    .from('funnel_responses')
    .select('id, session_id, purpose, persona, answers, created_at')
    .order('created_at', { ascending: false })

  if (error || !rows) {
    return (
      <main className="min-h-screen bg-ios-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <p className="text-ios-red text-ios-footnote">Помилка: {error?.message ?? 'немає даних'}</p>
        </div>
      </main>
    )
  }

  const all = rows as FunnelRow[]
  const total = all.length

  // Persona counts
  const personaCounts: Record<string, number> = {}
  for (const r of all) {
    const p = r.persona ?? '(не вказано)'
    personaCounts[p] = (personaCounts[p] ?? 0) + 1
  }
  const personaEntries = Object.entries(personaCounts).sort((a, b) => b[1] - a[1])
  const maxPersona = personaEntries[0]?.[1] ?? 1

  // Purpose counts
  const purposeCounts: Record<string, number> = {}
  for (const r of all) {
    const p = r.purpose ?? '(не вказано)'
    purposeCounts[p] = (purposeCounts[p] ?? 0) + 1
  }
  const purposeEntries = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])
  const maxPurpose = purposeEntries[0]?.[1] ?? 1

  // Funnel depth: total → has persona (step 2) → has answers.volume (last step)
  const reachedPersona = all.filter((r) => r.persona != null).length
  const reachedVolume = all.filter(
    (r) => r.answers != null && typeof r.answers === 'object' && 'volume' in r.answers,
  ).length

  const last10 = all.slice(0, 10)

  return (
    <main className="min-h-screen bg-ios-bg text-ios-label p-4 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 pt-2">
          <h1 className="text-ios-title2 text-ios-label tracking-tight">Аналітика воронки</h1>
          <p className="text-ios-caption text-ios-label3 mt-0.5">funnel_responses · AI Planner</p>
        </div>

        {/* Top metrics */}
        <section className="bg-ios-bg2 rounded-2xl p-4 mb-4">
          <h2 className="text-ios-caption text-ios-label3 uppercase tracking-widest mb-3">
            Загальне
          </h2>
          <div className="text-ios-title1 text-ios-blue">{total}</div>
          <div className="text-ios-caption text-ios-label3 mt-0.5">відповідей у базі</div>
        </section>

        {/* Funnel levels */}
        <section className="bg-ios-bg2 rounded-2xl p-4 mb-4">
          <h2 className="text-ios-caption text-ios-label3 uppercase tracking-widest mb-3">
            Воронка
          </h2>
          {total === 0 ? (
            <p className="text-ios-footnote text-ios-label3">Немає даних</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-ios-caption text-ios-label2 mb-1">
                  <span>Розпочали (всього)</span>
                  <span>{total} · 100%</span>
                </div>
                <div className="w-full bg-ios-gray3 rounded-full h-2">
                  <div className="bg-ios-blue h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-ios-caption text-ios-label2 mb-1">
                  <span>Крок 2 (persona)</span>
                  <span>
                    {reachedPersona} ·{' '}
                    {total > 0 ? Math.round((reachedPersona / total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-ios-gray3 rounded-full h-2">
                  <div
                    className="bg-ios-blue/70 h-2 rounded-full"
                    style={{
                      width: `${total > 0 ? Math.round((reachedPersona / total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-ios-caption text-ios-label2 mb-1">
                  <span>Фінал (volume)</span>
                  <span>
                    {reachedVolume} ·{' '}
                    {total > 0 ? Math.round((reachedVolume / total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-ios-gray3 rounded-full h-2">
                  <div
                    className="bg-ios-blue/40 h-2 rounded-full"
                    style={{
                      width: `${total > 0 ? Math.round((reachedVolume / total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Persona breakdown */}
        <section className="bg-ios-bg2 rounded-2xl p-4 mb-4">
          <h2 className="text-ios-caption text-ios-label3 uppercase tracking-widest mb-3">
            Persona
          </h2>
          {personaEntries.length === 0 ? (
            <p className="text-ios-footnote text-ios-label3">Немає даних</p>
          ) : (
            personaEntries.map(([label, count]) => (
              <Bar key={label} label={label} value={count} max={maxPersona} />
            ))
          )}
        </section>

        {/* Purpose breakdown */}
        <section className="bg-ios-bg2 rounded-2xl p-4 mb-4">
          <h2 className="text-ios-caption text-ios-label3 uppercase tracking-widest mb-3">
            Purpose
          </h2>
          {purposeEntries.length === 0 ? (
            <p className="text-ios-footnote text-ios-label3">Немає даних</p>
          ) : (
            purposeEntries.map(([label, count]) => (
              <Bar key={label} label={label} value={count} max={maxPurpose} />
            ))
          )}
        </section>

        {/* Last 10 responses */}
        <section className="bg-ios-bg2 rounded-2xl p-4 mb-8">
          <h2 className="text-ios-caption text-ios-label3 uppercase tracking-widest mb-3">
            Останні 10
          </h2>
          {last10.length === 0 ? (
            <p className="text-ios-footnote text-ios-label3">Немає даних</p>
          ) : (
            <div className="divide-y divide-ios-sep">
              {last10.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 py-2 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-ios-footnote text-ios-label truncate">
                      {r.persona ?? '—'} · {r.purpose ?? '—'}
                    </div>
                    <div className="text-ios-caption text-ios-label3 mt-0.5 font-mono">
                      {r.session_id.slice(0, 8)}…
                    </div>
                  </div>
                  <div className="text-ios-caption text-ios-label3 shrink-0 mt-0.5">
                    {formatDate(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
