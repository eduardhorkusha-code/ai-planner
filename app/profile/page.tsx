"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { getTasks } from "@/lib/store"
import type { Task } from "@/lib/types"

// ── SVG icons ────────────────────────────────────────────────────────────────

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function IconTasks() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="15" x2="13" y2="15"/>
    </svg>
  )
}

function IconToday() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconMust() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  )
}

function IconNice() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="12 8 12 12 14 14"/>
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5-4v-4h4"/>
    </svg>
  )
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

function computeStats(tasks: Task[]) {
  const total = tasks.length
  const done = tasks.filter(t => t.status === "done").length
  const today = tasks.filter(t => t.status === "today").length
  const must = tasks.filter(t => t.priority === "must").length
  const nice = tasks.filter(t => t.priority === "nice").length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, today, must, nice, pct }
}

// ── Ring (arc) component ──────────────────────────────────────────────────────

function Ring({ pct }: { pct: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-label={`${pct}% завершено`}>
      {/* track */}
      <circle cx="48" cy="48" r={r} fill="none" stroke="#3A3A3C" strokeWidth="8"/>
      {/* progress */}
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={pct === 100 ? "#30D158" : "#0A84FF"}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {/* label */}
      <text x="48" y="44" textAnchor="middle" fill="rgba(255,255,255,1)" fontSize="18" fontWeight="700">{pct}%</text>
      <text x="48" y="61" textAnchor="middle" fill="rgba(235,235,245,0.60)" fontSize="10">done</text>
    </svg>
  )
}

// ── Bar component ─────────────────────────────────────────────────────────────

function StatBar({ label, value, max, color, icon }: {
  label: string
  value: number
  max: number
  color: string
  icon: React.ReactNode
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ios-footnote text-ios-label2">
          <span style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <span className="text-ios-footnote text-ios-label" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-ios-gray3 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </div>
    </div>
  )
}

// ── User type ─────────────────────────────────────────────────────────────────

interface UserMeta {
  name: string
  email: string
  initial: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [signingOut, setSigningOut] = useState(false)

