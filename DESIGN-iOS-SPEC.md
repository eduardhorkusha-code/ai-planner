# DESIGN-iOS-SPEC.md — AI Planner iOS Native Design Specification

**Status:** Blueprint for Wave 3 implementation · **Scope:** Visual layer only — zero logic changes, fully additive
**Priority:** P0 = 1 file, global effect · P1 = per-screen polish · P2 = micro-detail

---

## 1. Design Tokens — iOS Dark Palette → `app/globals.css`

Extend the `@theme inline` block so Tailwind v4 generates utilities automatically.

```css
@import "tailwindcss";

@theme inline {
  /* Fonts */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;

  /* iOS Dark Backgrounds */
  --color-ios-bg:   #000000;   /* systemBackground — true black OLED */
  --color-ios-bg2:  #1C1C1E;   /* secondary — cards */
  --color-ios-bg3:  #2C2C2E;   /* tertiary — nested */

  /* Separators */
  --color-ios-sep:        rgba(84,84,88,0.65);
  --color-ios-sep-opaque: #38383A;

  /* Labels */
  --color-ios-label:        rgba(255,255,255,1.00);
  --color-ios-label2:       rgba(235,235,245,0.60);
  --color-ios-label3:       rgba(235,235,245,0.30);
  --color-ios-label4:       rgba(235,235,245,0.18);
  --color-ios-placeholder:  rgba(235,235,245,0.30);

  /* System colors (dark) */
  --color-ios-blue:   #0A84FF;
  --color-ios-green:  #30D158;
  --color-ios-red:    #FF453A;
  --color-ios-orange: #FF9F0A;
  --color-ios-gray:   #636366;
  --color-ios-gray2:  #48484A;
  --color-ios-gray3:  #3A3A3C;

  /* Legacy (keep — existing gray-* classes still work during migration) */
  --color-background: #000000;
  --color-foreground: rgba(255,255,255,1.00);
}

:root { --background:#000; --foreground:rgba(255,255,255,1); color-scheme: dark; }
*, *::before, *::after { -webkit-tap-highlight-color: transparent; -webkit-font-smoothing: antialiased; }
body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); }
:focus { outline: none; }
:focus-visible { outline: 2px solid #0A84FF; outline-offset: 2px; }
```

Generated utilities: `bg-ios-bg2`, `text-ios-label2`, `text-ios-blue`, `bg-ios-blue`, `border-ios-sep`. Existing `bg-gray-*` remain valid — migrate component-by-component.

## 2. Typography — SF Pro + iOS scale (`@layer utilities` in globals.css)

> Critical: `layout.tsx` loads Geist as `--font-sans`. The `@theme` override swaps it to the system SF stack → on iOS Safari resolves to SF Pro instantly, 0 bundle bytes. Keep Geist only if desired for desktop.

```css
@layer utilities {
  .text-ios-large-title { font-size:2.125rem; font-weight:700; letter-spacing:-0.5px; line-height:1.15; }
  .text-ios-title1 { font-size:1.75rem;  font-weight:700; letter-spacing:-0.3px; line-height:1.2; }
  .text-ios-title2 { font-size:1.375rem; font-weight:700; letter-spacing:-0.2px; line-height:1.25; }
  .text-ios-title3 { font-size:1.25rem;  font-weight:600; line-height:1.3; }
  .text-ios-headline { font-size:1.0625rem; font-weight:600; line-height:1.35; }
  .text-ios-body { font-size:1.0625rem; font-weight:400; line-height:1.4; }
  .text-ios-subhead { font-size:0.9375rem; font-weight:400; line-height:1.4; }
  .text-ios-footnote { font-size:0.8125rem; font-weight:400; line-height:1.38; }
  .text-ios-caption { font-size:0.75rem; font-weight:400; line-height:1.33; }
  .text-ios-caption2 { font-size:0.6875rem; font-weight:400; line-height:1.33; }
}
```

