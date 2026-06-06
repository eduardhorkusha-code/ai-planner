"use client"
import { useState } from "react"
import { addTasks } from "@/lib/store"
import { Task } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function CapturePage() {
  const [dump, setDump] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleParse() {
    if (!dump.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Помилка")
      const tasks: Task[] = data.map((t: Omit<Task, "id" | "status">) => ({
        ...t,
        id: crypto.randomUUID(),
        status: "inbox" as const,
      }))
      addTasks(tasks)
      setDump("")
      router.push("/inbox")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 min-h-screen">
      <h1 className="text-2xl font-bold pt-4">Що в голові? 🧠</h1>
      <p className="text-gray-400 text-sm">Виваліть все підряд — AI розсортує</p>
      <textarea
        className="flex-1 min-h-48 bg-gray-900 rounded-2xl p-4 text-base resize-none
                   border border-gray-800 focus:border-blue-500 outline-none
                   placeholder-gray-600"
        placeholder="НаписатиАні, зателефонувати клієнту, доробити презу до п'ятниці, купити молоко..."
        value={dump}
        onChange={e => setDump(e.target.value)}
        autoFocus
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleParse}
        disabled={loading || !dump.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500
                   text-white font-semibold py-4 rounded-2xl text-lg transition-colors"
      >
        {loading ? "⏳ Аналізую..." : "✨ Розібрати з AI"}
      </button>
    </div>
  )
}
