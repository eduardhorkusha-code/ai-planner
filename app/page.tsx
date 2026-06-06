import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col gap-3 text-center">
          <div className="text-5xl mb-1">✨</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Planner</h1>
          <p className="text-gray-400 text-base leading-snug">
            AI-планер дня: кинь думки&nbsp;— отримай реалістичний план
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/funnel"
            className="w-full min-h-[52px] bg-blue-600 hover:bg-blue-500 active:scale-[0.98]
                       text-white font-semibold text-lg rounded-2xl flex items-center justify-center
                       gap-2 transition-all"
          >
            ✨ Почати
          </Link>

          <Link
            href="/capture"
            className="w-full min-h-[52px] bg-gray-800 hover:bg-gray-700 active:scale-[0.98]
                       text-white font-semibold text-lg rounded-2xl flex items-center justify-center
                       gap-2 transition-all"
          >
            👀 Спробувати демо
          </Link>

          <Link
            href="/login"
            className="w-full min-h-[52px] bg-transparent border border-gray-700 hover:border-gray-500
                       active:scale-[0.98] text-gray-300 hover:text-white font-semibold text-lg
                       rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            Увійти через Google
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs">
          Демо-режим не потребує реєстрації
        </p>
      </div>
    </div>
  )
}
