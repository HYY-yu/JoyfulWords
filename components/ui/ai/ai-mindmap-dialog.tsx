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

interface AIMindMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId: number
}

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

function resolveMindMapErrorMessage(error: string): string {
  switch (error) {
    case "MINDMAP_UNAUTHORIZED":
      return "Unauthorized"
    case "ARTICLE_NOT_FOUND":
    case "MINDMAP_ARTICLE_NOT_FOUND":
    case "MINDMAP_NOT_FOUND":
      return "Article not found"
    case "MINDMAP_GENERATE_INVALID_PARAMS":
    case "MINDMAP_INVALID_STRUCTURE":
      return "Invalid mind map payload"
    case "MINDMAP_GENERATE_FAILED":
    case "MINDMAP_LOAD_FAILED":
    case "MINDMAP_SAVE_FAILED":
    case "MINDMAP_REQUEST_FAILED":
      return "Mind map request failed"
    default:
      return error
  }
}

export function AIMindMapDialog({
  open,
  onOpenChange,
  articleId,
}: AIMindMapDialogProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mindmap, setMindmap] = useState<MindMapDocument | null>(null)
  const [isDirty, setIsDirty] = useState(false)
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

  const applyExternalMindmap = useCallback((nextMindmap: MindMapDocument) => {
    mindmapRef.current = nextMindmap
    setMindmap(nextMindmap)
    setIsDirty(false)
    setCanvasVersion((current) => current + 1)
  }, [])

  const loadExisting = useCallback(async (): Promise<MindMapDocument | null> => {
    const result = await mindMapClient.getByArticleId(articleId)

    if ("error" in result) {
      console.warn("[MindMap] Load failed", { articleId, error: result.error })
      throw new Error(resolveMindMapErrorMessage(result.error))
    }

    if (!result.exists) {
      console.debug("[MindMap] No existing map found", {
        articleId,
        message: result.message,
      })
      return null
    }

    return result.data
  }, [articleId])

  const generateMindMap = useCallback(async () => {
    console.info("[MindMap] Generate started", {
      articleId,
    })

    // TODO(observability): add trace span for client-side mindmap generation request.
    const result = await mindMapClient.generate({ articleId })

    if ("error" in result) {
      console.warn("[MindMap] Generate failed", { articleId, error: result.error })
      throw new Error(resolveMindMapErrorMessage(result.error))
    }

    return result
  }, [articleId])

  const initializeDialog = useCallback(async () => {
    setIsLoading(true)

    try {
      const existing = await loadExisting()

      if (existing) {
        applyExternalMindmap(existing)
        return
      }

      const generated = await generateMindMap()

      applyExternalMindmap(generated)
      toast({ title: t("aiMindmap.toast.generated") })
    } catch (error) {
      console.error("[MindMap] Initialize failed", error)
      setMindmap(null)
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
        console.debug("[MindMap] Node selected", { nodeId: nextId })
      }

      const handleSelectNewNode = (nodeObj: { id: string }) => {
        console.debug("[MindMap] New node selected", { nodeId: nodeObj.id })
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
      applyExternalMindmap(generated)
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
      const result = await mindMapClient.saveByArticleId(articleId, {
        title: currentMindmap.title,
        root: currentMindmap.root,
      })
      if ("error" in result) {
        throw new Error(resolveMindMapErrorMessage(result.error))
      }

      applyExternalMindmap(result)
      console.info("[MindMap] Saved", {
        articleId,
        revision: result.revision,
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
  }, [applyExternalMindmap, articleId, t, toast])

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
                    disabled={isLoading || isSaving || !mindmap || !isDirty}
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
