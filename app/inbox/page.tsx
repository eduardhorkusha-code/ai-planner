"use client"
import { useEffect, useState } from "react"
import { getTasks, saveTasks, updateTaskStatus, deleteTask } from "@/lib/store"
import { Task } from "@/lib/types"
import Link from "next/link"

const DEMO_TASKS: Task[] = [
  { id: crypto.randomUUID(), title: "Підготувати слайди для презентації клієнту", priority: "must", estimateMin: 45, deadline: new Date().toISOString().split("T")[0], status: "inbox" },
  { id: crypto.randomUUID(), title: "Відповісти на email від Марини про договір", priority: "must", estimateMin: 15, deadline: null, status: "inbox" },
  { id: crypto.randomUUID(), title: "Зателефонувати в банк щодо рахунку", priority: "nice", estimateMin: 20, deadline: null, status: "inbox" },
  { id: crypto.randomUUID(), title: "Купити каву і молоко після роботи", priority: "nice", estimateMin: 10, deadline: null, status: "inbox" },
  { id: crypto.randomUUID(), title: "Переглянути PR від Дімка до кінця дня", priority: "must", estimateMin: 30, deadline: new Date().toISOString().split("T")[0], status: "inbox" },
]

const UA_MONTHS = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"]

function formatDeadline(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]
  if (dateStr === todayStr) return "Сьогодні"
  if (dateStr === tomorrowStr) return "Завтра"
  const d = new Date(dateStr + "T00:00:00")
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`
}

// SVG icons — no emoji in body
function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M1 5.5H11" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M4 1V4M8 1V4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
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

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2L12 4.5L8.5 8L9 11.5L7 10L5 11.5L5.5 8L2 4.5L4.5 2L7 5L9.5 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
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

type FilterChip = "all" | "must" | "today" | "nodeadline"

const CHIPS: { id: FilterChip; label: string }[] = [
  { id: "all",        label: "Всі" },
  { id: "must",       label: "🔴 Терміново" },
  { id: "today",      label: "Сьогодні" },
  { id: "nodeadline", label: "Без дедлайну" },
]

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<FilterChip>("all")

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === "inbox"))
  }, [])

  function moveToToday(id: string) {
    updateTaskStatus(id, "today")
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function remove(id: string) {
    deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // P1-3: replace whole list with fresh demo (no duplicates on repeated taps)
  function loadDemo() {
    const freshDemo: Task[] = DEMO_TASKS.map(t => ({ ...t, id: crypto.randomUUID() }))
    saveTasks(freshDemo)
    setTasks(freshDemo)
  }

  // Compute today's date string in the client (standard JS Date API — no SSR concern)
  const todayStr = new Date().toISOString().split("T")[0]

  function applyFilter(list: Task[]): Task[] {
    if (filter === "must")       return list.filter(t => t.priority === "must")
    if (filter === "today")      return list.filter(t => t.deadline === todayStr)
    if (filter === "nodeadline") return list.filter(t => t.deadline === null)
    return list
  }

  const visible = applyFilter(tasks)

  if (tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-ios-bg2 rounded-[22px] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="4" y="6" width="24" height="22" rx="3" stroke="#636366" strokeWidth="1.75"/>
          <path d="M4 12H28" stroke="#636366" strokeWidth="1.75"/>
          <path d="M11 6V9M21 6V9" stroke="#636366" strokeWidth="1.75" strokeLinecap="round"/>
          <path d="M10 20H22M14 16H22" stroke="#636366" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-ios-title3 font-semibold">Inbox порожній</h2>
      <p className="text-ios-body text-ios-label2">Поверніться в Capture і виваліть все що в голові</p>
      <Link
        href="/capture"
        className="w-full max-w-xs min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-90 transition-all duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M12 2a1.414 1.414 0 0 1 2 2L6 12l-3 1 1-3 8-8Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        Capture
      </Link>
      <button
        onClick={loadDemo}
        className="w-full max-w-xs min-h-[50px] bg-ios-gray3 text-white text-ios-headline rounded-[14px] flex items-center justify-center active:scale-[0.97] active:brightness-75 transition-all duration-150"
      >
        Завантажити демо
      </button>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-ios-large-title pt-4">Inbox</h1>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            className={[
              "shrink-0 min-h-[34px] px-4 rounded-full text-ios-footnote font-medium transition-all duration-150 active:scale-[0.97]",
              filter === chip.id
                ? "bg-ios-blue text-white"
                : "bg-ios-gray3 text-ios-label",
            ].join(" ")}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <p className="text-ios-subhead text-ios-label2">{visible.length} задач — оберіть що на сьогодні</p>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-ios-body text-ios-label2">Немає задач за цим фільтром</p>
        </div>
      )}

      {visible.map(t => (
        <div key={t.id} className="bg-ios-bg2 rounded-2xl p-4 flex flex-col gap-2">
          {/* Tappable title block → /task/:id */}
          <Link
            href={`/task/${t.id}`}
            className="flex flex-col gap-2 active:opacity-70 transition-opacity duration-150"
          >
            <div className="flex items-start gap-2">
              <PriorityPill priority={t.priority} />
            </div>
            <p className="text-ios-headline leading-snug">{t.title}</p>
            <div className="flex gap-3 text-ios-footnote text-ios-label2 items-center">
              <span className="flex items-center gap-1">
                <IconClock />
                {t.estimateMin} хв
              </span>
              {t.deadline && (
                <span className="flex items-center gap-1">
                  <IconCalendar />
                  {formatDeadline(t.deadline)}
                </span>
              )}
            </div>
          </Link>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => moveToToday(t.id)}
              className="flex-1 min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-90 transition-all duration-150"
            >
              <IconPin />
              На сьогодні
            </button>
            <button
              onClick={() => remove(t.id)}
              aria-label="Видалити"
              className="min-h-[50px] px-4 bg-ios-gray3 text-ios-label2 rounded-[14px] flex items-center justify-center active:bg-ios-red/20 active:text-ios-red active:scale-[0.97] transition-all duration-150"
            >
              <IconTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
