"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MaterialClueEdge, MaterialClueNode, Point } from "./types"
import {
  NODE_FOOTPRINT,
  placeTargetNode,
  screenToCanvas,
  type OccupiedRect,
} from "./geometry"
import { expandMaterialClue } from "./mock-adapter"
import { EdgeLayer } from "./edge-layer"
import { NodeCard } from "./node-card"
import { buildClueLinkId } from "./markdown-view"
import { materialsClient } from "@/lib/api/materials/client"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"

const uid = () => Math.random().toString(36).slice(2, 10)

interface MaterialClueCanvasProps {
  rootQuery: string
  resetToken: number
  articleId?: number | null
  onMaterialAdded?: () => void
}

function buildNodeMaterialContent(node: MaterialClueNode) {
  const markdown = node.markdown.trim()
  const imageMarkdown = (node.images ?? [])
    .map((imageUrl, index) => `![${node.query} image ${index + 1}](${imageUrl})`)
    .join("\n\n")

  return [markdown, imageMarkdown].filter(Boolean).join("\n\n")
}

function buildNodeMaterialTitle(query: string) {
  const title = query.trim()
  return title.length > 200 ? title.slice(0, 200) : title
}

function buildOccupiedRects(nodes: MaterialClueNode[], edges: MaterialClueEdge[], scale: number): OccupiedRect[] {
  const nodeRects = nodes.map((node) => {
    const element =
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>(`[data-node-id="${node.id}"]`)
    const rect = element?.getBoundingClientRect()

    return {
      center: { x: node.x, y: node.y },
      width: rect ? Math.max(rect.width / scale, NODE_FOOTPRINT.width) : NODE_FOOTPRINT.width,
      height: rect ? Math.max(rect.height / scale, NODE_FOOTPRINT.height) : NODE_FOOTPRINT.height,
    }
  })

  const reservedLoadingRects = edges
    .filter((edge) => edge.state === "loading")
    .map((edge) => ({
      center: edge.to,
      width: NODE_FOOTPRINT.width,
      height: NODE_FOOTPRINT.height,
    }))

  return [...nodeRects, ...reservedLoadingRects]
}

function resolveNodeExitPoint(
  source: MaterialClueNode,
  target: Point,
  nodeEl: HTMLElement | null,
  scale: number
): Point {
  const rect = nodeEl?.getBoundingClientRect()
  const halfW = rect ? rect.width / scale / 2 : 150
  const halfH = rect ? rect.height / scale / 2 : 120
  const dx = target.x - source.x
  const dy = target.y - source.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (absDx < 0.001 && absDy < 0.001) {
    return { x: source.x + halfW, y: source.y }
  }

  const tx = absDx > 0.001 ? halfW / absDx : Number.POSITIVE_INFINITY
  const ty = absDy > 0.001 ? halfH / absDy : Number.POSITIVE_INFINITY
  const t = Math.min(tx, ty)
  const overshoot = 8
  const len = Math.hypot(dx, dy) || 1

  return {
    x: source.x + dx * t + (dx / len) * overshoot,
    y: source.y + dy * t + (dy / len) * overshoot,
  }
}

