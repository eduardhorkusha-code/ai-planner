export type Priority = "must" | "nice"
export type Status = "inbox" | "today" | "done"

export type Task = {
  id: string
  title: string
  priority: Priority
  estimateMin: number
  deadline: string | null
  status: Status
}
