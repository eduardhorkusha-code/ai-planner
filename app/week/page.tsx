"use client"
import { useEffect, useState, useCallback } from "react"
import { getTasks } from "@/lib/store"
import { Task } from "@/lib/types"

const UA_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
const UA_MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"]

// Returns Monday of the week containing `date`
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun,1=Mon,...,6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Format YYYY-MM-DD from a Date
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

// Format week range label e.g. "1–7 черв" or "30 трав – 5 черв"
function weekRangeLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const startDay = monday.getDate()
  const endDay = sunday.getDate()
  const startMonth = UA_MONTHS[monday.getMonth()]
  const endMonth = UA_MONTHS[sunday.getMonth()]
  if (monday.getMonth() === sunday.getMonth()) {
    return startDay + "–" + endDay + " " + endMonth
  }
  return startDay + " " + startMonth + " – " + endDay + " " + endMonth
}

interface DayBucket {
  label: string // e.g. "Пн, 9 черв"
  dateStr: string // YYYY-MM-DD
  tasks: Task[]
  isToday: boolean
}

function buildWeek(tasks: Task[], baseMonday: Date, todayStr: string): DayBucket[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseMonday)
    d.setDate(baseMonday.getDate() + i)
    const dateStr = toDateStr(d)
    const label = UA_DAYS[i] + ", " + d.getDate() + " " + UA_MONTHS[d.getMonth()]

    const dayTasks = tasks.filter(t => {
      if (t.status === "done") return false
      if (t.deadline === dateStr) return true
      // tasks with no deadline and status "today" go into today's bucket
      if (!t.deadline && t.status === "today" && dateStr === todayStr) return true
      return false
    })

    return {
      label,
      dateStr,
      tasks: dayTasks,
      isToday: dateStr === todayStr,
    }
  })
}

// Pluralise Ukrainian task count
function pluralTasks(n: number): string {
  if (n === 1) return "1 задача"
  if (n >= 2 && n <= 4) return n + " задачі"
  return n + " задач"
}

// Format estimate in minutes → "Xг Yхв" or "Yхв"
function formatHours(totalMin: number): string {
  if (totalMin === 0) return ""
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return "~" + m + "хв"
  if (m === 0) return "~" + h + "год"
  return "~" + h + "год " + m + "хв"
}

// Workload bar color based on minutes
function workloadColor(minutes: number): string {
  if (minutes === 0) return "var(--color-ios-sep)"
  if (minutes <= 240) return "var(--color-ios-green)"  // ≤4h
  if (minutes <= 480) return "var(--color-ios-orange)" // 4–8h
  return "var(--color-ios-red)"                        // >8h
}

// Workload bar label: show hours with one decimal, strip .0
function workloadLabel(minutes: number): string {
  if (minutes === 0) return ""
  const raw = (minutes / 60).toFixed(1)
  const h = raw.endsWith(".0") ? raw.slice(0, -2) : raw
  return "~" + h + "год"
}

// SVG icons
function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
      {dir === "left"
        ? <path d="M8 2L2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M2 2L8 8L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      }
    </svg>
  )
}

function PriorityPill({ priority }: { priority: Task["priority"] }) {
  if (priority === "must") {
    return (
      <span className="inline-flex items-center gap-0.5 text-ios-caption px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(255,69,58,0.15)", color: "var(--color-ios-red)" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-ios-red)", display: "inline-block" }} />
        must
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-ios-caption px-1.5 py-0.5 rounded-full text-ios-label3"
          style={{ background: "rgba(142,142,147,0.2)" }}>
      nice
    </span>
  )
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-ios-bg2 rounded-2xl px-4 py-3 flex flex-col gap-1.5"
         style={{ border: "1px solid var(--color-ios-sep)" }}>
      <p className="text-ios-body text-ios-label leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <PriorityPill priority={task.priority} />
        {task.estimateMin > 0 && (
          <span className="inline-flex items-center gap-1 text-ios-caption text-ios-label3">
            <IconClock />
            {task.estimateMin} хв
          </span>
        )}
      </div>
    </div>
  )
}

// Workload bar component (horizontal, capped at 100%)
function WorkloadBar({ minutes }: { minutes: number }) {
  const REF_MIN = 480 // 8h = 100%
  const pct = Math.min(100, Math.round((minutes / REF_MIN) * 100))
  const color = workloadColor(minutes)
  const label = workloadLabel(minutes)

  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      {/* Track */}
      <div className="flex-1 rounded-full overflow-hidden"
           style={{ height: 4, background: "rgba(142,142,147,0.18)" }}>
        {pct > 0 && (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: pct + "%", background: color }}
          />
        )}
      </div>
      {/* Label */}
      <span className="text-ios-caption shrink-0"
            style={{ fontSize: 11, color: minutes === 0 ? "var(--color-ios-label3)" : color, minWidth: 36, textAlign: "right" }}>
        {minutes === 0 ? "Вільно" : label}
      </span>
    </div>
  )
}

