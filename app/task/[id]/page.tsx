"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getTasks, updateTask, deleteTask } from "@/lib/store"
import { Task, Priority, Status } from "@/lib/types"

// SVG icons — no emoji
function IconChevronLeft() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
      <path d="M8.5 1.5L2 8L8.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M7 5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V5M5 5l1 10h6l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 6H12.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4.5 1.5V3.5M9.5 1.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4.5 7L6.5 9L9.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Segmented control component
function Segmented<T extends string | null>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-ios-gray3/50 rounded-[10px] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            "flex-1 min-h-[36px] rounded-[8px] text-ios-footnote font-medium transition-all duration-150 active:scale-[0.97]",
            value === opt.value
              ? "bg-ios-bg2 text-ios-label shadow-sm"
              : "text-ios-label2",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Section wrapper with iOS inset style
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-ios-footnote text-ios-label2 uppercase tracking-wider px-1">{label}</span>
      {children}
    </div>
  )
}

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: "Must do", value: "must" },
  { label: "Nice to do", value: "nice" },
]

const STATUS_OPTIONS: { label: string; value: Status }[] = [
  { label: "Inbox", value: "inbox" },
  { label: "Today", value: "today" },
  { label: "Done", value: "done" },
]

type RepeatValue = "daily" | "weekly" | null

