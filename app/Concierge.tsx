"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { getTasks } from "@/lib/store"
import type { Task } from "@/lib/types"

export default function Concierge() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Приховуємо на pre-auth роутах
  if (
    path === "/" ||
    path.startsWith("/funnel") ||
    path.startsWith("/login") ||
    path.startsWith("/auth")
  ) {
    return null
  }

  async function fetchAdvice(tasks: Task[]) {
    setLoading(true)
    setText(null)
    setError(null)
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? "Щось пішло не так")
      } else {
        setText(data.text)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка мережі")
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    const tasks = getTasks()
    setOpen(true)
    if (tasks.length > 0) {
      fetchAdvice(tasks)
    } else {
      setText(null)
      setError(null)
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      {/* Плаваюча кнопка-бабл */}
      <button
        aria-label="AI-консьєрж"
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-ios-blue flex items-center justify-center shadow-[0_4px_24px_rgba(10,132,255,0.45)] active:scale-[0.92] transition-spring"
      >
        {/* Іконка іскри */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13 2L4.5 13.5H11L9 22L19.5 10.5H13L13 2Z"
            fill="white"
            stroke="white"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Нижній лист */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Сам лист */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI-консьєрж"
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-ios-bg2 rounded-t-3xl max-h-[70vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] p-5"
          >
            {/* Заголовок */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-ios-headline text-ios-label">
                  AI-консьєрж
                </h2>
                <p className="text-ios-footnote text-ios-label2 mt-0.5">
                  самарі та пріоритети дня
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Закрити"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-bg3 active:scale-[0.92] transition-spring ml-3 shrink-0"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1L13 13M13 1L1 13"
                    stroke="rgba(235,235,245,0.60)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Порожній стан */}
            {!loading && !text && !error && (
              <p className="text-ios-body text-ios-label2 text-center py-6">
                Спершу додайте задачі
              </p>
            )}

            {/* Завантаження */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <svg
                  className="animate-spin w-7 h-7 text-ios-blue"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-ios-footnote text-ios-label2">
                  Аналізую ваш день...
                </p>
              </div>
            )}

            {/* Помилка */}
            {!loading && error && (
              <p className="text-ios-body text-ios-red py-4">{error}</p>
            )}

            {/* Результат */}
            {!loading && text && (
              <p className="whitespace-pre-line text-ios-body text-ios-label">
                {text}
              </p>
            )}

            {/* Кнопка Оновити */}
            {!loading && (text || error) && (
              <button
                onClick={() => fetchAdvice(getTasks())}
                className="mt-5 w-full rounded-2xl bg-ios-bg3 py-3 text-ios-subhead text-ios-label active:scale-[0.97] transition-spring"
              >
                Оновити
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
