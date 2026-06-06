"use client"
import { useEffect, useState } from "react"
import { getTasks, updateTaskStatus } from "@/lib/store"
import { Task } from "@/lib/types"
import Link from "next/link"

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === "today" || t.status === "done").sort((a, b) => {
      if (a.priority === "must" && b.priority !== "must") return -1
      if (b.priority === "must" && a.priority !== "must") return 1
      return 0
    }))
  }, [])

  function toggle(t: Task) {
    const next = t.status === "done" ? "today" : "done"
    updateTaskStatus(t.id, next)
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
  }

  const done = tasks.filter(t => t.status === "done").length
  const total = tasks.length
  const totalMin = tasks.filter(t => t.status === "today").reduce((s, t) => s + t.estimateMin, 0)
  const hoursLeft = Math.floor(totalMin / 60)
  const minsLeft = totalMin % 60

  // P2-2: all done celebration
  const allDone = done === total && total > 0

  if (tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <div className="text-6xl">✅</div>
      <h2 className="text-xl font-bold">План на сьогодні порожній</h2>
      <p className="text-gray-400">Перейдіть в Inbox і оберіть задачі на сьогодні</p>
      <Link href="/inbox" className="bg-blue-600 px-6 py-3 rounded-2xl font-semibold">
        📥 Inbox
      </Link>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-bold pt-4">Сьогодні ✅</h1>
      <p className="text-gray-400 text-sm">{done}/{total} виконано</p>
      {/* P2-2: progress bar — green when all done, thicker */}
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-1">
        <div
          className={`h-2.5 rounded-full transition-all ${allDone ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
        />
      </div>
      {/* P2-2: celebration row */}
      {allDone && (
        <p className="text-green-400 text-sm font-medium">🎉 Все зроблено!</p>
      )}
      {totalMin > 0 && (
        <p className="text-gray-400 text-sm">
          ⏱ ~{hoursLeft > 0 ? `${hoursLeft}год ` : ""}{minsLeft}хв задач залишилось
        </p>
      )}
      {/* P1-4: realistic warning with actual hours number */}
      {totalMin > 480 && (
        <p className="text-red-400 text-sm">⚠️ ~{Math.round(totalMin / 60)}год запланованих задач — це більше за робочий день (8 год)</p>
      )}
      {tasks.map(t => (
        <button
          key={t.id}
          onClick={() => toggle(t)}
          className={`w-full flex items-center gap-3 bg-gray-900 rounded-2xl p-4 border text-left transition-all
            ${t.status === "done" ? "border-green-900 opacity-60" : "border-gray-800"}`}
        >
          {/* P0: larger checkbox w-7 h-7 + active:scale-95 */}
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors active:scale-95
            ${t.status === "done" ? "bg-green-500 border-green-500" : "border-gray-600"}`}>
            {t.status === "done" && <span className="text-xs">✓</span>}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${t.status === "done" ? "line-through text-gray-500" : ""}`}>
              {t.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              ⏱ {t.estimateMin} хв {t.priority === "must" ? "· 🔴 Терміново" : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
