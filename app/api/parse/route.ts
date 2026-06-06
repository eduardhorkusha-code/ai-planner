import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

interface RawTask {
  title?: unknown
  priority?: unknown
  estimateMin?: unknown
  deadline?: unknown
  [key: string]: unknown
}

function normalizeToArray(parsed: unknown): RawTask[] {
  if (Array.isArray(parsed)) return parsed as RawTask[]
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>
    const candidate = Object.values(obj).find(v => Array.isArray(v))
    if (candidate) return candidate as RawTask[]
  }
  return []
}

function validateTask(
  raw: RawTask
): { title: string; priority: "must" | "nice"; estimateMin: number; deadline: string | null } | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  if (!title) return null

  const priority: "must" | "nice" =
    raw.priority === "must" || raw.priority === "nice" ? raw.priority : "nice"

  const estimateRaw = Number(raw.estimateMin)
  const estimateMin = isNaN(estimateRaw) || estimateRaw <= 0 ? 30 : estimateRaw

  const deadlineStr = typeof raw.deadline === "string" ? raw.deadline : null
  const deadline =
    deadlineStr && /^\d{4}-\d{2}-\d{2}$/.test(deadlineStr) ? deadlineStr : null

  return { title, priority, estimateMin, deadline }
}

export async function POST(req: NextRequest) {
  try {
    const { dump } = await req.json()
    if (!dump?.trim()) return NextResponse.json([])

    // Replace U+2028/U+2029 (line/paragraph separators) with newline
    const safeDump = String(dump)
      .replace(/\u2028/g, "\n")
      .replace(/\u2029/g, "\n")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")

    const apiKey = (process.env.ANTHROPIC_API_KEY ?? "").replace(/[^\x21-\x7E]/g, "")
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })
    const today = new Date().toISOString().split("T")[0]

    const prompt =
      "Ти — асистент-планувальник. Розбий хаотичний текст на окремі задачі.\n" +
      "Для кожної визнач :\n" +
      "- title: коротке формулювання\n" +
      '- priority: "must" якщо терміново/важливо, інакше "nice"\n' +
      "- estimateMin: реалістична оцінка в хвилинах (число)\n" +
      "- deadline: дата YYYY-MM-DD якщо є час/день у тексті, інакше null\n\n" +
      `Сьогодні: ${today}.\n` +
      "Поверни ТІЛЬКИ валідний JSON-масив без будь-яких пояснень і без markdown.\n\n" +
      `Текст:\n"""\n${safeDump}\n"""`

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
    const parsed = JSON.parse(clean)

    const rawArr = normalizeToArray(parsed)
    const tasks = rawArr.map(validateTask).filter((t): t is NonNullable<typeof t> => t !== null)

    return NextResponse.json(tasks)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
