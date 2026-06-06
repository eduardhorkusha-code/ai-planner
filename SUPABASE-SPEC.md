# Supabase Integration Spec — ai-planner

> **Тип документа:** DESIGN / архітектурне рішення. Це **НЕ** інструкція до імплементації під час хакатону.
> **Проєкт ref:** `wijxqpoghyaizaupmcmv` · URL: `https://wijxqpoghyaizaupmcmv.supabase.co`
> **Стан коду на момент спеки:** Next.js 16.2.7 / React 19 (App Router), TS strict, Tailwind 4. Стан — `localStorage` (`lib/store.ts`, синхронний API). Стабільний коміт: тег `stable-core-green`.
> **Контекст:** фінал хакатону сьогодні 17:45. Live demo на телефоні. Журі оцінює: реально працює · задеплоєно на Vercel · є AI · mobile-first.

---

## 1. Чи варто це зараз?

**Коротка відповідь: ні, не до демо. Так — як P2, одразу після хакатону.**

Чесний аналіз, без прикрас:

- **`localStorage` вже персистить дані per-device.** Закрив вкладку — задачі лишились. Для live demo на одному телефоні цього **достатньо**. Журі побачить "реально працює" і так.
- **Supabase БЕЗ auth не дає жодної переваги над `localStorage` для демо.** Два сценарії, обидва погані:
  - **Глобальна таблиця без `user_id`** — усі користувачі бачать спільні задачі. Якщо журі відкриє свій телефон, побачить чужі/тестові задачі. Це гірше за `localStorage`, не краще.
  - **Per-device ключ (anon device id)** — це рівно те, що вже робить `localStorage`, тільки з мережевою затримкою, точкою відмови (немає інтернету на сцені → демо падає) і зайвою складністю.
- **РЕАЛЬНА цінність Supabase з'являється тільки з Auth:** per-user дані, крос-девайс синхронізація (почав на ноуті — продовжив на телефоні), "секьюрно" (RLS). Це **advanced idea #1 (Google Auth)** з брифу — саме її журі цінує як ознаку зрілості продукту.
- **Ризик під дедлайн критичний:** Google OAuth + redirect URL на Vercel — класичне місце, де згорає 40–60 хв на `redirect_uri_mismatch`. За 1 год 45 хв до демо це ставка, яка може забрати **стабільний зелений прод**.

### Рекомендація
| Коли | Що робити |
|------|-----------|
| **До 17:45 (демо)** | **Нічого не чіпати.** `localStorage` лишається. Core-флоу зелений — це головний актив. |
| **Якщо лишається 30+ хв і core стабільний** | Можна почати ТІЛЬКИ за feature-флагом (розділ 7), не зливаючи в основний шлях. Якщо горить — відкат за 1 команду. |
| **P2 (після хакатону)** | Повна інтеграція Supabase Auth + RLS за цією спекою. Це правильний наступний крок для "далі створювати і зберігати дані". |

> **Принцип хакатону:** стабільний коміт перед розширенням; один сценарій до кінця > 5 напівготових; не ламати робоче перед демо. Supabase — розширення, а core вже працює. Отже — після демо.

`localStorage` **залишається безпечним fallback** назавжди: офлайн-режим, перший запуск до логіну, аварійний відкат.

---

## 2. Рекомендована архітектура

```
Browser (Next.js App Router, mobile-first)
   │
   ├─ Google "Увійти" → Supabase Auth (OAuth, PKCE)
   │        ↓ redirect callback
   │   app/auth/callback/route.ts  → обмінює code на сесію (cookie)
   │
   ├─ middleware.ts (@supabase/ssr) → рефреш сесії на кожен запит
   │
   └─ lib/store.ts (async)
            ├─ залогінений → Supabase tables.tasks (RLS keyed на auth.uid())
            └─ гість / офлайн → localStorage (fallback, additive)
```

