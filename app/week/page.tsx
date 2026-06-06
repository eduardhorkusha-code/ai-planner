"use client"
import { useEffect, useState } from "react"
import { getTasks } from "@/lib/store"
import { Task } from "@/lib/types"

const UA_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
const UA_MONTHS = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"]

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

interface DayBucket {
  label: string // e.g. "Пн, 9 черв"
  dateStr: string // YYYY-MM-DD
  tasks: Task[]
  isToday: boolean
}

function buildWeek(tasks: Task[], today: Date): DayBucket[] {
  const monday = getMonday(today)
  const todayStr = toDateStr(today)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = toDateStr(d)
    const label = `${UA_DAYS[i]}, ${d.getDate()} ${UA_MONTHS[d.getMonth()]}`

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

// SVG icons
function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
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

export default function WeekPage() {
  const [buckets, setBuckets] = useState<DayBucket[]>([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const tasks = getTasks()
    const today = new Date()
    const week = buildWeek(tasks, today)
    setBuckets(week)
    setTotalCount(week.reduce((acc, b) => acc + b.tasks.length, 0))
  }, [])

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-ios-large-title text-ios-label font-bold">Тиждень</h1>
        <p className="text-ios-footnote text-ios-label2 mt-0.5">
          {totalCount === 0
            ? "Немає задач на цей тиждень"
            : `${totalCount} ${totalCount === 1 ? "задача" : totalCount < 5 ? "задачі" : "задач"}`}
        </p>
      </div>

      {/* Day list */}
      <div className="flex flex-col gap-6">
        {buckets.map((bucket) => (
          <div key={bucket.dateStr}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-ios-headline font-semibold"
                style={{ color: bucket.isToday ? "var(--color-ios-blue)" : "var(--color-ios-label)" }}
              >
                {bucket.label}
              </span>
              {bucket.isToday && (
                <span className="text-ios-caption px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "var(--color-ios-blue)", fontSize: 10 }}>
                  сьогодні
                </span>
              )}
            </div>

            {/* Tasks or empty state */}
            {bucket.tasks.length === 0 ? (
              <p className="text-ios-footnote text-ios-label3 pl-1">—</p>
            ) : (
              <div className="flex flex-col gap-2">
                {bucket.tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
