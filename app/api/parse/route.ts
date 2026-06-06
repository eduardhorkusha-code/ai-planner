import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { dump } = await req.json()
    if (!dump?.trim()) return NextResponse.json([])

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })
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
- estimateMin: реалістична оцінка в хвилинах (число)
- deadline: дата YYYY-MM-DD якщо є час/день у тексті, інакше null

Сьогодні: ${today}.
Поверни ТІЛЬКИ валідний JSON-масив без будь-яких пояснень і без markdown.

Текст:
"""
${dump}
"""`,
        },
      ],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
    const tasks = JSON.parse(clean)
    return NextResponse.json(tasks)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
