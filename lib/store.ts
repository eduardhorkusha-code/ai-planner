import { Task, Status } from "./types"

const KEY = "ai_planner_tasks"

export function getTasks(): Task[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function addTasks(newTasks: Task[]): void {
  saveTasks([...getTasks(), ...newTasks])
}

export function updateTaskStatus(id: string, status: Status): void {
  saveTasks(getTasks().map(t => t.id === id ? { ...t, status } : t))
}

export function deleteTask(id: string): void {
  saveTasks(getTasks().filter(t => t.id !== id))
}

export function updateTask(id: string, patch: Partial<Task>): void {
  saveTasks(getTasks().map(t => t.id === id ? { ...t, ...patch } : t))
}
