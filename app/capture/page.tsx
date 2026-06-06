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

type ModelKey = "haiku" | "sonnet" | "grok"

const MODEL_OPTIONS: { key: ModelKey; label: string; modelId: string }[] = [
  { key: "haiku",  label: "\u26a1 \u0428\u0432\u0438\u0434\u043a\u043e", modelId: "claude-haiku-4-5" },
  { key: "sonnet", label: "\ud83e\udde0 \u0420\u043e\u0437\u0443\u043c\u043d\u043e", modelId: "claude-sonnet-4-6" },
  { key: "grok",   label: "\ud83e\udd16 Grok", modelId: "grok" },
]

/* SVG: microphone */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* SVG: sparkle / AI parse */
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"
        fill="currentColor"
      />
      <path
        d="M19 15l.91 2.73L22 18l-2.09.27L19 21l-.91-2.73L16 18l2.09-.27L19 15z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  )
}

export default function CapturePage() {
  const [dump, setDump] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [listening, setListening] = useState(false)
  const [model, setModel] = useState<ModelKey>("haiku")
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
      setError("\u0413\u043e\u043b\u043e\u0441\u043e\u0432\u0438\u0439 \u0432\u0432\u0456\u0434 \u043d\u0435 \u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0443\u0454\u0442\u044c\u0441\u044f \u0443 \u0446\u044c\u043e\u043c\u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456")
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
    const selectedModelId = MODEL_OPTIONS.find(o => o.key === model)?.modelId ?? "claude-haiku-4-5"
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump: safeDump, model: selectedModelId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "\u041f\u043e\u043c\u0438\u043b\u043a\u0430")
      const tasks: Task[] = data.map((t: Omit<Task, "id" | "status">) => ({
        ...t,
        id: crypto.randomUUID(),
        status: "inbox" as const,
      }))
      addTasks(tasks)
      setDump("")
      router.push("/inbox")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "\u041f\u043e\u043c\u0438\u043b\u043a\u0430")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-24 pt-[env(safe-area-inset-top)]">
      <h1 className="text-ios-large-title pt-4">{"Що в голові?"}</h1>
      <p className="text-ios-subhead text-ios-label2">{"Виваліть все підряд — AI розсортує"}</p>

      {/* Textarea wrapper — relative for absolute children */}
      <div className="relative flex-1">
        {/* Listening indicator — absolute over textarea, top-left */}
        {listening && (
          <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-ios-red text-ios-caption animate-pulse pointer-events-none">
            <span className="inline-block w-2 h-2 rounded-full bg-ios-red" />
            {"Слухаю..."}
          </span>
        )}

        <textarea
          className="w-full min-h-[40vh] bg-ios-bg2 rounded-2xl p-4 text-ios-body resize-none
                     outline-none focus:ring-1 focus:ring-ios-blue/50
                     placeholder:text-ios-placeholder pr-14"
          placeholder={"НаписатиАні, зателефонувати клієнту, доробити презу до п’ятниці, купити молоко..."}
          value={dump}
          onChange={e => setDump(e.target.value)}
          disabled={loading}
        />

        {/* Mic button — absolute top-right of textarea */}
        <button
          onClick={toggleVoice}
          aria-label={"Голосовий ввід"}
          disabled={loading}
          className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center
            transition-all duration-150 disabled:opacity-40 active:scale-[0.90]
            ${listening
              ? "bg-ios-red text-white"
              : "bg-ios-gray3 text-ios-label2"
            }`}
        >
          <MicIcon className="w-5 h-5" />
        </button>
      </div>

      {error && <p className="text-ios-red text-ios-footnote">{error}</p>}

      {/* Model selector — segmented pills, above sticky CTA */}
      <div className="flex gap-2 bg-ios-bg2 rounded-[14px] p-1">
        {MODEL_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setModel(opt.key)}
            disabled={loading}
            className={[
              "flex-1 min-h-[36px] rounded-[10px] text-ios-footnote font-medium",
              "transition-all duration-150 active:scale-[0.97] disabled:opacity-40",
              model === opt.key
                ? "bg-ios-blue text-white shadow-sm"
                : "text-ios-label2",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Parse button — sticky above TabBar */}
      <div className="sticky bottom-20 z-10 bg-black/80 backdrop-blur-xl pt-2">
        <button
          onClick={handleParse}
          disabled={loading || !dump.trim()}
          className="w-full min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px]
                     flex items-center justify-center gap-2
                     active:scale-[0.97] active:brightness-90 transition-all duration-150
                     disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
              {"Аналізую..."}
            </>
          ) : (
            <>
              <SparkleIcon className="w-5 h-5" />
              {"Розібрати з AI"}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
