"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

// SVG icons — iOS SF Symbols equivalents (pencil, tray.and.arrow.down, checkmark.circle)
const IconCapture = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2.5 2.5 0 0 1 3.536 3.536L12.536 14.5 8 16l1.5-4.5z"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 19h14"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
    />
  </svg>
)

const IconInbox = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 12h4l2 3h4l2-3h4"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 12V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6l-2 5H6l-2-5z"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const IconToday = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    />
    <path
      d="M8.5 12.5l2.5 2.5 4.5-5"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const tabs = [
  { href: "/capture", label: "Capture", Icon: IconCapture },
  { href: "/inbox",   label: "Inbox",   Icon: IconInbox   },
  { href: "/today",   label: "Today",   Icon: IconToday   },
]

export default function TabBar() {
  const path = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/70 backdrop-blur-2xl border-t border-ios-sep flex pb-[env(safe-area-inset-bottom)]"
      role="tablist"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors duration-150
              ${active ? "text-ios-blue" : "text-ios-gray"}`}
          >
            <Icon active={active} />
            <span className="text-ios-caption2 font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
