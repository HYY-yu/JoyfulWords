import { NextRequest, NextResponse } from "next/server"
import { getMindMap, upsertMindMap } from "@/app/api/article/mindmap/store"
import type { MindMapDocument, SaveMindMapRequest } from "@/lib/api/articles/types"

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const articleId = Number(id)

    if (!articleId) {
      return NextResponse.json({ error: "MINDMAP_INVALID_ARTICLE_ID" }, { status: 400 })
    }

    const existing = getMindMap(articleId)
    if (!existing) {
      return NextResponse.json({ error: "MINDMAP_NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json({ data: { mindmap: existing } })
  } catch (error) {
    console.error("[MindMap Mock] Load failed", error)
    return NextResponse.json({ error: "MINDMAP_LOAD_FAILED" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const articleId = Number(id)

    if (!articleId) {
      return NextResponse.json({ error: "MINDMAP_INVALID_ARTICLE_ID" }, { status: 400 })
    }

    const body = (await request.json()) as SaveMindMapRequest
    const incoming = body?.mindmap

    if (!incoming || incoming.article_id !== articleId) {
      return NextResponse.json({ error: "MINDMAP_SAVE_INVALID_PAYLOAD" }, { status: 400 })
    }

    const existing = getMindMap(articleId)
    if (existing && existing.revision !== incoming.revision) {
      return NextResponse.json({ error: "MINDMAP_REVISION_CONFLICT" }, { status: 409 })
    }

    const now = new Date().toISOString()
    const next: MindMapDocument = {
      ...incoming,
      article_id: articleId,
      revision: existing ? existing.revision + 1 : 1,
      created_at: existing?.created_at || incoming.created_at || now,
      updated_at: now,
    }

    // TODO(observability): add trace span for mindmap.save
    // TODO(metrics): record mindmap_save_latency_ms and conflict rate.
    console.info("[MindMap Mock] Saved", {
      articleId,
      revision: next.revision,
    })

    upsertMindMap(articleId, next)

    return NextResponse.json({
      data: {
        mindmap: next,
      },
    })
  } catch (error) {
    console.error("[MindMap Mock] Save failed", error)
    return NextResponse.json({ error: "MINDMAP_SAVE_FAILED" }, { status: 500 })
  }
}