export function MaterialClueCanvas({
  rootQuery,
  resetToken,
  articleId,
  onMaterialAdded,
}: MaterialClueCanvasProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [viewport, setViewport] = useState({ w: 960, h: 640 })
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [panning, setPanning] = useState(false)
  const [nodes, setNodes] = useState<MaterialClueNode[]>([])
  const [edges, setEdges] = useState<MaterialClueEdge[]>([])
  const [linkStates, setLinkStates] = useState<Record<string, "loading" | "expanded">>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const panState = useRef({ dragging: false, sx: 0, sy: 0, px: 0, py: 0 })
  const rootRequestSeqRef = useRef(0)
  const loadedRootKeyRef = useRef("")

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      setViewport({ w: rect.width || 960, h: rect.height || 640 })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const loadRoot = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    const requestSeq = rootRequestSeqRef.current + 1
    rootRequestSeqRef.current = requestSeq
    const rect = containerRef.current?.getBoundingClientRect()
    const center = screenToCanvas({
      x: (rect?.width || viewport.w) / 2,
      y: (rect?.height || viewport.h) / 2,
    }, { x: 0, y: 0 }, 1)
    const rootNode: MaterialClueNode = {
      id: "root",
      query: trimmed,
      x: center.x,
      y: center.y,
      markdown: "",
      status: "loading",
      isRoot: true,
    }

    console.info("[MaterialClueBoard] root search started", { query: trimmed })
    setPan({ x: 0, y: 0 })
    setScale(1)
    setNodes([rootNode])
    setEdges([])
    setLinkStates({})

    try {
      const response = await expandMaterialClue(trimmed)
      if (rootRequestSeqRef.current !== requestSeq) {
        console.debug("[MaterialClueBoard] ignoring stale root response", { query: trimmed })
        return
      }
      setNodes([{
        ...rootNode,
        query: response.query,
        markdown: response.markdown,
        images: response.images,
        status: "ready",
      }])
      console.info("[MaterialClueBoard] root search finished", { query: response.query })
    } catch (error) {
      console.warn("[MaterialClueBoard] root search failed", { query: trimmed, error })
      setNodes([{
        ...rootNode,
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to expand query",
      }])
    }
  }, [viewport.h, viewport.w])

  useEffect(() => {
    const trimmed = rootQuery.trim()
    const rootKey = `${resetToken}:${trimmed}`
    if (!trimmed || loadedRootKeyRef.current === rootKey) return
    loadedRootKeyRef.current = rootKey
    void loadRoot(rootQuery)
  }, [loadRoot, resetToken, rootQuery])

  const onCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return
    panState.current = {
      dragging: true,
      sx: event.clientX,
      sy: event.clientY,
      px: pan.x,
      py: pan.y,
    }
    setPanning(true)
  }, [pan.x, pan.y])

  const onCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    const state = panState.current
    if (!state.dragging) return
    setPan({ x: state.px + (event.clientX - state.sx), y: state.py + (event.clientY - state.sy) })
  }, [])

  const endPan = useCallback(() => {
    panState.current.dragging = false
    setPanning(false)
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const handler = (event: WheelEvent) => {
      event.preventDefault()
      const delta = -event.deltaY * 0.0015
      const next = Math.min(2.5, Math.max(0.3, scale * (1 + delta)))
      const rect = element.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top
      const worldBefore = screenToCanvas({ x: mx, y: my }, pan, scale)
      setPan({
        x: mx - worldBefore.x * next,
        y: my - worldBefore.y * next,
      })
      setScale(next)
    }

    element.addEventListener("wheel", handler, { passive: false })
    return () => element.removeEventListener("wheel", handler)
  }, [pan, scale])

  const onDragNode = useCallback((nodeId: string, dx: number, dy: number) => {
    setNodes((prev) =>
      prev.map((node) => node.id === nodeId ? { ...node, x: node.x + dx, y: node.y + dy } : node)
    )
    setEdges((prev) =>
      prev.map((edge) => {
        if (edge.fromNodeId === nodeId) {
          return { ...edge, from: { x: edge.from.x + dx, y: edge.from.y + dy } }
        }
        if (edge.toNodeId === nodeId) {
          return { ...edge, to: { x: edge.to.x + dx, y: edge.to.y + dy } }
        }
        return edge
      })
    )
  }, [])

  const expandFromNode = useCallback(
    async (sourceNode: MaterialClueNode, targetQuery: string, anchorEl: HTMLElement, linkId: string) => {
      const trimmed = targetQuery.trim()
      if (!trimmed || sourceNode.status !== "ready") return

      if (linkStates[linkId] === "loading" || linkStates[linkId] === "expanded") {
        console.debug("[MaterialClueBoard] duplicate clue click ignored", {
          sourceNodeId: sourceNode.id,
          query: trimmed,
        })
        return
      }

      const containerEl = containerRef.current
      if (!containerEl) return

      const anchorRect = anchorEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const anchorWorld = screenToCanvas({
        x: anchorRect.left + anchorRect.width / 2 - containerRect.left,
        y: anchorRect.top + anchorRect.height / 2 - containerRect.top,
      }, pan, scale)

      const targetWorld = placeTargetNode(
        { x: sourceNode.x, y: sourceNode.y },
        anchorWorld,
        buildOccupiedRects(nodes, edges, scale)
      )
      const sourceExitWorld = resolveNodeExitPoint(
        sourceNode,
        targetWorld,
        anchorEl.closest<HTMLElement>("[data-node-id]"),
        scale
      )

      console.debug("[MaterialClueBoard] clue geometry resolved", {
        sourceNodeId: sourceNode.id,
        query: trimmed,
        sourceExitWorld,
        targetWorld,
      })

      setLinkStates((prev) => ({ ...prev, [linkId]: "loading" }))

      const edgeId = uid()
      const tempEdge: MaterialClueEdge = {
        id: edgeId,
        fromNodeId: sourceNode.id,
        linkId,
        toNodeId: null,
        state: "loading",
        from: sourceExitWorld,
        to: targetWorld,
      }
      setEdges((prev) => [...prev, tempEdge])
      console.info("[MaterialClueBoard] clue expand started", { sourceNodeId: sourceNode.id, query: trimmed })

      try {
        const response = await expandMaterialClue(trimmed)
        const newNodeId = uid()
        const newNode: MaterialClueNode = {
          id: newNodeId,
          query: response.query,
          x: targetWorld.x,
          y: targetWorld.y,
          markdown: response.markdown,
          images: response.images,
          status: "ready",
        }

        setNodes((prev) => [...prev, newNode])
        setEdges((prev) =>
          prev.map((edge) =>
            edge.id === edgeId
              ? { ...edge, toNodeId: newNodeId, state: "settled" }
              : edge
          )
        )
        setLinkStates((prev) => ({ ...prev, [linkId]: "expanded" }))
        console.info("[MaterialClueBoard] clue expand finished", { query: response.query, nodeId: newNodeId })
      } catch (error) {
        console.warn("[MaterialClueBoard] clue expand failed", { sourceNodeId: sourceNode.id, query: trimmed, error })
        setEdges((prev) => prev.filter((edge) => edge.id !== edgeId))
        setLinkStates((prev) => {
          const next = { ...prev }
          delete next[linkId]
          return next
        })
      }
    },
    [edges, linkStates, nodes, pan, scale]
  )

  const handleClueClick = useCallback(
    async (sourceNode: MaterialClueNode, targetQuery: string, _label: string, anchorEl: HTMLElement) => {
      await expandFromNode(sourceNode, targetQuery, anchorEl, buildClueLinkId(sourceNode.id, targetQuery))
    },
    [expandFromNode]
  )

  const handleFollowUp = useCallback(
    async (sourceNode: MaterialClueNode, targetQuery: string, anchorEl: HTMLElement) => {
      await expandFromNode(sourceNode, targetQuery, anchorEl, `${sourceNode.id}->followup:${targetQuery.trim().toLowerCase()}`)
    },
    [expandFromNode]
  )

  const handleAddNodeToMaterial = useCallback(async (node: MaterialClueNode) => {
    if (!articleId) {
      console.warn("[MaterialClueBoard] add to material skipped without article id", { nodeId: node.id })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.clueBoardAddMaterialFailed"),
      })
      throw new Error("article id is required")
    }

    const content = buildNodeMaterialContent(node)
    if (node.status !== "ready" || !content.trim()) {
      console.warn("[MaterialClueBoard] add to material skipped for non-ready node", {
        nodeId: node.id,
        status: node.status,
      })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.clueBoardAddMaterialFailed"),
      })
      throw new Error("node is not ready")
    }

    console.info("[MaterialClueBoard] adding node to materials", {
      articleId,
      nodeId: node.id,
      query: node.query,
    })

    const result = await materialsClient.createMaterial({
      title: buildNodeMaterialTitle(node.query),
      material_type: "info",
      content,
      article_id: articleId,
    })

    if ("error" in result) {
      console.warn("[MaterialClueBoard] add to material failed", {
        articleId,
        nodeId: node.id,
        query: node.query,
        error: result.error,
      })
      toast({
        variant: "destructive",
        title: t("contentWriting.materialPanel.clueBoardAddMaterialFailed"),
        description: result.error,
      })
      throw new Error(result.error)
    }

    console.info("[MaterialClueBoard] node added to materials", {
      articleId,
      nodeId: node.id,
      materialId: result.id,
    })
    onMaterialAdded?.()
  }, [articleId, onMaterialAdded, t, toast])

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--jw-accent)_12%,transparent),transparent_26%),linear-gradient(135deg,hsl(var(--background)),color-mix(in_srgb,hsl(var(--background))_78%,#111827))]",
        panning ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={endPan}
      onMouseLeave={endPan}
    >
      <EdgeLayer edges={edges} pan={pan} scale={scale} />
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            scale={scale}
            linkStates={linkStates}
            onDragNode={onDragNode}
            onClueClick={handleClueClick}
            onFollowUp={handleFollowUp}
            onAddToMaterial={handleAddNodeToMaterial}
            canAddToMaterial={Boolean(articleId)}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
        <span>{Math.round(scale * 100)}%</span>
        <span className="mx-2 text-border">/</span>
        <span>{nodes.length} nodes</span>
      </div>
    </div>
  )
}
