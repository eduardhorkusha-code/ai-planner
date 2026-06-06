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

    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code)

    // Track this user in planner_users (ai-planner specific — not the shared auth pool)
    try {
      const user = sessionData?.user ?? (await supabase.auth.getUser()).data.user
      if (user) {
        const { getAdminSupabase } = await import('@/lib/supabase/admin')
        const admin = getAdminSupabase()
        if (admin) {
          await admin.from('planner_users').upsert(
            {
              user_id: user.id,
              email: user.email ?? null,
              last_seen: new Date().toISOString(),
            },
            { onConflict: 'user_id', ignoreDuplicates: false },
          )
          // first_seen is set by DB default on insert; upsert leaves it untouched on conflict
        }
      }
    } catch {
      // Gracefully ignore — never block the redirect over analytics
    }

    return NextResponse.redirect(new URL('/capture', url.origin))
  } catch {
    // Any error (missing env, OAuth failure, network) → redirect gracefully
    return NextResponse.redirect(new URL('/login', url.origin))
  }
}
