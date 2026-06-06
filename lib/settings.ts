const WORKDAY_KEY = "ai_planner_workday_min"
const DEFAULT_MIN = 480 // 8 hours

export function getWorkdayMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_MIN
  try {
    const raw = localStorage.getItem(WORKDAY_KEY)
    if (raw === null) return DEFAULT_MIN
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) || parsed <= 0 ? DEFAULT_MIN : parsed
  } catch {
    return DEFAULT_MIN
  }
}

export function setWorkdayMinutes(min: number): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORKDAY_KEY, String(min))
  } catch {
    // ignore quota errors
  }
}

export function getWorkdayHours(): number {
  return Math.round(getWorkdayMinutes() / 60)
}
