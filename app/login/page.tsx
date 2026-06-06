'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getBrowserSupabase } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    const sb = getBrowserSupabase()
    if (!sb) {
      setError('not-configured')
      setLoading(false)
      return
    }

    const { error: oauthError } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError('not-configured')
      setLoading(false)
    }
    // on success — browser navigates away, loading stays true
  }

  const showFallback = error === 'not-configured'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-ios-bg text-ios-label">
      {/* Back link — safe-area top */}
      <div className="absolute top-[max(1.5rem,env(safe-area-inset-top))] left-6">
        <Link
          href="/"
          className="text-ios-blue text-ios-body transition-all duration-150 active:opacity-60"
        >
          &#8249; На головну
        </Link>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-8 text-center">
        {/* Logo / heading */}
        <div className="flex flex-col items-center gap-2">
          {/* Rounded-rect logomark, no emoji */}
          <div className="w-14 h-14 bg-ios-bg2 rounded-[18px] flex items-center justify-center mb-1">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="4" y="6" width="24" height="3" rx="1.5" fill="#0A84FF"/>
              <rect x="4" y="12" width="18" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
              <rect x="4" y="18" width="21" height="3" rx="1.5" fill="rgba(235,235,245,0.45)"/>
              <rect x="4" y="24" width="14" height="3" rx="1.5" fill="rgba(235,235,245,0.25)"/>
            </svg>
          </div>
          <h1 className="text-ios-title2 text-ios-label">AI Planner</h1>
          <p className="text-ios-subhead text-ios-label2">Увійди, щоб зберегти прогрес</p>
        </div>

        {showFallback ? (
          /* Graceful degradation */
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl px-4 py-3 text-ios-footnote text-ios-orange bg-ios-orange/10">
              Логін ще не налаштовано
            </div>
            <Link
              href="/capture"
              className="w-full min-h-[50px] flex items-center justify-center gap-2
                         rounded-[14px] px-6 text-ios-headline text-white bg-ios-blue
                         active:scale-[0.97] active:brightness-90
                         transition-all duration-150"
            >
              Продовжити як гість &#8594;
            </Link>
          </div>
        ) : (
          /* Normal login */
          <div className="flex flex-col gap-4">
            {/* Google button stays white — brand requirement */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full min-h-[50px] flex items-center justify-center gap-3
                         rounded-[14px] px-6 text-ios-headline font-semibold
                         bg-white text-gray-900
                         active:brightness-95 active:scale-[0.97]
                         transition-all duration-150
                         disabled:opacity-50 disabled:pointer-events-none"
            >
              {/* Google G icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="22"
                height="22"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              {loading ? 'Переходимо...' : 'Увійти через Google'}
            </button>

            {/* "або" divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-ios-sep-opaque" />
              <span className="text-ios-label3 text-ios-caption">або</span>
              <div className="flex-1 h-px bg-ios-sep-opaque" />
            </div>

            {/* Ghost guest button */}
            <Link
              href="/capture"
              className="w-full min-h-[50px] flex items-center justify-center gap-2
                         rounded-[14px] px-6 text-ios-body text-ios-label2
                         border border-ios-sep-opaque
                         active:scale-[0.97] active:bg-ios-gray3
                         transition-all duration-150"
            >
              Продовжити як гість &#8594;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
