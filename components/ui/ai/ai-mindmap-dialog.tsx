"use client"

import "mind-elixir/style.css"

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  MindElixirCtor,
  MindElixirInstance,
  Operation,
  Theme,
} from "mind-elixir"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import {
  Loader2Icon,
  SaveIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { mindMapClient } from "@/lib/api/articles/mindmap-client"
import type { MindMapDocument } from "@/lib/api/articles/types"
import { fromMindElixirData, toMindElixirData } from "@/lib/mindmap/mind-elixir-adapter"
import styles from "./ai-mindmap-dialog.module.css"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import { TaskType } from "@/lib/api/taskcenter/types"

interface AIMindMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId: number
  articleText: string
}

type MindMapSourceMode = "history" | "full_article"

const JOYFUL_MINDMAP_THEME: Theme = {
  name: "JoyfulWords",
  type: "light",
  palette: ["#2F6FED", "#0F9D7A", "#E87B2A", "#B94CCF", "#D64550", "#1481BA"],
  cssVar: {
    "--node-gap-x": "42px",
    "--node-gap-y": "14px",
    "--main-gap-x": "88px",
    "--main-gap-y": "46px",
    "--main-color": "#1e293b",
    "--main-bgcolor": "rgba(255, 255, 255, 0.96)",
    "--main-bgcolor-transparent": "rgba(255, 255, 255, 0.82)",
    "--color": "#344256",
    "--bgcolor": "transparent",
    "--selected": "#2F6FED",
    "--accent-color": "#2F6FED",
    "--root-color": "#ffffff",
    "--root-bgcolor": "#162033",
    "--root-border-color": "rgba(255, 255, 255, 0.18)",
    "--root-radius": "999px",
    "--main-radius": "18px",
    "--topic-padding": "8px 14px",
    "--panel-color": "#0f172a",
    "--panel-bgcolor": "rgba(255, 255, 255, 0.96)",
    "--panel-border-color": "rgba(148, 163, 184, 0.22)",
    "--map-padding": "90px 120px",
  },
}

function logOperation(operation: Operation) {
  if (operation.name === "removeNodes") {
    console.info("[MindMap] Nodes removed", { count: operation.objs.length })
    return
  }

  if (operation.name === "finishEdit" || operation.name === "reshapeNode") {
    console.debug("[MindMap] Node updated", {
      operation: operation.name,
      nodeId: operation.obj.id,
    })
    return
  }

  if (operation.name === "addChild" || operation.name === "insertSibling" || operation.name === "insertParent") {
    console.info("[MindMap] Structure updated", {
      operation: operation.name,
      nodeId: operation.obj.id,
    })
    return
  }

  console.debug("[MindMap] Operation applied", { operation: operation.name })
}

