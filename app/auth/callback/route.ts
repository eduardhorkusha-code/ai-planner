import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')

  // Env check — if Supabase isn't configured, skip straight to capture
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/capture', url.origin))
  }

  try {
    // Lazy import to avoid any top-level side effects
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')

    const cookieStore = await cookies()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    await supabase.auth.exchangeCodeForSession(code)

    return NextResponse.redirect(new URL('/capture', url.origin))
  } catch {
    // Any error (missing env, OAuth failure, network) → redirect gracefully
    return NextResponse.redirect(new URL('/login', url.origin))
  }
}
