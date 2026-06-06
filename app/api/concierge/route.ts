import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

interface TaskInput {
  title: string
  priority: "must" | "nice"
  estimateMin: number
  deadline: string | null
  status: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tasks } = body as { tasks?: unknown }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "tasks array required" }, { status: 400 })
    }

    const apiKey = (process.env.ANTHROPIC_API_KEY ?? "").replace(/[^\x21-\x7E]/g, "")
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 })
    }

    // Sanitize a single task field — replace U+2028/U+2029 with space
    function sanitizeStr(s: unknown): string {
      if (typeof s !== "string") return ""
      return s
        .replace(/\u2028/g, " ")
        .replace(/\u2029/g, " ")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
        .trim()
    }

    // Build a human-readable task list for the prompt
    const validTasks = (tasks as TaskInput[]).filter(
      (t) => t && typeof t.title === "string" && t.title.trim()
    )
    const taskLines = validTasks
      .map((t, i) => {
        const title = sanitizeStr(t.title)
        const priority = t.priority === "must" ? "must" : "nice"
        const estimate = typeof t.estimateMin === "number" && t.estimateMin > 0
          ? `${t.estimateMin} хв`
          : ""
        const deadline = typeof t.deadline === "string" && t.deadline
          ? `до ${sanitizeStr(t.deadline)}`
          : ""
        const status = sanitizeStr(t.status)
        const meta = [priority, estimate, deadline, status].filter(Boolean).join(", ")
        return `${i + 1}. ${title}${meta ? ` (${meta})` : ""}`
      })
      .join("\n")

    const prompt =
      "Ти — AI-консьєрж планувальника. Ось задачі:\n" +
      taskLines +
      "\n\nДай КОРОТКО (українською, ~120 слів):\n" +
      "1) Самарі дня 1-2 реченнями.\n" +
      "2) ТОП-3 що зробити першим і чому (must + дедлайни + час).\n" +
      "3) Якщо сума estimateMin задач зі статусом \'today\' перевищує 480 хв — попередь що нереалістично і що краще перенести.\n" +
      "Без markdown-заголовків, дружньо."

    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const text = (message.content[0] as { text: string }).text.trim()
    return NextResponse.json({ text })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