export function AIMindMapDialog({
  open,
  onOpenChange,
  articleId,
  articleText,
}: AIMindMapDialogProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mindmap, setMindmap] = useState<MindMapDocument | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [viewSourceMode, setViewSourceMode] = useState<MindMapSourceMode>("history")
  const [canvasVersion, setCanvasVersion] = useState(0)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<MindElixirInstance | null>(null)
  const mindmapRef = useRef<MindMapDocument | null>(null)

  useEffect(() => {
    mindmapRef.current = mindmap
  }, [mindmap])

  const syncFromInstance = useCallback((reason: string) => {
    const instance = instanceRef.current
    const currentMindmap = mindmapRef.current

    if (!instance || !currentMindmap) {
      return
    }

    const nextMindmap = fromMindElixirData(instance.getData(), currentMindmap)

    console.debug("[MindMap] Syncing document from canvas", {
      articleId,
      reason,
      revision: nextMindmap.revision,
    })

    mindmapRef.current = nextMindmap
    startTransition(() => {
      setMindmap(nextMindmap)
      setIsDirty(true)
    })
  }, [articleId])

  const applyExternalMindmap = useCallback((
    nextMindmap: MindMapDocument,
    sourceMode: MindMapSourceMode
  ) => {
    mindmapRef.current = nextMindmap
    setMindmap(nextMindmap)
    setSelectedNodeId(nextMindmap.root.id)
    setViewSourceMode(sourceMode)
    setIsDirty(false)
    setCanvasVersion((current) => current + 1)
  }, [])

  const loadExisting = useCallback(async (): Promise<MindMapDocument | null> => {
    const result = await mindMapClient.getByArticleId(articleId)

    if ("error" in result) {
      if (result.error === "MINDMAP_NOT_FOUND") {
        console.debug("[MindMap] No existing map found", { articleId })
        return null
      }

      console.warn("[MindMap] Load failed", { articleId, error: result.error })
      throw new Error(result.error)
    }

    return result.data.mindmap
  }, [articleId])

  const generateMindMap = useCallback(async () => {
    console.info("[MindMap] Generate started", {
      articleId,
      articleText: articleText.length,
    })

    // TODO(observability): add trace span for client-side mindmap generation request.
    const result = await mindMapClient.generate({
      article_id: articleId,
      article_text: articleText,
    })

    if ("error" in result) {
      console.warn("[MindMap] Generate failed", { articleId, error: result.error })
      throw new Error(result.error)
    }

    // 生成成功后，检查是否有任务ID，如果有则打开任务详情
    if (result.data.task_id) {
      console.info("[MindMap] Task created", { taskId: result.data.task_id })
      // 延迟打开任务详情，确保任务已创建
      setTimeout(async () => {
        try {
          const taskDetail = await taskCenterClient.getTaskDetail(TaskType.ARTICLE, result.data.task_id)
          console.info("[MindMap] Task detail fetched", taskDetail)
        } catch (error) {
          console.warn("[MindMap] Failed to fetch task detail", error)
        }
      }, 1000)
    }

    return result.data.mindmap
  }, [articleId, articleText])

  const initializeDialog = useCallback(async () => {
    setIsLoading(true)

    try {
      const existing = await loadExisting()

      if (existing) {
        applyExternalMindmap(existing, "history")
        return
      }

      const generated = await generateMindMap()

      applyExternalMindmap(generated, "full_article")
      toast({ title: t("aiMindmap.toast.generated") })
    } catch (error) {
      console.error("[MindMap] Initialize failed", error)
      setMindmap(null)
      setSelectedNodeId(null)
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.loadFailed"),
        description: error instanceof Error ? error.message : t("aiMindmap.toast.retryError"),
      })
    } finally {
      setIsLoading(false)
    }
  }, [applyExternalMindmap, generateMindMap, loadExisting, t, toast])

  useEffect(() => {
    if (!open) {
      return
    }

    initializeDialog()
  }, [open, initializeDialog])

  useEffect(() => {
    if (!open || !mindmapRef.current || !canvasRef.current) {
      return
    }

    let cancelled = false
    let cleanupSelection: (() => void) | null = null

    async function mountMindMap() {
      const [{ default: MindElixir, SIDE }, locales] = await Promise.all([
        import("mind-elixir"),
        import("mind-elixir/i18n"),
      ])

      if (cancelled || !canvasRef.current || !mindmapRef.current) {
        return
      }

      const localePack = locale === "en" ? locales.en : locales.zh_CN
      const instance = new (MindElixir as MindElixirCtor)({
        el: canvasRef.current,
        direction: SIDE,
        editable: true,
        toolBar: true,
        keypress: true,
        contextMenu: {
          locale: localePack,
          focus: true,
          link: false,
        },
        allowUndo: true,
        overflowHidden: false,
        theme: JOYFUL_MINDMAP_THEME,
      })

      const initError = instance.init(toMindElixirData(mindmapRef.current))
      if (initError) {
        throw initError
      }

      instance.clearHistory?.()
      instance.toCenter()

      const handleOperation = (operation: Operation) => {
        logOperation(operation)
        syncFromInstance(operation.name)
      }

      const handleSelection = (nodeObjs: Array<{ id: string }>) => {
        const nextId = nodeObjs[0]?.id || null
        setSelectedNodeId(nextId)
      }

      const handleSelectNewNode = (nodeObj: { id: string }) => {
        setSelectedNodeId(nodeObj.id)
      }

      const handleExpand = (nodeObj: { id: string }) => {
        console.debug("[MindMap] Node expand state changed", { nodeId: nodeObj.id })
        syncFromInstance("expand-node")
      }

      instance.bus.addListener("operation", handleOperation)
      instance.bus.addListener("selectNodes", handleSelection)
      instance.bus.addListener("selectNewNode", handleSelectNewNode)
      instance.bus.addListener("expandNode", handleExpand)

      const initialSelectionId = mindmapRef.current?.root.id
      if (initialSelectionId) {
        try {
          const selectedElement = instance.findEle(initialSelectionId)
          if (selectedElement) {
            instance.selectNode(selectedElement)
          }
        } catch (error) {
          console.debug("[MindMap] Unable to restore node selection", {
            selectedNodeId: initialSelectionId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      instanceRef.current = instance

      cleanupSelection = () => {
        instance.bus.removeListener("operation", handleOperation)
        instance.bus.removeListener("selectNodes", handleSelection)
        instance.bus.removeListener("selectNewNode", handleSelectNewNode)
        instance.bus.removeListener("expandNode", handleExpand)
      }
    }

    mountMindMap().catch((error) => {
      console.error("[MindMap] Failed to mount editor", error)
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.loadFailed"),
        description: error instanceof Error ? error.message : t("aiMindmap.toast.retryError"),
      })
    })

    return () => {
      cancelled = true
      cleanupSelection?.()
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  }, [canvasVersion, locale, open, syncFromInstance, t, toast])

  const handleRegenerate = useCallback(async () => {
    setIsLoading(true)

    try {
      const generated = await generateMindMap()
      applyExternalMindmap(generated, "full_article")
      toast({ title: t("aiMindmap.toast.generated") })
    } catch (error) {
      console.error("[MindMap] Regenerate failed", error)
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.generateFailed"),
        description: error instanceof Error ? error.message : t("aiMindmap.toast.retryError"),
      })
    } finally {
      setIsLoading(false)
    }
  }, [applyExternalMindmap, generateMindMap, t, toast])

  const handleSave = useCallback(async () => {
    const currentMindmap = mindmapRef.current

    if (!currentMindmap) {
      return
    }

    setIsSaving(true)

    try {
      // TODO(observability): add trace span for client-side mindmap save request.
      const result = await mindMapClient.saveByArticleId(articleId, { mindmap: currentMindmap })
      if ("error" in result) {
        if (result.error === "MINDMAP_REVISION_CONFLICT") {
          toast({
            variant: "destructive",
            title: t("aiMindmap.toast.revisionConflict"),
            description: t("aiMindmap.toast.revisionConflictDesc"),
          })
          return
        }

        throw new Error(result.error)
      }

      applyExternalMindmap(result.data.mindmap, viewSourceMode)
      console.info("[MindMap] Saved", {
        articleId,
        revision: result.data.mindmap.revision,
      })
      toast({ title: t("aiMindmap.toast.saveSuccess") })
    } catch (error) {
      console.error("[MindMap] Save failed", error)
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.saveFailed"),
        description: error instanceof Error ? error.message : t("aiMindmap.toast.retryError"),
      })
    } finally {
      setIsSaving(false)
    }
  }, [applyExternalMindmap, articleId, t, toast, viewSourceMode])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75"
        className="flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl"
      >
        <DialogHeader className="border-b bg-background px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                <SparklesIcon className="h-5 w-5 text-primary" />
                {t("aiMindmap.title")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t("aiMindmap.canvas.hint")}
              </DialogDescription>
            </div>

            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-muted"
                title="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("aiMindmap.loading")}
              </div>
            </div>
          ) : !mindmap ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t("aiMindmap.empty")}
            </div>
          ) : (
            <div className="h-full">
              <div className={`${styles.workspaceShell} h-full w-full`}>
                <div className="absolute right-5 top-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={styles.floatingAction}
                    onClick={() => void handleRegenerate()}
                    disabled={isLoading}
                  >
                    <SparklesIcon className="mr-1 h-4 w-4" />
                    {t("aiMindmap.actions.regenerateFull")}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    className={styles.floatingPrimary}
                    onClick={() => void handleSave()}
                    disabled={isLoading || isSaving || !mindmap}
                  >
                    {isSaving ? (
                      <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="mr-1 h-4 w-4" />
                    )}
                    {t("aiMindmap.actions.saveDirty")}
                  </Button>
                </div>

                <div className={`${styles.workspaceSurface} h-full min-h-full w-full`}>
                  <div ref={canvasRef} className="h-full min-h-full w-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
