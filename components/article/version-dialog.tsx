"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { useToast } from '@/hooks/use-toast'
import { versionsClient } from '@/lib/api/versions/client'
import { Button } from '@/components/ui/base/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/base/dialog'
import { GitBranchIcon, XIcon, ArrowRightIcon, Loader2, Trash2, FileText } from 'lucide-react'
import { TiptapEditor } from '@/components/tiptap-editor'
import type { Version } from '@/lib/api/versions/types'

interface VersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId: number
  currentContent: string
  currentTitle: string
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

export function VersionDialog({
  open,
  onOpenChange,
  articleId,
  currentContent,
  currentTitle,
  onVersionRollback,
  onSave,
}: VersionDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [selectedVersionData, setSelectedVersionData] = useState<ParsedVersionData | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [applyingVersion, setApplyingVersion] = useState(false)
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null)
  const [leftContent, setLeftContent] = useState(currentContent)

  const fetchVersions = useCallback(async () => {
    if (!articleId) return

    setLoading(true)
    try {
      const result = await versionsClient.getVersions(articleId)
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: '加载失败',
          description: result.error,
        })
        return
      }
      const activeVersions = (result as Version[]).filter(v => v.is_del === 0)
      setVersions(activeVersions)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }, [articleId, toast])

  useEffect(() => {
    if (open) {
      fetchVersions()
      setSelectedVersion(null)
      setSelectedVersionData(null)
      setShowCompare(false)
      setLeftContent(currentContent)
    }
  }, [open, fetchVersions, currentContent])

  const handleSelectVersion = (version: Version) => {
    try {
      const parsedData = JSON.parse(version.version_data) as ParsedVersionData
      setSelectedVersion(version)
      setSelectedVersionData(parsedData)
      setShowCompare(true)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '解析失败',
        description: 'Failed to parse version data',
      })
    }
  }

  const handleApplyVersion = async () => {
    if (!selectedVersion || !selectedVersionData) return

    setApplyingVersion(true)
    try {
      onVersionRollback({ content: selectedVersionData.content || '' })
      await onSave(selectedVersionData.content || '', true)
      toast({
        title: '回滚成功',
      })
      setShowCompare(false)
      setSelectedVersion(null)
      setSelectedVersionData(null)
      await fetchVersions()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '回滚失败',
        description: error instanceof Error ? error.message : 'Unknown error',
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
          title: '删除失败',
          description: result.error,
        })
        return
      }
      toast({
        title: '删除成功',
      })
      await fetchVersions()
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null)
        setSelectedVersionData(null)
        setShowCompare(false)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setDeletingVersionId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleLeftContentChange = useCallback((text: string, html: string) => {
    setLeftContent(html)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !max-h-[92vh] !w-[98vw] !h-[92vh] overflow-hidden p-0 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <GitBranchIcon className="w-5 h-5 text-primary" />
            版本历史
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(90vh-80px)] gap-0">
          {/* 左侧：当前版本内容 - 可编辑 */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm text-gray-800">当前版本</span>
              </div>
              <span className="text-xs text-gray-500 truncate max-w-48">{currentTitle}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <TiptapEditor
                content={leftContent}
                onChange={handleLeftContentChange}
                editable={true}
                mode="edit"
              />
            </div>
          </div>

          {/* 右侧：版本列表 / 选中版本内容 - 不可编辑 */}
          <div className="flex-1 flex flex-col border-l border-gray-200">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-secondary" />
                <span className="font-medium text-sm text-gray-800">
                  {showCompare && selectedVersion ? '选中版本' : '版本列表'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {showCompare && selectedVersion && (
                  <Button
                    onClick={handleApplyVersion}
                    disabled={applyingVersion}
                    size="xs"
                    className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1.5 rounded-md shadow-sm hover:shadow transition-all"
                  >
                    {applyingVersion ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                    ) : (
                      <ArrowRightIcon className="w-3 h-3 mr-1.5" />
                    )}
                    应用版本
                  </Button>
                )}
                {showCompare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCompare(false)
                      setSelectedVersion(null)
                      setSelectedVersionData(null)
                    }}
                    className="h-7 w-7 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : showCompare && selectedVersion && selectedVersionData ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 space-y-1">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-medium">创建时间：</span>
                      {formatDate(selectedVersion.created_at)}
                    </div>
                    {selectedVersion.detail && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="font-medium">描述：</span>
                        {selectedVersion.detail}
                      </div>
                    )}
                    {selectedVersionData.title && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="font-medium">标题：</span>
                        {selectedVersionData.title}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <TiptapEditor
                      content={selectedVersionData.content || ''}
                      editable={false}
                      mode="edit"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  {versions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">暂无版本记录</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className="p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          onClick={() => handleSelectVersion(version)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-sm text-gray-800">
                              {version.detail || `版本 ${version.id}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteVersion(version.id)
                              }}
                              disabled={deletingVersionId === version.id}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-md"
                            >
                              {deletingVersionId === version.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(version.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}