import { NextRequest, NextResponse } from "next/server"
import type { GenerateMindMapRequest, MindMapDocument, MindMapNode } from "@/lib/api/articles/types"

const BRANCH_COLORS = [
  "#2F6FED",
  "#0F9D7A",
  "#E87B2A",
  "#B94CCF",
  "#D64550",
  "#1481BA",
]

function sentenceChunks(input: string): string[] {
  return input
    .split(/[\n。！？!?；;]+/g)
    .map((line) => line.trim())
    .filter(Boolean)
}

function paragraphChunks(input: string): string[] {
  return input
    .split(/\n{2,}/g)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function truncate(text: string, max = 24): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function buildSubNodes(source: string): MindMapNode[] {
  return sentenceChunks(source)
    .slice(1, 4)
    .map((chunk) => ({
      id: crypto.randomUUID(),
      text: truncate(chunk, 22),
      children: [],
    }))
}

function buildChildren(seedText: string): MindMapNode[] {
  const paragraphs = paragraphChunks(seedText).slice(0, 6)

  if (paragraphs.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        text: "核心主题",
        meta: { side: "right", color: BRANCH_COLORS[0] },
        children: [
          { id: crypto.randomUUID(), text: "背景", children: [] },
          { id: crypto.randomUUID(), text: "关键观点", children: [] },
        ],
      },
      {
        id: crypto.randomUUID(),
        text: "执行建议",
        meta: { side: "left", color: BRANCH_COLORS[1] },
        children: [
          { id: crypto.randomUUID(), text: "优先事项", children: [] },
          { id: crypto.randomUUID(), text: "下一步", children: [] },
        ],
      },
    ]
  }

  return paragraphs.map((paragraph, index) => {
    const sentences = sentenceChunks(paragraph)
    const topic = sentences[0] || paragraph

    return {
      id: crypto.randomUUID(),
      text: truncate(topic, 20),
      meta: {
        side: index % 2 === 0 ? "right" : "left",
        color: BRANCH_COLORS[index % BRANCH_COLORS.length],
        note: paragraph,
      },
      children: buildSubNodes(paragraph),
    }
  })
}

function buildMindMapDoc(request: GenerateMindMapRequest): MindMapDocument {
  const sourceText = request.article_text.trim()
  const now = new Date().toISOString()

  const root: MindMapNode = {
    id: crypto.randomUUID(),
    text: truncate(sourceText.split(/\n+/)[0] || "文章主题", 22),
    children: buildChildren(sourceText),
  }

  return {
    article_id: request.article_id,
    title: "AI 思维导图",
    root,
    source: {
      mode: "full_article",
      text_snapshot: sourceText,
      generated_at: now,
    },
    revision: 0,
    created_at: now,
    updated_at: now,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateMindMapRequest

    if (!body.article_id || !body.article_text?.trim()) {
      return NextResponse.json(
        { error: "MINDMAP_GENERATE_INVALID_PARAMS" },
        { status: 400 }
      )
    }

    // TODO(observability): add trace span for mindmap.generate
    // TODO(metrics): record mindmap_generate_latency_ms and success/failure counters.
    console.info("[MindMap Mock] Generate requested", {
      articleId: body.article_id,
      articleLength: body.article_text?.length || 0,
    })

    // 模拟异步处理时延
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const mindMap = buildMindMapDoc(body)

    return NextResponse.json({
      data: {
        mindmap: mindMap,
      },
    })
  } catch (error) {
    console.error("[MindMap Mock] Generate failed", error)
    return NextResponse.json({ error: "MINDMAP_GENERATE_FAILED" }, { status: 500 })
  }
}
