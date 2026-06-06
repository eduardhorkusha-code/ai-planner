import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { dump } = await req.json()
  if (!dump?.trim()) return NextResponse.json([])

  const today = new Date().toISOString().split("T")[0]

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Ти — асистент-планувальник. Розбий хаотичний текст на окремі задачі.
Для кожної визнач:
- title: коротке формулювання
- priority: "must" якщо терміново/важливо, інакше "nice"
- estimateMin: реалістична оцінка в хвилинах
- deadline: дата YYYY-MM-DD якщо є час/день у тексті, інакше null

Сьогодні: ${today}.
Поверни ТІЛЬКИ валідний JSON-масив. Без пояснень, без markdown.

Текст:
"""
${dump}
"""`,
      },
    ],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")

  try {
    const tasks = JSON.parse(clean)
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: "parse failed", raw }, { status: 500 })
  }
}
