"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useGenerationLogs } from "@/lib/hooks/use-generation-logs"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { GenerationLogsTable } from "./generation-logs-table"
import { PromptPreviewDialog } from "../dialogs/prompt-preview-dialog"
import type { GenerationLog } from "@/lib/api/image-generation/types"

export function GenerationLogs() {
  const { t } = useTranslation()
  const { toast } = useToast()

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

  const handleCopyToMaterials = async (logId: number) => {
    console.info('[GenerationLogs] Copying log to materials:', { logId })

    try {
      const result = await imageGenerationClient.copyToMaterials(logId)

      if ('error' in result) {
        console.error('[GenerationLogs] Copy failed:', result.error)
        
        const errorMsg = String(result.error)

        let errorKey = "serverError"
        if (errorMsg.includes("not found")) errorKey = "logNotFound"
        else if (errorMsg.includes("not completed")) errorKey = "notCompleted"
        else if (errorMsg.includes("no images")) errorKey = "noImages"
        else if (errorMsg.includes("unauthorized")) errorKey = "unauthorized"

        toast({
          variant: "destructive",
          title: t("imageGeneration.toast.copyToMaterialsFailed"),
          description: t(`imageGeneration.toast.error.${errorKey}`),
        })
        return
      }

      console.info('[GenerationLogs] Copy success:', {
        count: result.count,
        materialIds: result.material_ids,
      })

      toast({
        title: t("imageGeneration.toast.copyToMaterialsSuccess", {
          count: result.count,
        }),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[GenerationLogs] Unexpected error:', { error: errorMessage })

      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.copyToMaterialsFailed"),
        description: t("imageGeneration.toast.error.serverError"),
      })
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
          onCopyToMaterials={handleCopyToMaterials}
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
