"use client"
import { useEffect, useState } from "react"
import { getTasks, updateTaskStatus, deleteTask } from "@/lib/store"
import { Task } from "@/lib/types"
import Link from "next/link"

const PRIORITY_COLOR = { must: "bg-red-900 text-red-300", nice: "bg-gray-800 text-gray-400" }
const PRIORITY_LABEL = { must: "🔴 Терміново", nice: "⚪ Nice to have" }

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === "inbox"))
  }, [])

  function moveToToday(id: string) {
    updateTaskStatus(id, "today")
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function remove(id: string) {
    deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (tasks.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <div className="text-6xl">📥</div>
      <h2 className="text-xl font-bold">Inbox порожній</h2>
      <p className="text-gray-400">Поверніться в Capture і виваліть все що в голові</p>
      <Link href="/capture" className="bg-blue-600 px-6 py-3 rounded-2xl font-semibold">
        ✏️ Capture
      </Link>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-2xl font-bold pt-4">Inbox 📥</h1>
      <p className="text-gray-400 text-sm">{tasks.length} задач — оберіть що на сьогодні</p>
      {tasks.map(t => (
        <div key={t.id} className="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3 border border-gray-800">
          <div className="flex items-start gap-2">
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 mt-0.5 ${PRIORITY_COLOR[t.priority]}`}>
              {PRIORITY_LABEL[t.priority]}
            </span>
          </div>
          <p className="font-medium text-base leading-snug">{t.title}</p>
          <div className="flex gap-2 text-sm text-gray-400">
            <span>⏱ {t.estimateMin} хв</span>
            {t.deadline && <span>📅 {t.deadline}</span>}
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => moveToToday(t.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              📌 На сьогодні
            </button>
            <button
              onClick={() => remove(t.id)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
