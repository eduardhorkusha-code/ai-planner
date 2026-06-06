"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitFunnel } from "@/lib/funnel"

type Step = 0 | 1 | 2

const STEPS = [
  {
    id: "purpose" as const,
    question: "Нащо тобі планер?",
    options: [
      "Забагато задач у голові",
      "Зриваю дедлайни",
      "Хочу фокус на головному",
      "Просто цікаво",
    ],
  },
  {
    id: "persona" as const,
    question: "Хто ти?",
    options: ["Підприємець", "Менеджер", "Фрилансер", "Студент", "Інше"],
  },
  {
    id: "volume" as const,
    question: "Скільки задач типово на день?",
    options: ["<5", "5–15", ">15"],
  },
]

const TOTAL = STEPS.length

export default function FunnelPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const current = STEPS[step]

  async function pick(value: string) {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)

    if (step < TOTAL - 1) {
      setStep((step + 1) as Step)
      return
    }

    // Last step — submit and redirect
    setSubmitting(true)
    try {
      await submitFunnel({
        purpose: next.purpose ?? "",
        persona: next.persona ?? "",
        answers: { volume: next.volume ?? "" },
      })
    } catch {
      // silent — fallback handled inside submitFunnel
    }
    setDone(true)
    setTimeout(() => router.push("/capture"), 1800)
  }

  function skip() {
    router.push("/capture")
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">Дякуємо!</h2>
          <p className="text-gray-400 text-base">Готуємо твій планер...</p>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">
            {step + 1}/{TOTAL}
          </span>
          <button
            onClick={skip}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Пропустити &rarr;
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col gap-5">
          <h2 className="text-xl font-bold text-white leading-snug">
            {current.question}
          </h2>

          <div className="flex flex-col gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => { if (!submitting) pick(opt) }}
                disabled={submitting}
                className="w-full min-h-[52px] px-5 py-3 bg-gray-800 hover:bg-gray-700
                           active:scale-[0.98] disabled:opacity-50
                           text-white text-base font-medium rounded-2xl
                           flex items-center justify-between
                           transition-all border border-transparent hover:border-gray-600"
              >
                <span>{opt}</span>
                <span className="text-gray-500 text-sm">&rarr;</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skip link (bottom) */}
        <button
          onClick={skip}
          className="text-center text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          Пропустити та спробувати демо
        </button>

      </div>
    </div>
  )
}
