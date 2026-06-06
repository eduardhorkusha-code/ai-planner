"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { href: "/capture", label: "Capture", icon: "✏️" },
  { href: "/inbox",   label: "Inbox",   icon: "📥" },
  { href: "/today",   label: "Today",   icon: "✅" },
]

export default function TabBar() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-900 border-t border-gray-800 flex">
      {tabs.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors
            ${path.startsWith(t.href) ? "text-blue-400" : "text-gray-500"}`}
        >
          <span className="text-2xl">{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
