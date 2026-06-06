"use client"
import { useEffect, useState } from "react"
import { getTasks, deleteTask } from "@/lib/store"
import { Task } from "@/lib/types"
import Link from "next/link"

// SVG icons — no emoji in body
function IconCheckCircle() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="#636366" strokeWidth="1.75"/>
      <path d="M10 16L14 20L22 12" stroke="#636366" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4h11M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M13 4l-.75 9a1 1 0 0 1-1 .916H4.75a1 1 0 0 1-1-.916L3 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PriorityPill({ priority }: { priority: Task["priority"] }) {
  if (priority === "must") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ios-red/15 text-ios-red text-ios-caption font-medium shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-ios-red inline-block" />
        Терміново
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ios-gray3/50 text-ios-label3 text-ios-caption font-medium shrink-0">
      Nice to have
    </span>
  )
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === "done"))
  }, [])

  function clearAll() {
    tasks.forEach(t => deleteTask(t.id))
    setTasks([])
  }

  const count = tasks.length

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center pb-32">
        <div className="w-16 h-16 bg-ios-bg2 rounded-[22px] flex items-center justify-center">
          <IconCheckCircle />
        </div>
        <h2 className="text-ios-title3 font-semibold">Ще нічого не виконано</h2>
        <p className="text-ios-body text-ios-label2">Завершіть задачі в Today — вони з'являться тут</p>
        <Link
          href="/today"
          className="w-full max-w-xs min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-90 transition-all duration-150"
        >
          Перейти в Today
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-3 pb-32">
      <div className="flex items-end justify-between pt-4">
        <h1 className="text-ios-large-title">Історія</h1>
        <span className="text-ios-footnote text-ios-label2 pb-1">Виконано: {count}</span>
      </div>

      <button
        onClick={clearAll}
        className="w-full min-h-[44px] bg-ios-gray3 text-ios-label text-ios-subhead font-medium rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-75 transition-all duration-150"
      >
        <IconTrash />
        Очистити виконані
      </button>

      <div className="flex flex-col gap-3 mt-1">
        {tasks.map(t => (
          <div key={t.id} className="bg-ios-bg2 rounded-2xl p-4 flex flex-col gap-2 opacity-70">
            <div className="flex items-start gap-2">
              <PriorityPill priority={t.priority} />
            </div>
            <p className="text-ios-headline leading-snug line-through text-ios-label2">{t.title}</p>
            <div className="flex gap-3 text-ios-footnote text-ios-label3 items-center">
              <span className="flex items-center gap-1">
                <IconClock />
                {t.estimateMin} хв
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
