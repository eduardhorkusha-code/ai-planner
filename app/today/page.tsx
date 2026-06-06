"use client"
import { useEffect, useState } from "react"
import { getTasks, updateTaskStatus } from "@/lib/store"
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

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])

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

  const done = tasks.filter(t => t.status === "done").length
  const total = tasks.length
  const totalMin = tasks.filter(t => t.status === "today").reduce((s, t) => s + t.estimateMin, 0)
  const hoursLeft = Math.floor(totalMin / 60)
  const minsLeft = totalMin % 60

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
      {totalMin > 0 && (
        <p className="text-ios-footnote text-ios-label2 flex items-center gap-1">
          <IconClock />
          ~{hoursLeft > 0 ? `${hoursLeft}год ` : ""}{minsLeft}хв задач залишилось
        </p>
      )}
      {/* P1-4: realistic warning */}
      {totalMin > 480 && (
        <p className="text-ios-footnote text-ios-red flex items-center gap-1">
          <IconWarning />
          ~{Math.round(totalMin / 60)}год запланованих задач — це більше за робочий день (8 год)
        </p>
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