const REPEAT_OPTIONS: { label: string; value: RepeatValue }[] = [
  { label: "Ні", value: null },
  { label: "Щодня", value: "daily" },
  { label: "Щотижня", value: "weekly" },
]

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""

  const [task, setTask] = useState<Task | null | undefined>(undefined) // undefined = loading
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<Priority>("must")
  const [estimateMin, setEstimateMin] = useState(30)
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<Status>("inbox")
  const [saved, setSaved] = useState(false)
  const [repeat, setRepeat] = useState<"daily" | "weekly" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Load task on mount
  useEffect(() => {
    const found = getTasks().find((t) => t.id === id) ?? null
    setTask(found)
    if (found) {
      setTitle(found.title)
      setPriority(found.priority)
      setEstimateMin(found.estimateMin)
      setDeadline(found.deadline ?? "")
      setStatus(found.status)
      setRepeat(found.repeat ?? null)
    }
  }, [id])

  // Persist patch on every field change
  function persist(patch: Partial<Task>) {
    if (!task) return
    updateTask(id, patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleTitleBlur() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task?.title) {
      persist({ title: trimmed })
    }
  }

  function handlePriorityChange(v: Priority) {
    setPriority(v)
    persist({ priority: v })
  }

  function handleEstimateChange(v: number) {
    const safe = Math.max(5, Math.min(480, v))
    setEstimateMin(safe)
    persist({ estimateMin: safe })
  }

  function handleDeadlineChange(v: string) {
    setDeadline(v)
    persist({ deadline: v || null })
  }

  function handleStatusChange(v: Status) {
    setStatus(v)
    persist({ status: v })
  }

  function handleRepeatChange(v: "daily" | "weekly" | null) {
    setRepeat(v)
    persist({ repeat: v })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    deleteTask(id)
    router.push("/inbox")
  }

  // Loading state
  if (task === undefined) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-ios-gray3 animate-pulse" />
      </div>
    )
  }

  // Not found
  if (task === null) {
    return (
      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center gap-5 px-6">
        <p className="text-ios-title2 text-ios-label text-center">Задачу не знайдено</p>
        <p className="text-ios-body text-ios-label2 text-center">Можливо, її вже видалили</p>
        <Link
          href="/inbox"
          className="text-ios-blue text-ios-headline active:opacity-60 transition-opacity duration-100"
        >
          ‹ Повернутися до Inbox
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ios-bg pb-32">
      {/* Navigation bar */}
      <div className="sticky top-0 z-10 bg-ios-bg/90 backdrop-blur-xl border-b border-ios-sep px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-[52px]">
          <Link
            href="/inbox"
            className="flex items-center gap-1.5 text-ios-blue text-ios-body active:opacity-60 transition-opacity duration-100 min-h-[44px] min-w-[44px] -ml-1 pr-2"
          >
            <IconChevronLeft />
            <span>Назад</span>
          </Link>

          {/* Saved indicator */}
          <span
            className={[
              "text-ios-footnote transition-opacity duration-300",
              saved ? "text-ios-green opacity-100" : "opacity-0",
            ].join(" ")}
          >
            Збережено
          </span>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={[
              "flex items-center gap-1.5 min-h-[44px] min-w-[44px] pl-2 -mr-1 active:scale-[0.97] transition-all duration-150",
              confirmDelete ? "text-ios-red" : "text-ios-label2",
            ].join(" ")}
            aria-label="Видалити задачу"
          >
            <IconTrash />
            {confirmDelete && (
              <span className="text-ios-footnote font-medium">Підтвердити?</span>
            )}
          </button>
        </div>
      </div>

      {/* Page title */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-ios-large-title text-ios-label">Задача</h1>
      </div>

      {/* Form */}
      <div className="px-4 flex flex-col gap-6">

        {/* Title */}
        <Section label="Назва">
          <div className="bg-ios-bg2 rounded-2xl px-4 py-3">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={3}
              placeholder="Назва задачі..."
              className="w-full bg-transparent text-ios-body text-ios-label placeholder:text-ios-placeholder resize-none focus:outline-none leading-snug"
            />
          </div>
        </Section>

        {/* Priority */}
        <Section label="Пріоритет">
          <Segmented<Priority>
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={handlePriorityChange}
          />
        </Section>

        {/* Estimate */}
        <Section label="Оцінка часу">
          <div className="bg-ios-bg2 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-ios-label2">
                <IconClock />
                <span className="text-ios-footnote">Хвилин</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEstimateChange(estimateMin - 5)}
                  className="w-[36px] h-[36px] rounded-full bg-ios-gray3 flex items-center justify-center text-ios-label text-ios-headline active:scale-[0.90] active:bg-ios-gray2 transition-all duration-150"
                  aria-label="Зменшити"
                >
                  −
                </button>
                <input
                  type="number"
                  value={estimateMin}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) setEstimateMin(v)
                  }}
                  onBlur={() => handleEstimateChange(estimateMin)}
                  min={5}
                  max={480}
                  className="w-[56px] text-center bg-transparent text-ios-body text-ios-label font-medium focus:outline-none"
                />
                <button
                  onClick={() => handleEstimateChange(estimateMin + 5)}
                  className="w-[36px] h-[36px] rounded-full bg-ios-gray3 flex items-center justify-center text-ios-label text-ios-headline active:scale-[0.90] active:bg-ios-gray2 transition-all duration-150"
                  aria-label="Збільшити"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Deadline */}
        <Section label="Дедлайн">
          <div className="bg-ios-bg2 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-ios-label2">
                <IconCalendar />
              </span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="flex-1 bg-transparent text-ios-body text-ios-label focus:outline-none [color-scheme:dark]"
              />
              {deadline && (
                <button
                  onClick={() => handleDeadlineChange("")}
                  className="text-ios-label3 text-ios-footnote active:text-ios-red transition-colors duration-100"
                  aria-label="Очистити дедлайн"
                >
                  Очистити
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Status */}
        <Section label="Статус">
          <div className="flex items-center gap-2 text-ios-label2 mb-1 px-1">
            <IconCheckCircle />
            <span className="text-ios-footnote">Поточний статус задачі</span>
          </div>
          <Segmented<Status>
            options={STATUS_OPTIONS}
            value={status}
            onChange={handleStatusChange}
          />
        </Section>

        {/* Repeat */}
        <Section label="Повторювати">
          <Segmented<RepeatValue>
            options={REPEAT_OPTIONS}
            value={repeat}
            onChange={handleRepeatChange}
          />
        </Section>

        {/* Delete section */}
        <div className="pt-4 border-t border-ios-sep">
          <button
            onClick={handleDelete}
            className={[
              "w-full min-h-[52px] rounded-2xl flex items-center justify-center gap-2 text-ios-headline font-medium active:scale-[0.97] transition-all duration-150",
              confirmDelete
                ? "bg-ios-red text-white"
                : "bg-ios-red/10 text-ios-red",
            ].join(" ")}
          >
            <IconTrash />
            {confirmDelete ? "Натисніть ще раз для підтвердження" : "Видалити задачу"}
          </button>
          {confirmDelete && (
            <p className="text-center text-ios-footnote text-ios-label3 mt-2">
              Автоматично скасується через 3 секунди
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
