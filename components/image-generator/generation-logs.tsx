"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useGenerationLogs } from "@/lib/hooks/use-generation-logs"
import { GenerationLogsTable } from "./generation-logs-table"
import { PromptPreviewDialog } from "./prompt-preview-dialog"
import type { GenerationLog } from "@/lib/api/image-generation/types"

export function GenerationLogs() {
  const { t } = useTranslation()

  const {
    logs,
    loading,
    pagination,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    modelFilter,
    setModelFilter,
    availableModels,
    loadingModels,
    handlePageChange,
    handlePageSizeChange,
  } = useGenerationLogs()

  // Prompt 预览状态
  const [selectedLogForPrompt, setSelectedLogForPrompt] = useState<GenerationLog | null>(null)

  const handleViewPrompt = (log: GenerationLog) => {
    setSelectedLogForPrompt(log)
  }

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <>
      <div className="flex-1 min-h-0">
        <GenerationLogsTable
          logs={logs}
          loading={loading}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          modeFilter={modeFilter}
          setModeFilter={setModeFilter}
          modelFilter={modelFilter}
          setModelFilter={setModelFilter}
          availableModels={availableModels}
          loadingModels={loadingModels}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onViewPrompt={handleViewPrompt}
          onDownloadImage={handleDownloadImage}
          t={t}
        />
      </div>

      {/* Prompt 预览弹框 */}
      {selectedLogForPrompt && (
        <PromptPreviewDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedLogForPrompt(null)}
          prompt={selectedLogForPrompt.prompt}
        />
      )}
    </>
  )
}