export default function WeekPage() {
  const [buckets, setBuckets] = useState<DayBucket[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalMin, setTotalMin] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week
  const [rangeLabel, setRangeLabel] = useState("")

  const rebuild = useCallback((offset: number) => {
    const tasks = getTasks()
    const today = new Date()
    const todayStr = toDateStr(today)

    const baseMonday = getMonday(today)
    // Apply offset in full weeks
    baseMonday.setDate(baseMonday.getDate() + offset * 7)

    setRangeLabel(weekRangeLabel(baseMonday))

    const week = buildWeek(tasks, baseMonday, todayStr)
    setBuckets(week)
    const count = week.reduce((acc, b) => acc + b.tasks.length, 0)
    const mins = week.reduce((acc, b) => acc + b.tasks.reduce((s, t) => s + (t.estimateMin || 0), 0), 0)
    setTotalCount(count)
    setTotalMin(mins)
  }, [])

  useEffect(() => {
    rebuild(weekOffset)
  }, [weekOffset, rebuild])

  const hoursStr = formatHours(totalMin)

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        {/* Navigation row */}
        <div className="flex items-center justify-between mb-1">
          {/* Prev week */}
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{ color: "var(--color-ios-blue)", minWidth: 44, minHeight: 44 }}
            aria-label="Попередній тиждень"
          >
            <IconChevron dir="left" />
          </button>

          {/* Week range + back link */}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-ios-large-title text-ios-label font-bold leading-none">{rangeLabel}</h1>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="active:scale-[0.97] transition-transform"
                style={{ color: "var(--color-ios-blue)", fontSize: 13, fontWeight: 500, lineHeight: "18px" }}
              >
                Цей тиждень
              </button>
            )}
          </div>

          {/* Next week */}
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{ color: "var(--color-ios-blue)", minWidth: 44, minHeight: 44 }}
            aria-label="Наступний тиждень"
          >
            <IconChevron dir="right" />
          </button>
        </div>

        {/* Summary subtitle */}
        <p className="text-ios-footnote text-ios-label2 text-center mt-0.5">
          {totalCount === 0
            ? "Немає задач на цей тиждень"
            : hoursStr
              ? pluralTasks(totalCount) + " · " + hoursStr
              : pluralTasks(totalCount)}
        </p>
      </div>

      {/* Day list */}
      <div className="flex flex-col gap-4">
        {buckets.map((bucket) => {
          const isEmpty = bucket.tasks.length === 0
          const dayMin = bucket.tasks.reduce((s, t) => s + (t.estimateMin || 0), 0)
          // Show "today" pill only when viewing the current week and day is today
          const showTodayPill = weekOffset === 0 && bucket.isToday
          return (
            <div
              key={bucket.dateStr}
              className="rounded-2xl overflow-hidden"
              style={showTodayPill
                ? { border: "1.5px solid var(--color-ios-blue)", background: "rgba(10,132,255,0.05)" }
                : { border: "1px solid var(--color-ios-sep)" }
              }
            >
              {/* Day header row */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={showTodayPill
                  ? { borderBottom: "1px solid rgba(10,132,255,0.2)" }
                  : isEmpty
                    ? undefined
                    : { borderBottom: "1px solid var(--color-ios-sep)" }
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-ios-headline font-semibold"
                    style={{ color: showTodayPill ? "var(--color-ios-blue)" : "var(--color-ios-label)" }}
                  >
                    {bucket.label}
                  </span>
                  {showTodayPill && (
                    <span className="text-white rounded-full px-2 py-0.5"
                          style={{ background: "var(--color-ios-blue)", fontSize: 11, fontWeight: 600, lineHeight: "16px" }}>
                      сьогодні
                    </span>
                  )}
                </div>
                {!isEmpty && (
                  <span className="text-ios-caption rounded-full px-2 py-0.5"
                        style={{ background: showTodayPill ? "rgba(10,132,255,0.18)" : "rgba(142,142,147,0.18)", color: showTodayPill ? "var(--color-ios-blue)" : "var(--color-ios-label2)", fontSize: 11, fontWeight: 500 }}>
                    {pluralTasks(bucket.tasks.length)}
                  </span>
                )}
              </div>

              {/* Workload bar — always rendered below header */}
              <WorkloadBar minutes={dayMin} />

              {/* Tasks list — only when non-empty */}
              {!isEmpty && (
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {bucket.tasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
