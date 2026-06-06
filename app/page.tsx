"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const WORDS = ["запланувати", "зробити", "встигнути", "видихнути"]

const CHIPS = [
  { icon: "🎙️", label: "Голос" },
  { icon: "🤖", label: "AI" },
  { icon: "📅", label: "Тиждень" },
  { icon: "⚡", label: "Пріоритети" },
]

export default function Home() {
  const [wordIdx, setWordIdx] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const [chipsVisible, setChipsVisible] = useState(false)

  // Cycle verb with cross-fade
  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIdx(prev => (prev + 1) % WORDS.length)
        setWordVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // Stagger chips appearance
  useEffect(() => {
    const id = setTimeout(() => setChipsVisible(true), 900)
    return () => clearTimeout(id)
  }, [])

  return (
    <>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chip-in {
          from { opacity: 0; transform: translateY(10px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(10,132,255,0.0); }
          50%       { box-shadow: 0 0 0 8px rgba(10,132,255,0.18); }
        }
        @keyframes word-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .anim-hero-logo   { animation: fade-in-up 0.55s ease both; animation-delay: 0.05s; }
        .anim-hero-title  { animation: fade-in-up 0.55s ease both; animation-delay: 0.18s; }
        .anim-hero-sub    { animation: fade-in-up 0.55s ease both; animation-delay: 0.30s; }
        .anim-chips-row   { animation: fade-in-up 0.55s ease both; animation-delay: 0.44s; }
        .anim-cta-primary { animation: fade-in-up 0.55s ease both; animation-delay: 0.56s; }
        .anim-cta-sec     { animation: fade-in-up 0.55s ease both; animation-delay: 0.64s; }
        .anim-cta-ghost   { animation: fade-in-up 0.55s ease both; animation-delay: 0.72s; }
        .anim-footer      { animation: fade-in-up 0.55s ease both; animation-delay: 0.80s; }
        .btn-glow         { animation: glow-pulse 2.4s ease-in-out infinite; animation-delay: 1.2s; }
        .word-fade        { transition: opacity 0.28s ease; }
      `}</style>

      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-start pt-20 px-4 pb-12">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Hero */}
          <div className="flex flex-col gap-3 text-center">
            {/* Logomark */}
            <div className="anim-hero-logo mx-auto w-14 h-14 bg-ios-bg2 rounded-[18px] flex items-center justify-center mb-1">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect x="4" y="6"  width="24" height="3" rx="1.5" fill="#0A84FF"/>
                <rect x="4" y="12" width="18" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
                <rect x="4" y="18" width="21" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
                <rect x="4" y="24" width="14" height="3" rx="1.5" fill="rgba(235,235,245,0.25)"/>
              </svg>
            </div>

            <h1 className="anim-hero-title text-ios-title1 text-ios-label">AI Planner</h1>

            {/* Animated tagline */}
            <p className="anim-hero-sub text-ios-body text-ios-label2">
              Час&nbsp;
              <span
                className="word-fade text-ios-blue font-semibold"
                style={{ opacity: wordVisible ? 1 : 0 }}
              >
                {WORDS[wordIdx]}
              </span>
              &nbsp;— AI допоможе
            </p>
          </div>

          {/* Capability chips */}
          <div className="anim-chips-row flex justify-center gap-2 flex-wrap">
            {CHIPS.map((chip, i) => (
              <div
                key={chip.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ios-bg2 border border-ios-sep"
                style={chipsVisible ? {
                  animation: `chip-in 0.4s ease both`,
                  animationDelay: `${i * 0.08}s`,
                } : { opacity: 0 }}
              >
                <span>{chip.icon}</span>
                <span className="text-ios-caption text-ios-label2">{chip.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            {/* Primary — glow pulse */}
            <Link
              href="/funnel"
              className="anim-cta-primary btn-glow w-full min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px]
                         flex items-center justify-center gap-2
                         active:scale-[0.97] active:brightness-90
                         transition-all duration-150"
            >
              Почати
            </Link>

            {/* Secondary */}
            <Link
              href="/capture"
              className="anim-cta-sec w-full min-h-[50px] bg-ios-gray3 text-white text-ios-headline rounded-[14px]
                         flex items-center justify-center gap-2
                         active:scale-[0.97] active:brightness-75
                         transition-all duration-150"
            >
              Спробувати демо
            </Link>

            {/* Ghost */}
            <Link
              href="/login"
              className="anim-cta-ghost w-full min-h-[50px] border border-ios-sep-opaque text-ios-label2 text-ios-body
                         rounded-[14px] flex items-center justify-center gap-2
                         active:scale-[0.97] active:bg-ios-gray3
                         transition-all duration-150"
            >
              Увійти через Google
            </Link>
          </div>

          {/* Footer note */}
          <p className="anim-footer text-center text-ios-label4 text-ios-caption">
            Демо-режим не потребує реєстрації
          </p>
        </div>
      </div>
    </>
  )
}
