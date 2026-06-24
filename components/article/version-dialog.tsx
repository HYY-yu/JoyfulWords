"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useToast } from '@/hooks/use-toast'
import { versionsClient } from '@/lib/api/versions/client'
import { Button } from '@/components/ui/base/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/base/dialog'
import { GitBranchIcon, ArrowRightIcon, Loader2, Trash2, FileText, Clock3, CheckIcon } from 'lucide-react'
import type { Version } from '@/lib/api/versions/types'
import { cn } from '@/lib/utils'

interface VersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId: number
  currentContent: string
  currentTitle: string
  currentUpdatedAt?: string
  onVersionRollback: (versionData: { content: string }) => void
  onSave: (content: string, skipVersion?: boolean) => void
}

interface ParsedVersionData {
  title?: string
  content?: string
  status?: string
  category?: string
  tags?: string
}

type CurrentTimelineNode = {
  kind: 'current'
  id: 'current'
  title: string
  content: string
  createdAt: string
}

type SavedTimelineNode = {
  kind: 'saved'
  id: number
  version: Version
  data: ParsedVersionData
  createdAt: string
}

type TimelineNode = CurrentTimelineNode | SavedTimelineNode

function decodeHtmlEntity(entity: string) {
  const namedEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  }

  if (entity.startsWith('#x')) {
    const codePoint = Number.parseInt(entity.slice(2), 16)
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : `&${entity};`
  }

  if (entity.startsWith('#')) {
    const codePoint = Number.parseInt(entity.slice(1), 10)
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : `&${entity};`
  }

  return namedEntities[entity] ?? `&${entity};`
}

