"use client"
import { useEffect, useState } from "react"
import { getTasks, updateTaskStatus, updateTask } from "@/lib/store"
import { Task } from "@/lib/types"
import Link from "next/link"

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 2L12 11H1L6.5 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M6.5 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6.5" cy="9.5" r="0.625" fill="currentColor"/>
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 7.5H12M8.5 4L12 7.5L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckboxIcon({ done }: { done: boolean }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150
        ${done ? "bg-ios-green border-ios-green" : "border-ios-gray2"}`}
    >
      {done && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

function PriorityDot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-ios-red inline-block shrink-0" />
}

/** Returns tomorrow as YYYY-MM-DD using local timezone */
function getTomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [moved, setMoved] = useState(false)
  const [energySorted, setEnergySorted] = useState(false)

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === "today" || t.status === "done").sort((a, b) => {
      if (a.priority === "must" && b.priority !== "must") return -1
      if (b.priority === "must" && a.priority !== "must") return 1
      return 0
    }))
  }, [])

  function toggle(t: Task) {
    const next = t.status === "done" ? "today" : "done"
    updateTaskStatus(t.id, next)
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
  }

  function sortByEnergy() {
    setTasks(prev => {
      const notDone = [...prev.filter(t => t.status === "today")]
        .sort((a, b) => {
          // must before nice
          if (a.priority === "must" && b.priority !== "must") return -1
          if (b.priority === "must" && a.priority !== "must") return 1
          // within same priority — heavier estimate first (hard work first)
          return b.estimateMin - a.estimateMin
        })
      const done = prev.filter(t => t.status === "done")
      return [...notDone, ...done]
    })
    setEnergySorted(true)
  }

  function moveTomorrow() {
    const tomorrow = getTomorrowISO()
    const patch = { status: "inbox" as const, deadline: tomorrow }
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.status === "today") {
          updateTask(t.id, patch)
          return { ...t, ...patch }
        }
        return t
      })
      // After move, only done tasks remain visible in today view
      return updated.filter(t => t.status === "done")
    })
    setMoved(true)
    setTimeout(() => setMoved(false), 2500)
  }

  const done = tasks.filter(t => t.status === "done").length
  const total = tasks.length
  const totalMin = tasks.filter(t => t.status === "today").reduce((s, t) => s + t.estimateMin, 0)
  const unfinishedToday = tasks.filter(t => t.status === "today").length

  // P2-2: all done celebration
  const allDone = done === total && total > 0

  if (tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-ios-bg2 rounded-[22px] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="12" stroke="#636366" strokeWidth="1.75"/>
          <path d="M10 16L14 20L22 12" stroke="#636366" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-ios-title3 font-semibold">План на сьогодні порожній</h2>
      <p className="text-ios-body text-ios-label2">Перейдіть в Inbox і оберіть задачі на сьогодні</p>
      <Link
        href="/inbox"
        className="w-full max-w-xs min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-90 transition-all duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="white" strokeWidth="1.5"/>
          <path d="M2 6H14" stroke="white" strokeWidth="1.5"/>
          <path d="M5.5 1.5V4.5M10.5 1.5V4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 10H11M7 13H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Inbox
      </Link>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-ios-large-title pt-4">Сьогодні</h1>
      <p className="text-ios-subhead text-ios-label2">{done}/{total} виконано</p>
      {/* P2-2: progress bar — green when all done */}
      <div className="w-full bg-ios-gray3 rounded-full h-1 mb-1">
        <div
          className={`h-1 rounded-full transition-[width] duration-300 ease-out ${allDone ? "bg-ios-green" : "bg-ios-blue"}`}
          style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
        />
      </div>
      {/* P2-2: celebration row — keep 🎉 per spec */}
      {allDone && (
        <p className="text-ios-green text-ios-subhead font-medium">🎉 Все зроблено!</p>
      )}
      {/* Insight card — plan realism (replaces old thin warning) */}
      {totalMin > 0 && (() => {
        const WORKDAY_MIN = 480
        const planHours = +(totalMin / 60).toFixed(1)
        const overloadHours = +(planHours - 8).toFixed(1)
        const barPct = Math.min(100, Math.round((totalMin / WORKDAY_MIN) * 100))
        const isOver = totalMin > WORKDAY_MIN
        const isCritical = totalMin > WORKDAY_MIN * 1.25 // >10h
        const barColor = isCritical ? "bg-ios-red" : isOver ? "bg-ios-orange" : "bg-ios-green"
        const textAccent = isCritical ? "text-ios-red" : isOver ? "text-ios-orange" : "text-ios-green"
        return (
          <div className="bg-ios-bg2 rounded-2xl p-4 flex flex-col gap-2.5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-ios-footnote text-ios-label2">Заплановано</p>
                <p className={`text-ios-headline font-semibold ${textAccent}`}>
                  ~{planHours} год
                </p>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <p className="text-ios-footnote text-ios-label2">Робочий день</p>
                <p className="text-ios-headline font-semibold text-ios-label">8 год</p>
              </div>
            </div>
            {/* Day-load progress bar */}
            <div className="w-full bg-ios-gray3 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-[width] duration-500 ease-out ${barColor}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            {/* Status line */}
            {isOver ? (
              <p className={`text-ios-footnote font-medium ${textAccent} flex items-center gap-1`}>
                <IconWarning />
                Перевантаження на ~{overloadHours} год — план нереалістичний, перенеси частину
              </p>
            ) : (
              <p className="text-ios-footnote font-medium text-ios-green flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M4 6.5L6 8.5L9.5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                План реалістичний
              </p>
            )}
          </div>
        )
      })()}

      {/* Move unfinished to tomorrow */}
      {unfinishedToday > 0 && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={moveTomorrow}
            className="w-full min-h-[44px] bg-ios-bg2 border border-ios-sep rounded-2xl flex items-center justify-center gap-2 text-ios-footnote text-ios-label2 active:scale-[0.97] active:brightness-90 transition-all duration-150"
          >
            <IconArrowRight />
            Перенести невиконане завтра ({unfinishedToday})
          </button>
          {moved && (
            <p className="text-ios-footnote text-ios-green text-center transition-opacity duration-300">
              Перенесено в Inbox на завтра
            </p>
          )}
        </div>
      )}

      {/* Energy sort button */}
      {unfinishedToday > 0 && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={sortByEnergy}
            className="w-full min-h-[44px] bg-ios-gray3 rounded-2xl flex items-center justify-center gap-2 text-ios-footnote text-ios-label active:scale-[0.97] active:brightness-90 transition-all duration-150"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M8 1.5L3.5 8.5H7L7 13.5L11.5 6.5H8L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            <span className="font-medium">Розкласти за енергією</span>
          </button>
          {energySorted && (
            <p className="text-ios-footnote text-ios-label2 text-center">
              Спершу складне — поки є енергія 🔋
            </p>
          )}
        </div>
      )}

      {tasks.map(t => (
        <button
          key={t.id}
          onClick={() => toggle(t)}
          className={`w-full flex items-center gap-3 bg-ios-bg2 rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.98] active:brightness-90
            ${t.status === "done" ? "opacity-50" : ""}`}
        >
          {/* §3.5 checkbox with SVG checkmark, active:scale-[0.9] on parent button */}
          <CheckboxIcon done={t.status === "done"} />
          <div className="flex-1 min-w-0">
            <p className={`text-ios-headline ${t.status === "done" ? "line-through text-ios-label3" : ""}`}>
              {t.title}
            </p>
            <p className="text-ios-footnote text-ios-label2 mt-0.5 flex items-center gap-1.5">
              <IconClock />
              {t.estimateMin} хв
              {t.priority === "must" && (
                <>
                  <span className="text-ios-label3">·</span>
                  <PriorityDot />
                  <span className="text-ios-red">Терміново</span>
                </>
              )}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
