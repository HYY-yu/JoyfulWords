"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "motion/react"
import { AlertTriangle, Check, Inbox, Loader2, Search, Send, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/base/tooltip"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import type { MaterialClueNode } from "./types"
import { MarkdownView } from "./markdown-view"

interface NodeCardProps {
  node: MaterialClueNode
  linkStates: Record<string, "loading" | "expanded">
  scale: number
  onDragNode: (nodeId: string, dx: number, dy: number) => void
  onClueClick: (node: MaterialClueNode, targetQuery: string, label: string, anchorEl: HTMLElement) => void
  onFollowUp: (node: MaterialClueNode, targetQuery: string, anchorEl: HTMLElement) => Promise<void> | void
  onAddToMaterial: (node: MaterialClueNode) => Promise<void> | void
  canAddToMaterial?: boolean
}

export function NodeCard({
  node,
  linkStates,
  scale,
  onDragNode,
  onClueClick,
  onFollowUp,
  onAddToMaterial,
  canAddToMaterial = true,
}: NodeCardProps) {
  const { t } = useTranslation()
  const dragState = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
  })
  const [grabbing, setGrabbing] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpText, setFollowUpText] = useState("")
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addedToMaterial, setAddedToMaterial] = useState(false)
  const followUpAnchorRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('[data-clue-link="1"]')) {
      event.stopPropagation()
      return
    }

    dragState.current = {
      dragging: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
    }
    setGrabbing(true)
    event.stopPropagation()
  }, [])

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const state = dragState.current
      if (!state.dragging) return

      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) state.moved = true
      if (!state.moved) return

      onDragNode(node.id, dx / scale, dy / scale)
      state.startX = event.clientX
      state.startY = event.clientY
    },
    [node.id, onDragNode, scale]
  )

  const endDrag = useCallback(() => {
    dragState.current.dragging = false
    setGrabbing(false)
  }, [])

  const images = node.images ?? []
  const canFollowUp = node.status === "ready"
  const canAddNodeToMaterial = node.status === "ready" && canAddToMaterial

  const handleFollowUpSubmit = useCallback(async () => {
    const trimmed = followUpText.trim()
    const anchorEl = followUpAnchorRef.current
    if (!trimmed || !anchorEl || followUpSubmitting || !canFollowUp) return

    setFollowUpSubmitting(true)
    try {
      await onFollowUp(node, trimmed, anchorEl)
      setFollowUpText("")
      setFollowUpOpen(false)
    } finally {
      setFollowUpSubmitting(false)
    }
  }, [canFollowUp, followUpSubmitting, followUpText, node, onFollowUp])

  const handleAddToMaterial = useCallback(async () => {
    if (!canAddNodeToMaterial || addSubmitting || addedToMaterial) return

    setAddSubmitting(true)
    try {
      await onAddToMaterial(node)
      setAddedToMaterial(true)
    } catch {
      setAddedToMaterial(false)
    } finally {
      setAddSubmitting(false)
    }
  }, [addSubmitting, addedToMaterial, canAddNodeToMaterial, node, onAddToMaterial])

  return (
    <>
      <motion.div
        className="absolute select-none"
        data-node-id={node.id}
        style={{
          left: node.x,
          top: node.y,
          x: "-50%",
          y: "-50%",
        }}
        initial={{ scale: 0.08, opacity: 0, filter: "blur(8px)" }}
        animate={{
          scale: [0.08, 1.1, 0.97, 1],
          opacity: [0, 1, 1, 1],
          filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        }}
        transition={{
          duration: 0.62,
          times: [0, 0.58, 0.82, 1],
          ease: [0.18, 0.9, 0.2, 1],
        }}
      >
        <div
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          className="w-[320px] rounded-2xl border border-border/80 bg-background/95 px-4 py-3 shadow-[0_24px_58px_-38px_rgba(0,0,0,0.55)] backdrop-blur"
          style={{ cursor: grabbing ? "grabbing" : "grab" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_var(--jw-accent)]" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {node.isRoot ? "Origin" : "Clue"}
            </p>
            {node.status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
            {node.status === "failed" ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : null}
          </div>

          {node.status === "loading" ? (
            <div className="space-y-2 py-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
            </div>
          ) : node.status === "failed" ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {node.error}
            </div>
          ) : (
            <>
              <MarkdownView
                markdown={node.markdown}
                nodeId={node.id}
                linkStates={linkStates}
                onClueClick={(targetQuery, label, anchorEl) =>
                  onClueClick(node, targetQuery, label, anchorEl)
                }
              />
              {images.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
                  {images.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      className="group overflow-hidden rounded-lg border border-border bg-muted/30"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setPreviewImageUrl(imageUrl)
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`${node.query} image ${index + 1}`}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        {canFollowUp ? (
          <div
            ref={followUpAnchorRef}
            className="absolute -right-12 bottom-5 z-20 flex flex-col items-center gap-2"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-full border-border bg-background/95 text-primary shadow-[0_16px_42px_-22px_rgba(0,0,0,0.7)] backdrop-blur hover:bg-primary hover:text-primary-foreground disabled:opacity-100",
                    addedToMaterial && "border-emerald-500/70 bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white"
                  )}
                  onClick={() => void handleAddToMaterial()}
                  disabled={!canAddNodeToMaterial || addSubmitting || addedToMaterial}
                  aria-label={t("contentWriting.materialPanel.clueBoardAddToMaterial")}
                >
                  {addSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : addedToMaterial ? (
                    <motion.span
                      initial={{ scale: 0.2, rotate: -28, opacity: 0 }}
                      animate={{ scale: [0.2, 1.24, 1], rotate: [-28, 8, 0], opacity: 1 }}
                      transition={{ duration: 0.42, ease: [0.18, 0.9, 0.2, 1] }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <Inbox className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {addedToMaterial
                  ? t("contentWriting.materialPanel.clueBoardAddedToMaterial")
                  : t("contentWriting.materialPanel.clueBoardAddToMaterial")}
              </TooltipContent>
            </Tooltip>
            {followUpOpen ? (
              <div className="flex w-[260px] items-center gap-1.5 rounded-full border border-border bg-background/95 p-1.5 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.65)] backdrop-blur">
                <Input
                  value={followUpText}
                  onChange={(event) => setFollowUpText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleFollowUpSubmit()
                    }
                    if (event.key === "Escape") {
                      setFollowUpOpen(false)
                      setFollowUpText("")
                    }
                  }}
                  placeholder={t("contentWriting.materialPanel.clueBoardFollowUpPlaceholder")}
                  className="h-7 min-w-0 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:ring-0"
                  disabled={followUpSubmitting}
                  autoFocus
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-full"
                  onClick={() => void handleFollowUpSubmit()}
                  disabled={!followUpText.trim() || followUpSubmitting}
                  aria-label={t("contentWriting.materialPanel.clueBoardFollowUpSubmit")}
                  title={t("contentWriting.materialPanel.clueBoardFollowUpSubmit")}
                >
                  {followUpSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground"
                  onClick={() => {
                    setFollowUpOpen(false)
                    setFollowUpText("")
                  }}
                  disabled={followUpSubmitting}
                  aria-label={t("contentWriting.materialPanel.clueBoardFollowUpCancel")}
                  title={t("contentWriting.materialPanel.clueBoardFollowUpCancel")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-border bg-background/95 text-primary shadow-[0_16px_42px_-22px_rgba(0,0,0,0.7)] backdrop-blur hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setFollowUpOpen(true)}
                    aria-label={t("contentWriting.materialPanel.clueBoardFollowUp")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {t("contentWriting.materialPanel.clueBoardFollowUp")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : null}
      </motion.div>

      <Dialog open={previewImageUrl !== null} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-4xl p-2 border-none bg-transparent shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{node.query}</DialogTitle>
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 z-0 cursor-zoom-out bg-black/70"
            aria-label="Close image preview"
          />
          <div className="relative z-10 flex items-center justify-center p-2">
            {previewImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImageUrl}
                alt={node.query}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
