import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_MODELS: Record<string, string> = {
  "claude-haiku-4-5": "claude-haiku-4-5",
  "claude-sonnet-4-6": "claude-sonnet-4-6",
}
const DEFAULT_MODEL = "claude-haiku-4-5"

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
    const body = await req.json()
    const { dump, model: rawModel } = body as { dump?: unknown; model?: unknown }
    if (!dump || typeof dump !== "string" || !dump.trim()) return NextResponse.json([])

    // Allowlist model — fall back to haiku if unknown
    const model: string = typeof rawModel === "string" && ALLOWED_MODELS[rawModel]
      ? ALLOWED_MODELS[rawModel]
      : DEFAULT_MODEL

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
      "\u0422\u0438 \u2014 \u0430\u0441\u0438\u0441\u0442\u0435\u043d\u0442-\u043f\u043b\u0430\u043d\u0443\u0432\u0430\u043b\u044c\u043d\u0438\u043a. \u0420\u043e\u0437\u0431\u0438\u0439 \u0445\u0430\u043e\u0442\u0438\u0447\u043d\u0438\u0439 \u0442\u0435\u043a\u0441\u0442 \u043d\u0430 \u043e\u043a\u0440\u0435\u043c\u0456 \u0437\u0430\u0434\u0430\u0447\u0456.\n" +
      "\u0414\u043b\u044f \u043a\u043e\u0436\u043d\u043e\u0457 \u0432\u0438\u0437\u043d\u0430\u0447 :\n" +
      "- title: \u043a\u043e\u0440\u043e\u0442\u043a\u0435 \u0444\u043e\u0440\u043c\u0443\u043b\u044e\u0432\u0430\u043d\u043d\u044f\n" +
      '- priority: "must" \u044f\u043a\u0449\u043e \u0442\u0435\u0440\u043c\u0456\u043d\u043e\u0432\u043e/\u0432\u0430\u0436\u043b\u0438\u0432\u043e, \u0456\u043d\u0430\u043a\u0448\u0435 "nice"\n' +
      "- estimateMin: \u0440\u0435\u0430\u043b\u0456\u0441\u0442\u0438\u0447\u043d\u0430 \u043e\u0446\u0456\u043d\u043a\u0430 \u0432 \u0445\u0432\u0438\u043b\u0438\u043d\u0430\u0445 (\u0447\u0438\u0441\u043b\u043e)\n" +
      "- deadline: \u0434\u0430\u0442\u0430 YYYY-MM-DD \u044f\u043a\u0449\u043e \u0454 \u0447\u0430\u0441/\u0434\u0435\u043d\u044c \u0443 \u0442\u0435\u043a\u0441\u0442\u0456, \u0456\u043d\u0430\u043a\u0448\u0435 null\n\n" +
      `\u0421\u044c\u043e\u0433\u043e\u0434\u043d\u0456: ${today}.\n` +
      "\u041f\u043e\u0432\u0435\u0440\u043d\u0438 \u0422\u0406\u041b\u042c\u041a\u0418 \u0432\u0430\u043b\u0456\u0434\u043d\u0438\u0439 JSON-\u043c\u0430\u0441\u0438\u0432 \u0431\u0435\u0437 \u0431\u0443\u0434\u044c-\u044f\u043a\u0438\u0445 \u043f\u043e\u044f\u0441\u043d\u0435\u043d\u044c \u0456 \u0431\u0435\u0437 markdown.\n\n" +
      `\u0422\u0435\u043a\u0441\u0442:\n"""\n${safeDump}\n"""`

    const message = await client.messages.create({
      model,
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
