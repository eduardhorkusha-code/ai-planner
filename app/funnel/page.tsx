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
      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="text-ios-title2 text-ios-label">Дякуємо!</h2>
          <p className="text-ios-body text-ios-label2">Готуємо твій планер...</p>
          <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Progress header */}
        <div className="flex items-center justify-between">
          <span className="text-ios-caption text-ios-label3">
            {step + 1} з {TOTAL}
          </span>
          <button
            onClick={skip}
            className="text-ios-blue text-ios-body transition-all duration-150 active:opacity-60"
          >
            Пропустити &rarr;
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-ios-gray3 rounded-full overflow-hidden">
          <div
            className="h-full bg-ios-blue rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-ios-bg2 rounded-2xl p-5 flex flex-col gap-5">
          <h2 className="text-ios-title3 text-ios-label leading-snug">
            {current.question}
          </h2>

          <div className="flex flex-col gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => { if (!submitting) pick(opt) }}
                disabled={submitting}
                className="w-full min-h-[52px] px-5 py-3
                           bg-ios-bg2 border border-ios-sep-opaque
                           active:scale-[0.97] active:bg-ios-gray3
                           disabled:opacity-50
                           text-ios-label text-ios-body rounded-2xl
                           flex items-center justify-between
                           transition-all duration-150"
              >
                <span>{opt}</span>
                {/* Chevron SVG */}
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true" className="text-ios-label3 shrink-0">
                  <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Skip link (bottom) */}
        <button
          onClick={skip}
          className="text-center text-ios-label3 text-ios-footnote transition-all duration-150 active:opacity-60"
        >
          Пропустити та спробувати демо
        </button>

      </div>
    </div>
  )
}