  // Load auth + tasks on mount (client only)
  useEffect(() => {
    const sb = getBrowserSupabase()
    if (sb) {
      void sb.auth.getUser().then((res: Awaited<ReturnType<typeof sb.auth.getUser>>) => {
        const data = res.data
        if (data.user) {
          const meta = data.user.user_metadata as Record<string, string> | undefined
          const name = meta?.full_name || data.user.email || "Користувач"
          const email = data.user.email || ""
          const initial = name.charAt(0).toUpperCase()
          setUser({ name, email, initial })
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
    setTasks(getTasks())
  }, [])

  const handleSignOut = async () => {
    const sb = getBrowserSupabase()
    if (!sb) return
    setSigningOut(true)
    await sb.auth.signOut()
    router.push("/")
  }

  const stats = computeStats(tasks)

  return (
    <div className="min-h-screen bg-ios-bg text-ios-label pb-32 pt-[env(safe-area-inset-top)]">
      <div className="max-w-md mx-auto px-4">

        {/* Header */}
        <div className="pt-12 pb-6">
          <h1 className="text-ios-large-title text-ios-label">Профіль</h1>
        </div>

        {/* ── User card ──────────────────────────────── */}
        <div className="bg-ios-bg2 rounded-2xl p-5 mb-4">
          {loading ? (
            <div className="h-16 flex items-center gap-4">
              <div className="w-14 h-14 rounded-[14px] bg-ios-gray3 animate-pulse"/>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-ios-gray3 rounded-full w-32 animate-pulse"/>
                <div className="h-3 bg-ios-gray3 rounded-full w-48 animate-pulse"/>
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white text-ios-title2"
                style={{ background: "linear-gradient(135deg, #0A84FF 0%, #5AC8FA 100%)" }}
              >
                {user.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ios-headline text-ios-label truncate">{user.name}</p>
                <p className="text-ios-footnote text-ios-label2 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Guest avatar */}
              <div className="w-14 h-14 rounded-[14px] bg-ios-gray3 flex items-center justify-center flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(235,235,245,0.60)" strokeWidth="1.5" aria-hidden>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ios-headline text-ios-label">Гість</p>
                <p className="text-ios-footnote text-ios-label2">Не залогінено</p>
              </div>
            </div>
          )}
        </div>

        {/* Guest — login CTA */}
        {!loading && !user && (
          <a
            href="/login"
            className="block w-full min-h-[48px] flex items-center justify-center rounded-2xl bg-ios-blue text-white text-ios-headline mb-4 active:scale-[0.97] transition-spring"
          >
            Увійти через Google
          </a>
        )}

        {/* ── Premium banner ──────────────────────────── */}
        <div className="bg-ios-bg2 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FF9F0A22" }}>
              <span style={{ color: "#FF9F0A" }}><IconStar/></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ios-headline text-ios-label">Преміум</p>
              <p className="text-ios-footnote text-ios-label2 mt-0.5">Ранній доступ до нових фіч — підтримай проєкт</p>
            </div>
          </div>
          <a
            href="https://send.monobank.ua/jar/iBD5d6xnP"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-[14px] bg-ios-blue text-white text-ios-headline active:scale-[0.97] transition-spring"
          >
            Підтримати проєкт
            <IconExternal/>
          </a>
        </div>

        {/* ── Analytics ──────────────────────────────── */}
        <div className="bg-ios-bg2 rounded-2xl p-5 mb-4">
          <p className="text-ios-title3 text-ios-label mb-4">Аналітика</p>

          {tasks.length === 0 ? (
            <p className="text-ios-footnote text-ios-label3 text-center py-4">Ще немає задач</p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Ring + summary row */}
              <div className="flex items-center gap-5">
                <Ring pct={stats.pct}/>
                <div className="flex-1 flex flex-col gap-3">
                  <StatBar
                    label="Всього"
                    value={stats.total}
                    max={stats.total}
                    color="#636366"
                    icon={<IconTasks/>}
                  />
                  <StatBar
                    label="Виконано"
                    value={stats.done}
                    max={stats.total}
                    color="#30D158"
                    icon={<IconCheckCircle/>}
                  />
                  <StatBar
                    label="На сьогодні"
                    value={stats.today}
                    max={stats.total}
                    color="#0A84FF"
                    icon={<IconToday/>}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-ios-sep"/>

              {/* Priority breakdown */}
              <div>
                <p className="text-ios-footnote text-ios-label2 mb-3">Пріоритет</p>
                <div className="flex flex-col gap-3">
                  <StatBar
                    label="Must do"
                    value={stats.must}
                    max={stats.total}
                    color="#FF453A"
                    icon={<IconMust/>}
                  />
                  <StatBar
                    label="Nice to have"
                    value={stats.nice}
                    max={stats.total}
                    color="#636366"
                    icon={<IconNice/>}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── History row ────────────────────────────── */}
        <Link
          href="/history"
          className="flex items-center gap-3 bg-ios-bg2 rounded-2xl px-5 min-h-[52px] mb-4 active:scale-[0.97] transition-spring"
        >
          <span className="text-ios-blue flex-shrink-0"><IconHistory/></span>
          <span className="flex-1 text-ios-headline text-ios-label">Історія</span>
          <span className="text-ios-label3"><IconChevron/></span>
        </Link>

        {/* ── Logout ─────────────────────────────────── */}
        {!loading && user && (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 rounded-2xl bg-ios-gray3 text-ios-label text-ios-headline active:scale-[0.97] transition-spring disabled:opacity-40 mb-4"
          >
            <IconLogout/>
            {signingOut ? "Виходимо..." : "Вийти"}
          </button>
        )}

      </div>
    </div>
  )
}