function htmlToPlainText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (_, entity: string) => decodeHtmlEntity(entity))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function VersionDialog({
  open,
  onOpenChange,
  articleId,
  currentContent,
  currentTitle,
  currentUpdatedAt,
  onVersionRollback,
  onSave,
}: VersionDialogProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | number>('current')
  const [applyingVersion, setApplyingVersion] = useState(false)
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null)
  const [dialogOpenedAt, setDialogOpenedAt] = useState(new Date().toISOString())
  const timelineScrollRef = useRef<HTMLDivElement | null>(null)

  const currentNode = useMemo<CurrentTimelineNode>(() => ({
    kind: 'current',
    id: 'current',
    title: currentTitle,
    content: currentContent,
    createdAt: currentUpdatedAt || dialogOpenedAt,
  }), [currentContent, currentTitle, currentUpdatedAt, dialogOpenedAt])

  const savedNodes = useMemo<SavedTimelineNode[]>(() => {
    return versions.flatMap((version) => {
      try {
        return [{
          kind: 'saved' as const,
          id: version.id,
          version,
          data: JSON.parse(version.version_data) as ParsedVersionData,
          createdAt: version.created_at,
        }]
      } catch {
        return []
      }
    })
  }, [versions])

  const timelineNodes = useMemo<TimelineNode[]>(() => {
    const sortedSavedNodes = [...savedNodes].sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    })
    return [...sortedSavedNodes, currentNode]
  }, [currentNode, savedNodes])

  const selectedNode = timelineNodes.find((node) => node.id === selectedNodeId) ?? currentNode
  const selectedTitle = selectedNode.kind === 'current'
    ? selectedNode.title
    : selectedNode.data.title || selectedNode.version.detail || t("contentWriting.version.versionName", { id: selectedNode.version.id })
  const selectedContent = selectedNode.kind === 'current'
    ? selectedNode.content
    : selectedNode.data.content || ''
  const selectedPlainText = htmlToPlainText(selectedContent)

  const fetchVersions = useCallback(async () => {
    if (!articleId) return

    setLoading(true)
    try {
      const result = await versionsClient.getVersions(articleId)
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t("contentWriting.version.loadFailed"),
          description: result.error,
        })
        return
      }
      const activeVersions = (result as Version[]).filter(v => v.is_del === 0)
      setVersions(activeVersions)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t("contentWriting.version.loadFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setLoading(false)
    }
  }, [articleId, t, toast])

  useEffect(() => {
    if (open) {
      setDialogOpenedAt(new Date().toISOString())
      setSelectedNodeId('current')
      fetchVersions()
    }
  }, [open, fetchVersions])

  useEffect(() => {
    if (!timelineNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId('current')
    }
  }, [selectedNodeId, timelineNodes])

  useEffect(() => {
    if (!open || loading) return

    const frame = window.requestAnimationFrame(() => {
      const scrollArea = timelineScrollRef.current
      if (scrollArea) {
        scrollArea.scrollLeft = scrollArea.scrollWidth
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loading, open, timelineNodes.length])

  const handleApplyVersion = async () => {
    if (selectedNode.kind !== 'saved') return

    setApplyingVersion(true)
    try {
      const content = selectedNode.data.content || ''
      onVersionRollback({ content })
      await onSave(content, true)
      toast({
        title: t("contentWriting.version.rollbackSuccess"),
      })
      setSelectedNodeId('current')
      await fetchVersions()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t("contentWriting.version.rollbackFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setApplyingVersion(false)
    }
  }

  const handleDeleteVersion = async (versionId: number) => {
    setDeletingVersionId(versionId)
    try {
      const result = await versionsClient.deleteVersion(versionId)
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: t("contentWriting.version.deleteFailed"),
          description: result.error,
        })
        return
      }
      toast({
        title: t("contentWriting.version.deleteSuccess"),
      })
      await fetchVersions()
      if (selectedNodeId === versionId) {
        setSelectedNodeId('current')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t("contentWriting.version.deleteFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
    } finally {
      setDeletingVersionId(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatNodeDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatNodeTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[96vw] !max-h-[92vh] !w-[96vw] !h-[92vh] overflow-hidden p-0 shadow-2xl rounded-xl">
        <DialogHeader className="border-b bg-[var(--jw-header-bg)] px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <GitBranchIcon className="h-5 w-5 text-primary" />
            {t("contentWriting.version.historyVersions")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(92vh-73px)] min-h-0 flex-col bg-background">
          <div className="border-b border-border px-6 py-4">
            {loading ? (
              <div className="flex h-[96px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div ref={timelineScrollRef} className="overflow-x-auto pb-1">
                <div className="relative flex min-w-max items-start gap-0 px-1">
                  <div className="absolute left-8 right-8 top-[21px] h-px bg-border" />
                  {timelineNodes.map((node, index) => {
                    const selected = node.id === selectedNode.id
                    const isCurrent = node.kind === 'current'

                    return (
                      <button
                        key={`${node.kind}-${node.id}`}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className="group relative flex min-w-[168px] flex-col items-center px-4 text-center"
                      >
                        <span
                          className={cn(
                            "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-background shadow-sm transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : isCurrent
                                ? "border-primary/40 text-primary group-hover:bg-primary/10"
                                : "border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                          )}
                        >
                          {selected ? <CheckIcon className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                        </span>
                        <span className={cn("mt-2 text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>
                          {isCurrent
                            ? t("contentWriting.version.currentVersion")
                            : node.version.detail || t("contentWriting.version.versionName", { id: node.version.id })}
                        </span>
                        <span className="mt-1 text-[11px] leading-4 text-muted-foreground">
                          {formatNodeDate(node.createdAt)}
                        </span>
                        <span className="text-[11px] font-medium leading-4 text-muted-foreground">
                          {formatNodeTime(node.createdAt)}
                        </span>
                        {index === timelineNodes.length - 1 && timelineNodes.length === 1 ? (
                          <span className="mt-2 text-[11px] text-muted-foreground">{t("contentWriting.version.empty")}</span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/30 px-6 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="truncate text-sm font-semibold text-foreground">{selectedTitle}</h3>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDateTime(selectedNode.createdAt)}</span>
                  {selectedNode.kind === 'saved' && selectedNode.version.detail ? (
                    <span>{selectedNode.version.detail}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {selectedNode.kind === 'saved' ? (
                  <>
                    <Button
                      onClick={handleApplyVersion}
                      disabled={applyingVersion || deletingVersionId === selectedNode.version.id}
                      size="sm"
                      className="h-8 gap-1.5"
                    >
                      {applyingVersion ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      )}
                      {t("contentWriting.version.applyVersion")}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteVersion(selectedNode.version.id)}
                      disabled={deletingVersionId === selectedNode.version.id || applyingVersion}
                      aria-label={t("contentWriting.version.deleteVersion")}
                      title={t("contentWriting.version.deleteVersion")}
                    >
                      {deletingVersionId === selectedNode.version.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-background px-6 py-5">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground">
                {selectedPlainText}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
