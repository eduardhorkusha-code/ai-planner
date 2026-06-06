"use client"
import { useState, useRef } from "react"
import { addTasks } from "@/lib/store"
import { Task } from "@/lib/types"
import { useRouter } from "next/navigation"

interface SpeechRecognitionResult {
  readonly [index: number]: { transcript: string }
  readonly length: number
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult
  readonly length: number
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike
}

type WinWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

export default function CapturePage() {
  const [dump, setDump] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const router = useRouter()

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop()
      recRef.current = null
      setListening(false)
      return
    }

    const win = window as WinWithSpeech
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition
    if (!SR) {
      setError("Голосовий ввід не підтримується у цьому браузері")
      return
    }

    const rec = new SR()
    rec.lang = "uk-UA"
    rec.continuous = true
    rec.interimResults = false

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const parts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        parts.push(event.results[i][0].transcript)
      }
      const transcript = parts.join(" ")
      setDump(prev => prev ? `${prev} ${transcript}` : transcript)
    }

    rec.onerror = () => {
      setListening(false)
      recRef.current = null
    }

    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }

    rec.start()
    recRef.current = rec
    setListening(true)
  }

  async function handleParse() {
    if (!dump.trim()) return
    const safeDump = dump
      .replace(/\u2028/g, "\n")
      .replace(/\u2029/g, "\n")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump: safeDump }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Помилка")
      const tasks: Task[] = data.map((t: Omit<Task, "id" | "status">) => ({
        ...t,
        id: crypto.randomUUID(),
        status: "inbox" as const,
      }))
      addTasks(tasks)
      setDump("")
      router.push("/inbox")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-24">
      <h1 className="text-2xl font-bold pt-4">Що в голові? 🧠</h1>
      <p className="text-gray-400 text-sm">Виваліть все підряд — AI розсортує</p>

      {/* Textarea wrapper — relative for absolute children */}
      <div className="relative flex-1">
        {/* Listening indicator — absolute over textarea, top-left */}
        {listening && (
          <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-red-400 text-xs animate-pulse pointer-events-none">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            Слухаю...
          </span>
        )}

        <textarea
          className="w-full min-h-[40vh] bg-gray-900 rounded-2xl p-4 text-base resize-none
                     border border-gray-800 focus:border-blue-500 outline-none
                     placeholder-gray-600 pr-14"
          placeholder="НаписатиАні, зателефонувати клієнту, доробити презу до п'ятниці, купити молоко..."
          value={dump}
          onChange={e => setDump(e.target.value)}
          disabled={loading}
        />

        {/* Mic button — absolute top-right of textarea */}
        <button
          onClick={toggleVoice}
          aria-label="Голосовий ввід"
          disabled={loading}
          className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors
            disabled:opacity-40
            ${listening
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
        >
          🎙️
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Parse button — sticky above TabBar */}
      <div className="sticky bottom-20 z-10 bg-gray-950/95 backdrop-blur pt-2">
        <button
          onClick={handleParse}
          disabled={loading || !dump.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500
                     text-white font-semibold py-4 rounded-2xl text-lg transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Аналізую...
            </>
          ) : (
            "✨ Розібрати з AI"
          )}
        </button>
      </div>
    </div>
  )
}
