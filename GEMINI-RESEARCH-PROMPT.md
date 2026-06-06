# Research Brief for Gemini: Integrating Supabase into "ai-planner" (Next.js App Router)

You are a senior full-stack engineer specializing in Supabase + Next.js. I need a **practical, up-to-date (2026) implementation guide** to add Supabase (Postgres DB + Auth) to my existing project. Give me **working code I can paste**, exact file paths, and a thorough list of real-world gotchas. Do not give generic marketing overviews — assume I'm shipping today.

---

## My exact context (you do NOT have access to my repo — everything you need is below)

**Project:** `ai-planner` — an AI day-planner ("Todoist with an AI heart"), **mobile-first**. Users dump a brain-dump of tasks, an AI parses them into structured tasks, and they triage into Today.

**Stack (verified from package.json):**
- **Next.js `16.2.7`** (App Router, `app/` directory) — note: the React Compiler (`babel-plugin-react-compiler`) is enabled.
- **React `19.2.4`** / **React-DOM `19.2.4`**
- **TypeScript `^5`**, `strict: true`, path alias `@/*` → `./*`
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **AI:** `@anthropic-ai/sdk` (Claude Haiku) called **server-side only** in `app/api/parse/route.ts`
- Deployed on **Vercel** (`npx vercel --prod --yes`), live at `https://ai-planner-swart.vercel.app`
- **No DB and no auth today.** All state is in `localStorage` under the key `ai_planner_tasks`.

> Important: my research notes earlier said "Next.js 14", but package.json proves it's **Next 16 / React 19**. Please make all code **valid for App Router on Next 15/16 with React 19** (e.g. `cookies()` is async, Route Handlers signatures, etc.). Flag anywhere the API differs from older Next 13/14 tutorials, because most online examples are stale.

**Supabase project (already created):**
- ref: `wijxqpoghyaizaupmcmv`
- URL: `https://wijxqpoghyaizaupmcmv.supabase.co`

**Current file structure:**
```
app/
  layout.tsx
  page.tsx
  TabBar.tsx              // bottom nav: Capture / Inbox / Today
  globals.css
  api/
    parse/route.ts        // POST → Claude → Task[] (server route)
  capture/page.tsx        // textarea + mic (Web Speech API uk-UA) → /api/parse → localStorage → /inbox
  inbox/page.tsx          // task list, "На сьогодні" / "Видалити", empty-state demo seed
  today/page.tsx          // checklist, progress bar, time-remaining estimate
lib/
  types.ts                // Task model (below)
  store.ts                // localStorage CRUD (below)
```

**My data model (`lib/types.ts`):**
```typescript
export type Priority = "must" | "nice"
export type Status = "inbox" | "today" | "done"

export type Task = {
  id: string
  title: string
  priority: Priority
  estimateMin: number
  deadline: string | null   // ISO string or null
  status: Status
}
```

**My current persistence layer (`lib/store.ts`) — all sync, all localStorage:**
```typescript
const KEY = "ai_planner_tasks"
export function getTasks(): Task[]
export function saveTasks(tasks: Task[]): void
export function addTasks(newTasks: Task[]): void
export function updateTaskStatus(id: string, status: Status): void
export function deleteTask(id: string): void
```
These are called directly inside client components (`capture`, `inbox`, `today` pages).

**Goal:** Add Supabase so tasks are persisted per-user in Postgres, with **Google OAuth login**, while keeping the mobile UX snappy. I want to migrate `store.ts` from localStorage to Supabase **without breaking the existing UX** and ideally migrate any tasks already sitting in a visitor's localStorage into their account on first login.

**Additional scope (hackathon):** I am also adding a **pre-login question funnel** (a few qualifying questions — "why do you need this", "who are you" — shown BEFORE login) whose answers are stored in a `funnel_responses` table (insert allowed for anonymous visitors), plus an **admin analytics page** that reads those responses. Please cover anonymous-insert RLS for `funnel_responses` and how to gate the admin page.

---

## What I need you to research and return

Structure your answer in the **numbered sections below**. For each, give **exact file paths, complete pasteable code, and a "Gotchas" callout**. Prefer the modern `@supabase/ssr` package (NOT the deprecated `@supabase/auth-helpers-nextjs`) — confirm this is still the recommended path in 2026 and note the current package version.

### 1. Supabase + Next.js App Router wiring with `@supabase/ssr`
- Exact `npm install` line and package versions.
- Three client factories with full code and exact paths:
  - `lib/supabase/client.ts` — browser client (for Client Components).
  - `lib/supabase/server.ts` — server client using the **async** `cookies()` from `next/headers` (Next 15/16). Show the correct `getAll`/`setAll` cookie adapter.
  - `middleware.ts` (project root) — session refresh middleware, with the correct `matcher` config (excluding `_next`, static assets, favicon, and importantly the `/api/parse` route if needed). Explain why the middleware must return the exact `supabaseResponse` object and the classic "do not create a new response" footgun.
- Clarify which client to use in: Server Components, Client Components, Route Handlers (`app/api/.../route.ts`), and Server Actions.

