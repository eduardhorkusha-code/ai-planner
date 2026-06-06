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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-950 text-white">
      {/* Back link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          &#8592; На головну
        </Link>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-8 text-center">
        {/* Logo / heading */}
        <div className="flex flex-col gap-2">
          <div className="text-4xl mb-1">&#x1F9E0;</div>
          <h1 className="text-2xl font-bold tracking-tight">AI Planner</h1>
          <p className="text-gray-400 text-sm">Увійди, щоб зберегти прогрес</p>
        </div>

        {showFallback ? (
          /* Graceful degradation */
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl px-4 py-3 text-sm text-amber-300 bg-amber-950/50 border border-amber-800/40"
            >
              Логін ще не налаштовано
            </div>
            <Link
              href="/capture"
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 font-semibold text-base bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all"
            >
              Продовжити як гість &#8594;
            </Link>
          </div>
        ) : (
          /* Normal login */
          <div className="flex flex-col gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 px-6 font-semibold text-base bg-white text-gray-900 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="text-gray-500 text-xs">або</div>

            <Link
              href="/capture"
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-6 text-sm text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white active:scale-95 transition-all"
            >
              Продовжити як гість &#8594;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