Mapping: `text-2xl font-bold`→`text-ios-title2` · `text-3xl font-bold`→`text-ios-title1` · `text-base/lg`→`text-ios-body` · `text-sm`→`text-ios-subhead/footnote` · `text-xs`→`text-ios-caption`. Navigation-level page H1 → `text-ios-large-title`.

## 3. Components (Tailwind class strings)

- **Primary button:** `w-full min-h-[50px] bg-ios-blue text-white text-ios-headline rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] active:brightness-90 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none`  (replaces `bg-blue-600` #2563EB — purple on iOS — with #0A84FF)
- **Secondary button:** `... bg-ios-gray3 text-white ... active:brightness-75`
- **Ghost button (guest):** `... border border-ios-sep-opaque text-ios-label2 text-ios-body ... active:bg-ios-gray3`
- **Card:** `bg-ios-bg2 rounded-2xl` (no border — bg contrast suffices; internal dividers `border-b border-ios-sep`; padding `p-4`)
- **Checkbox:** `w-6 h-6 rounded-full`, unchecked `border-2 border-ios-gray2`, checked `bg-ios-green border-ios-green`, SVG checkmark (`<svg viewBox="0 0 12 9"><path d="M1 4L4.5 7.5L11 1" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`), `active:scale-[0.9]`
- **Priority pill (must):** `inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ios-red/15 text-ios-red text-ios-caption font-medium` + leading dot; label "Терміново" (no emoji). **nice:** `bg-ios-gray3/50 text-ios-label3`
- **TabBar:** `bg-black/70 backdrop-blur-2xl border-t border-ios-sep`; **SVG icons (not emoji ✏️📥✅)**; active `text-ios-blue`, inactive `text-ios-gray`; labels `text-ios-caption2`
- **Progress bar:** `h-1 bg-ios-gray3 rounded-full`; fill `bg-ios-blue` (→ `bg-ios-green` at 100%); `transition-[width] duration-300 ease-out`
- **Textarea:** `bg-ios-bg2 rounded-2xl p-4 focus:ring-1 focus:ring-ios-blue/50 outline-none placeholder:text-ios-placeholder` (no hard border)
- **Funnel option cards:** `bg-ios-bg2 rounded-2xl p-4 border border-ios-sep-opaque active:scale-[0.97] active:bg-ios-gray3` (chevron SVG `›`, NO hover)
- **Back link:** `text-ios-blue text-ios-body` + `‹` SVG chevron

## 4. Per-Screen Fixes (visual only)

**Landing (`app/page.tsx`):** `bg-gray-950`→`bg-ios-bg`; hero emoji→SVG/logomark; headline→`text-ios-title1`; body→`text-ios-body text-ios-label2`; 3 CTAs→primary/secondary/ghost patterns (`bg-ios-blue`, `rounded-[14px]`, `active:` not `hover:`); footer→`text-ios-caption text-ios-label4`; `justify-start pt-20` for thumb reach.

**Funnel (`app/funnel/page.tsx`):** `bg-ios-bg`; counter "1 з 3" `text-ios-caption text-ios-label3`; progress `h-[3px] bg-ios-gray3` fill `bg-ios-blue`; card `bg-ios-bg2 rounded-2xl p-5` (drop rounded-3xl/border); question→`text-ios-title3`; **option buttons: remove `hover:`, add `active:scale-[0.97] active:bg-ios-gray3`, always-visible `border-ios-sep-opaque`, SVG chevron**; skip(top)→`text-ios-blue`; done spinner→`border-ios-blue`.

**Login (`app/login/page.tsx`):** `bg-ios-bg`; back link→`text-ios-blue` + safe-area top; logo emoji→rounded-rect `w-14 h-14 bg-ios-bg2 rounded-[18px]`; headline→`text-ios-title2`; Google button stays white, `min-h-[50px] rounded-[14px] active:brightness-95`; "або" divider with `border-ios-sep` lines; ghost guest button §3.3; warning→`bg-ios-orange/10 text-ios-orange`; **fallback CTA `bg-indigo-600`→`bg-ios-blue`** (indigo not in palette).

**Capture (`app/capture/page.tsx`):** safe-area top padding; H1→`text-ios-large-title` (drop 🧠); subhead→`text-ios-subhead text-ios-label2`; textarea §3.11; mic `bg-ios-gray3`/listening `bg-ios-red`, 🎙️→SVG; sticky bar `bg-black/80 backdrop-blur-xl`; parse button §3.1, `text-ios-headline` (drop ✨); error→`text-ios-red`.

**Inbox (`app/inbox/page.tsx`):** H1→`text-ios-large-title` (drop 📥); cards `bg-ios-bg2 rounded-2xl p-4` (no border); priority pills §3.6; title→`text-ios-headline`; meta→`text-ios-footnote text-ios-label2` (⏱📅→SVG); buttons §3.1 + `active:`; delete `active:bg-ios-red/20 active:text-ios-red`, 🗑→SVG; empty-state CTAs→patterns.

**Today (`app/today/page.tsx`):** H1→`text-ios-large-title` (drop ✅); progress `h-1`, `bg-ios-gray3`/`bg-ios-green`/`bg-ios-blue`; celebration `text-ios-green` (keep 🎉); time/warning→`text-ios-footnote`, ⏱⚠️→SVG; task rows `bg-ios-bg2` no border, done = `opacity-50`; checkbox §3.5; done title `text-ios-label3`.

**Admin (`app/admin/page.tsx`):** `bg-ios-bg`; cards `bg-ios-bg2 rounded-2xl`; section headers `text-ios-caption text-ios-label3 uppercase tracking-widest`; big number→`text-ios-title1 text-ios-blue` (violet→blue); funnel bars `bg-ios-blue` / `/70` / `/40`; track `bg-ios-gray3`; rows `border-ios-sep`, label tokens; `pb-[env(safe-area-inset-bottom)]`.

## 5. Micro-Interactions
- **Replace ALL `hover:` with `active:`** — `active:scale-[0.97]` (buttons/cards), `active:scale-[0.90]` (icons/checkbox), `active:brightness-90` (filled), `transition-all duration-150 ease-out`. (hover flashes on touch — not native feel.)
- Optional spring: `.transition-spring { transition: transform 150ms cubic-bezier(0.34,1.56,0.64,1); }` on CTA + checkbox.
- Loading spinner: `animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full`.
- Textarea focus: `focus-within:ring-1 focus-within:ring-ios-blue/40 focus-within:ring-inset` (no hard border).

## 6. Priorities (~1 год)

**P0 — global, 3 files, max effect (~15 хв):** globals.css (SF font stack + iOS tokens + `-webkit-tap-highlight-color:transparent` + type scale) · layout.tsx (`bg-ios-bg` true black) · TabBar.tsx (**SVG icons replacing emoji** + `bg-black/70 backdrop-blur-2xl` + `text-ios-blue`). Hits all 7 screens in 1 reload.

**P1 — per-screen (~30 хв):** Capture → Inbox → Today → Landing → Funnel → Login → Admin (correct blue, remove card borders, emoji→SVG, large titles, `active:` swaps).

**P2 — polish (~15 хв):** transition-spring, focus-within ring, safe-area insets, opacity-graduated admin bars.

## Audit signals caught
- `bg-blue-600` (#2563EB) everywhere → must be `#0A84FF` (visibly purple on OLED).
- Emoji TabBar icons (✏️📥✅) → #1 AI-slop signal, on every screen → SVG.
- `hover:` throughout → non-functional on touch → `active:`.
- `bg-gray-950` (#0a0a0a) vs true `#000` → visible on OLED.
- `violet-500` admin charts → outside iOS palette → systemBlue.
- Geist loaded & prioritized → SF Pro never renders → system stack wins on iOS.
- `rounded-3xl` funnel card → too round, reads Android Material → `rounded-2xl`.
- `border border-gray-800` on cards → visual noise, not iOS → remove.
