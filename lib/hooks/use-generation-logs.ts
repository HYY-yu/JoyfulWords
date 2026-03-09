import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import type {
  GenerationLog,
  GetGenerationLogsRequest,
} from "@/lib/api/image-generation/types"

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function useGenerationLogs() {
  const { toast } = useToast()
  const { t } = useTranslation()

  // 状态管理
  const [logs, setLogs] = useState<GenerationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  })

  // 过滤条件
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const [modelFilter, setModelFilter] = useState<string>("all")

  // 可用模型列表
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  // 数据获取
  const fetchLogs = useCallback(async () => {
    setLoading(true)

    const request: GetGenerationLogsRequest = {
      page: pagination.page,
      page_size: pagination.pageSize,
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      gen_mode: modeFilter !== "all" ? (modeFilter as any) : undefined,
      model_name: modelFilter !== "all" ? modelFilter : undefined,
    }

    const result = await imageGenerationClient.getGenerationLogs(request)

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("imageGeneration.logs.toast.fetchFailed"),
        description: result.error,
      })
      return false
    } else {
      setLogs(result.list)
      setPagination((prev) => ({
        ...prev,
        total: result.total,
      }))
      return true
    }
  }, [pagination.page, pagination.pageSize, statusFilter, modeFilter, modelFilter, toast, t])

  // 监听过滤条件变化，自动刷新数据
  useEffect(() => {
    fetchLogs()
  }, [statusFilter, modeFilter, modelFilter, fetchLogs])

  // 获取可用模型列表
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true)
      try {
        const result = await imageGenerationClient.getModels()

        if ('error' in result) {
          console.error('[GenerationLogs] Failed to fetch models:', result.error)
          // 即使失败也不显示 toast，因为这只是筛选器
        } else {
          console.info('[GenerationLogs] Models fetched successfully:', {
            provider: result.provider,
            modelCount: result.models.length,
          })
          setAvailableModels(result.models)
        }
      } catch (error) {
        console.error('[GenerationLogs] Unexpected error fetching models:', error)
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, []) // 只在 mount 时执行一次

  // 分页处理
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setPagination((prev) => ({ ...prev, ...updates }))
  }, [])

  const handlePageChange = (page: number) => {
    updatePagination({ page })
  }

  const handlePageSizeChange = (pageSize: number) => {
    updatePagination({ pageSize, page: 1 })
  }

  return {
    // 状态
    logs,
    loading,
    pagination,

    // 过滤器
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    modelFilter,
    setModelFilter,

    // 可用模型列表
    availableModels,
    loadingModels,

    // 数据获取
    fetchLogs,

    // 分页
    updatePagination,
    handlePageChange,
    handlePageSizeChange,
  }
}