Ключові рішення:
- **Auth-провайдер:** Supabase Auth з **Google OAuth** (advanced idea #1). Email/password — НЕ потрібно, зайвий UI.
- **Бібліотека:** **`@supabase/ssr`** — офіційний шлях для Next.js App Router (cookie-based сесії, працює і в Server Components, і в Route Handlers, і в middleware). НЕ використовувати застарілий `@supabase/auth-helpers-nextjs`.
- **Доступ до даних:** з браузера через **anon key + RLS**. Service-role key на клієнт **ніколи** не потрапляє. RLS — єдина межа безпеки.
- **Сумісність API:** `lib/store.ts` стає async, але **зберігає ті самі назви функцій** (`getTasks/saveTasks/addTasks/updateTaskStatus/deleteTask`), щоб мінімізувати зміни в екранах.

---

## 3. Схема БД (SQL міграція)

Виконати в Supabase Dashboard → **SQL Editor** (проєкт `wijxqpoghyaizaupmcmv`).

```sql
-- migration: 001_tasks.sql
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  priority     text not null check (priority in ('must', 'nice')),
  estimate_min integer not null default 0 check (estimate_min >= 0),
  deadline     date,                          -- nullable
  status       text not null default 'inbox'
                 check (status in ('inbox', 'today', 'done')),
  created_at   timestamptz not null default now()
);

-- швидкий вибір задач поточного користувача
create index if not exists tasks_user_id_idx on public.tasks (user_id);
```

Мапінг на `Task` (camelCase у TS ↔ snake_case у БД):

| TS (`lib/types.ts`) | Колонка БД | Примітка |
|---------------------|-----------|----------|
| `id: string` | `id uuid` | генерує БД (`gen_random_uuid()`) |
| — | `user_id uuid` | з `auth.uid()`, на клієнті не задаємо вручну |
| `title: string` | `title text` | |
| `priority: "must"\|"nice"` | `priority text` | check-constraint віддзеркалює union-тип |
| `estimateMin: number` | `estimate_min int` | |
| `deadline: string\|null` | `deadline date` | ISO `YYYY-MM-DD` |
| `status: "inbox"\|"today"\|"done"` | `status text` | check-constraint |
| — | `created_at timestamptz` | для сортування Inbox |

> Мапінг camelCase↔snake_case ізолюємо в `lib/store.ts` (один хелпер `rowToTask` / `taskToRow`), щоб типи в UI не змінювались.

---

## 4. RLS політики (SQL)

**Без RLS таблиця з anon key відкрита всьому світу.** Це обов'язковий крок, не опційний.

```sql
-- migration: 002_tasks_rls.sql
alter table public.tasks enable row level security;

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);
```

Перевірка після застосування: в SQL Editor `select * from public.tasks;` під анонімною сесією має повертати **0 рядків** (а не помилку) — RLS працює.

> Зручність: при insert не передавати `user_id` з клієнта вручну — додати `default auth.uid()` на колонку АБО проставляти в `taskToRow`. `with check` все одно не дасть записати чужий `user_id`.

---

## 5. Env-змінні

| Змінна | Значення | Де взяти |
|--------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wijxqpoghyaizaupmcmv.supabase.co` | Supabase Dashboard → **Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci…` (публічний anon/`publishable` ключ) | Supabase Dashboard → **Settings → API → Project API keys → anon public** |

- **`NEXT_PUBLIC_` префікс обов'язковий** — ключі читаються в браузері. Anon key безпечно експонувати: захист — це RLS, не секретність ключа.
- **`service_role` ключ НЕ додавати** — він не потрібен (усе через RLS) і його не можна світити в `NEXT_PUBLIC_`.
- Додати у **Vercel → Project → Settings → Environment Variables** (Production + Preview) і локально в `.env.local`.
- Урок з нещодавнього інциденту: при копіюванні ключів **зрізати non-ASCII / U+2028** (як зробили для `ANTHROPIC_API_KEY`). Anon key — чистий JWT, але правило лишається.

### Google OAuth — redirect URL (місце, де горить час)
1. **Supabase Dashboard → Authentication → Providers → Google** → увімкнути, вставити Google `Client ID` + `Client Secret`.
2. **Google Cloud Console → APIs & Services → Credentials → OAuth client → Authorized redirect URIs** додати **рівно**:
   ```
   https://wijxqpoghyaizaupmcmv.supabase.co/auth/v1/callback
   ```
   (це Supabase callback, НЕ Vercel-домен — типова помилка #1).
3. **Supabase Dashboard → Authentication → URL Configuration:**
   - **Site URL:** `https://ai-planner-swart.vercel.app`
   - **Redirect URLs (allow-list):** додати обидва:
     ```
     https://ai-planner-swart.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```
4. У коді `signInWithOAuth` передавати `redirectTo: ${window.location.origin}/auth/callback`.

> Будь-яка розбіжність між цими трьома місцями → `redirect_uri_mismatch` або "redirect URL not allowed". Це класична хакатонна чорна діра. Перевіряти спочатку на `localhost`, лише потім на Vercel.

---

## 6. Зміни у файлах

Усе **additive**: `localStorage`-логіка лишається як fallback-гілка, не видаляється.

| Файл | Дія | Суть |
|------|-----|------|
| `package.json` | змінити | `npm i @supabase/supabase-js @supabase/ssr` |
| `lib/supabase/client.ts` | **створити** | browser-клієнт: `createBrowserClient(URL, ANON_KEY)` з `@supabase/ssr` |
| `lib/supabase/server.ts` | **створити** | server-клієнт (`createServerClient`) для Route Handler / Server Components — читання cookies |
| `middleware.ts` (корінь) | **створити** | рефреш сесії на кожен запит (`@supabase/ssr` cookie boilerplate); `matcher` без статики |
| `app/auth/callback/route.ts` | **створити** | OAuth callback: `exchangeCodeForSession(code)` → редірект на `/inbox` |
| `lib/store.ts` | **переписати (additive)** | async-бекенд Supabase зі **збереженням сигнатур** (див. нижче) + fallback на localStorage |
| `app/login/page.tsx` (або модалка) | **створити** | кнопка "Увійти через Google" → `signInWithOAuth({ provider: 'google' })`; mobile-first |
| `app/TabBar.tsx` | змінити | індикатор логіну / кнопка "Вийти" (`signOut`) |
| `app/capture/page.tsx`, `app/inbox/page.tsx`, `app/today/page.tsx` | змінити | `await` на store-виклики; кожен — Client Component із `useEffect`-завантаженням |
| `.env.local`, Vercel env | змінити | дві `NEXT_PUBLIC_SUPABASE_*` змінні (розділ 5) |

### `lib/store.ts` — async зі збереженими сигнатурами
Поточний API синхронний. Стає async, **назви функцій ті самі** — змінюється тільки `Promise`-обгортка + `await` у місцях виклику:

```ts
// БУЛО (sync, localStorage):
export function getTasks(): Task[]
export function addTasks(newTasks: Task[]): void
export function updateTaskStatus(id: string, status: Status): void
export function deleteTask(id: string): void

// СТАЄ (async, Supabase з localStorage-fallback):
export async function getTasks(): Promise<Task[]>
export async function addTasks(newTasks: Task[]): Promise<void>
export async function updateTaskStatus(id: string, status: Status): Promise<void>
export async function deleteTask(id: string): Promise<void>

// Логіка кожної: якщо є сесія → Supabase + RLS; інакше → стара localStorage-гілка (fallback).
```

> **Чому це найбільший шматок роботи:** усі три екрани викликають store синхронно в рендері. Перехід на async = `useEffect` + стан завантаження + `await` на кожній дії. Це не "одна заміна" — це рефактор флоу даних у 3 файлах. Закладати час на це чесно.

---

## 7. План відкату (rollback)

1. **Перед будь-яким рядком коду** зафіксувати точку повернення (тег `stable-core-green` уже існує — переконатись, що він на зеленому коміті, або поставити свіжий):
   ```bash
   git tag -f stable-core-green-demo
   git push origin stable-core-green-demo --force
   ```
2. **Працювати за feature-флагом**, не міняючи дефолтний шлях:
   ```ts
   // lib/store.ts
   const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "1"
   // USE_SUPABASE === false → 100% стара localStorage-поведінка
   ```
   На Vercel прод `NEXT_PUBLIC_USE_SUPABASE` лишається **невстановленим/0** до моменту, коли інтеграція повністю зелена. Демо їде на localStorage навіть якщо код Supabase вже в репо.
3. **Аварійний відкат (1 команда), якщо щось зламалось перед демо:**
   ```bash
   git reset --hard stable-core-green && npx vercel --prod --yes
   ```
4. Гілка/коміти Supabase не зливати в основний шлях, поки не пройдено локальний тест логіну + крос-девайс.

---

## 8. Оцінка часу + ризики під дедлайн 17:45

Зараз ~16:00, до демо ~1 год 45 хв. Чесна оцінка для **повної** інтеграції:

| Крок | Оптимістично | Реалістично |
|------|-------------|-------------|
| Install + два supabase-клієнти + middleware | 15 хв | 25 хв |
| SQL міграція + RLS (розділ 3–4) | 10 хв | 15 хв |
| Google OAuth у Google Cloud + Supabase (3 місця redirect) | 20 хв | **40–60 хв** ⚠️ |
| Login UI + callback route | 15 хв | 25 хв |
| Рефактор `store.ts` на async + `await` у 3 екранах | 25 хв | 45 хв |
| Тест на localhost → деплой → тест на Vercel → тест на телефоні | 20 хв | 40 хв |
| **Разом** | **~1 год 45 хв** | **~3+ год** |

**Висновок: повна інтеграція НЕ влізає в дедлайн навіть в оптимістичному сценарії, і кладе на кін зелений прод.**

### Головні ризики
- 🔴 **Google OAuth `redirect_uri_mismatch`** — найімовірніше місце, де згорить 40–60 хв. Три точки конфігу (Google Console / Supabase callback / Supabase Redirect allow-list) мають збігтися ідеально.
- 🔴 **Async-рефактор `store.ts`** ламає рендер 3 екранів — race conditions, миготіння empty-state, втрата `await` → задачі не зберігаються. Регресія core-флоу.
- 🟠 **Залежність від мережі на сцені** — Supabase-only режим падає без інтернету. Тому fallback на localStorage обов'язковий.
- 🟠 **Vercel env + білд** — забута `NEXT_PUBLIC_` змінна → undefined клієнт → білд або рантайм-краш (наступали на це з API-ключем).

### Рекомендований план дій під дедлайн
1. **До демо:** не чіпати прод. Демонструвати на localStorage (working core — головний актив для журі).
2. **Якщо дуже хочеться показати Auth і лишилось 30+ хв:** реалізувати **лише кнопку "Увійти через Google" + сесію** (без міграції store на Supabase) — це візуально доводить advanced idea #1 за ~30 хв, не чіпаючи флоу даних. Дані лишаються в localStorage. Менший ризик, видимий wow-ефект.
3. **Повна БД-інтеграція (store на Supabase + RLS + крос-девайс):** P2, перший пункт після хакатону. Уся ця спека — готовий план на завтра.

> Один зелений сценарій на телефоні переб'є п'ять напівзроблених фіч із червоним продом. Supabase того не вартий до 17:45.
