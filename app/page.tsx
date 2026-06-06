import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-start pt-20 px-4 pb-12">
      <div className="w-full max-w-md flex flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col gap-3 text-center">
          {/* Logomark — rounded rect, no emoji */}
          <div className="mx-auto w-14 h-14 bg-ios-bg2 rounded-[18px] flex items-center justify-center mb-1">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="4" y="6" width="24" height="3" rx="1.5" fill="#0A84FF"/>
              <rect x="4" y="12" width="18" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
              <rect x="4" y="18" width="21" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
              <rect x="4" y="24" width="14" height="3" rx="1.5" fill="rgba(235,235,245,0.25)"/>
            </svg>
          </div>
          <h1 className="text-ios-title1 text-ios-label">AI Planner</h1>
          <p className="text-ios-body text-ios-label2">
            AI-планер дня: кинь думки&nbsp;— отримай реалістичний план
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {/* Primary */}
          <Link
            href="/funnel"
            className="w-full min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px]
                       flex items-center justify-center gap-2
                       active:scale-[0.97] active:brightness-90
                       transition-all duration-150"
          >
            Почати
          </Link>

          {/* Secondary */}
          <Link
            href="/capture"
            className="w-full min-h-[50px] bg-ios-gray3 text-white text-ios-headline rounded-[14px]
                       flex items-center justify-center gap-2
                       active:scale-[0.97] active:brightness-75
                       transition-all duration-150"
          >
            Спробувати демо
          </Link>

          {/* Ghost */}
          <Link
            href="/login"
            className="w-full min-h-[50px] border border-ios-sep-opaque text-ios-label2 text-ios-body
                       rounded-[14px] flex items-center justify-center gap-2
                       active:scale-[0.97] active:bg-ios-gray3
                       transition-all duration-150"
          >
            Увійти через Google
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-ios-label4 text-ios-caption">
          Демо-режим не потребує реєстрації
        </p>
      </div>
    </div>
  )
}