### 2. Supabase Auth with Google OAuth
- Step-by-step: configuring the Google provider in the Supabase dashboard (Google Cloud OAuth consent screen + credentials), and exactly which **Authorized redirect URI** to register in Google Cloud (the `https://wijxqpoghyaizaupmcmv.supabase.co/auth/v1/callback` form) vs the **Site URL / Redirect URLs** allowlist in Supabase Auth settings.
- The PKCE / code-exchange flow for App Router: full code for the callback Route Handler at `app/auth/callback/route.ts` that calls `exchangeCodeForSession`, plus the `signInWithOAuth({ provider: 'google', options: { redirectTo } })` call from the client.
- How to compute `redirectTo` correctly for **localhost vs Vercel preview vs Vercel production** (the `window.location.origin` vs `NEXT_PUBLIC_SITE_URL` decision, and Vercel's `VERCEL_URL`). Cover preview-deploy URLs specifically — they change per deploy and break OAuth allowlists.
- A minimal sign-in button and sign-out action, mobile-friendly.

### 3. RLS policies for a per-user `tasks` table
- A SQL migration that creates a `tasks` table mapping my `Task` model (columns: `id uuid default gen_random_uuid()`, `user_id uuid references auth.users`, `title text`, `priority text check (...)`, `estimate_min int`, `deadline timestamptz null`, `status text check (...)`, `created_at`, plus an index on `user_id`). Note any naming-convention advice (snake_case in DB vs camelCase in my TS — how to map cleanly).
- `enable row level security` plus the full set of **four policies** (select/insert/update/delete) scoped to `auth.uid() = user_id`. Show the `with check` clause for insert/update and explain the difference between `using` and `with check`.
- Gotchas: why a missing `with check` lets users insert rows they can't read; why `default auth.uid()` on `user_id` is convenient but still needs the insert policy; what happens to RLS when you (mistakenly) query with the service-role key.

### 4. Environment variables (Vercel + local)
- A table of every env var: name, value source, **public vs server-only**, where set.
  - `NEXT_PUBLIC_SUPABASE_URL` and the new **publishable key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY` / the 2026 `sb_publishable_...` key) — clarify the current naming, since Supabase rotated key formats. Confirm what's safe to expose to the browser.
  - The **secret/service-role key** (`sb_secret_...`) — server-only, must never be `NEXT_PUBLIC_`.
- Exact `.env.local` template for local dev, and how to add the same vars in the Vercel dashboard (Production / Preview / Development scopes) — note that Preview needs the vars too or OAuth breaks on preview deploys.
- How `ANTHROPIC_API_KEY` (already set, server-only) coexists. (Context: I previously had an invisible `U+2028` char corrupt that key and crash the Anthropic SDK with a ByteString header error — so please warn about whitespace/non-ASCII contamination when pasting any key into Vercel.)

### 5. Migrating from localStorage to Supabase without UX regression
- A drop-in rewrite of `lib/store.ts` that keeps the **same function names** but becomes async (`getTasks(): Promise<Task[]>`, etc.), backed by Supabase. Show how to adapt the three calling pages given they currently call these synchronously.
- **Optimistic updates** for mobile: pattern for instant UI feedback on add/complete/delete with rollback on error. Recommend whether to use plain React state, React 19 `useOptimistic`, SWR, or TanStack Query — and justify the pick for a small mobile app.
- A **one-time migration** routine: on first successful login, read any tasks from the old `localStorage["ai_planner_tasks"]`, bulk-insert into Supabase with the new `user_id`, then clear localStorage. Handle the "guest used the app, then logs in" case so nothing is lost.
- Realtime: should I bother with Supabase Realtime subscriptions for a single-user planner, or is fetch-on-navigate enough? Give a recommendation with reasoning.

### 6. Top 10 real-world gotchas (the most important section)
List the **10 most common failure modes** for exactly this Supabase + Next App Router + Vercel + Google OAuth stack, each with **symptom → root cause → fix (with code)**. Must include at minimum:
1. **OAuth redirect loop** / "redirected you too many times" after Google sign-in.
2. **RLS silently blocks inserts** (insert returns no error but no row, or `new row violates row-level security policy`).
3. **Cookies not set in SSR** — session works client-side but Server Components see the user as logged out.
4. **Expired / not-refreshed session** — user appears logged in but every query 401s after an hour (middleware not refreshing).
5. **`cookies()` must be awaited** error on Next 15/16 (stale tutorials use sync `cookies()`).
6. **Wrong redirect URI** mismatch between Google Cloud, Supabase, and Vercel preview URLs.
7. **Service-role key leaking** to the client or bypassing RLS unintentionally.
8. **Middleware response object footgun** (creating a fresh `NextResponse` and losing refreshed auth cookies).
9. **PKCE code-verifier cookie missing** on the callback (third-party cookie / SameSite issues on mobile Safari).
10. **Hydration / "supabase client created on server" mismatches** when the wrong client factory is imported in a Client vs Server Component.

For each gotcha, give the **one-line fix** plus a code snippet where applicable.

---

## Output format requirements
- Use the numbered section structure above.
- Every code block must be **complete and pasteable** (no `...` elisions in critical files), with the **target file path as a comment on the first line**.
- All code valid for **Next.js 16 / React 19 App Router + TypeScript strict**.
- Mark each section's pitfalls under a bold **Gotchas:** sub-heading.
- Where the 2026 API differs from older (Next 13/14, `auth-helpers`) tutorials, **explicitly call it out** so I don't copy stale code.
- Keep prose tight; favor code and checklists over explanation.
