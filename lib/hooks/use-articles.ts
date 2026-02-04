import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { articlesClient } from "@/lib/api/articles/client"
import { getAllowedStatusTransitions } from "@/lib/api/articles/enums"
import type {
  Article,
  ArticleStatus,
  GetArticlesRequest,
  CreateArticleRequest,
  UpdateArticleContentRequest,
  UpdateArticleMetadataRequest,
  UpdateArticleStatusRequest,
  AIWriteRequest,
} from "@/lib/api/articles/types"

// Re-export types for use in other modules
export type {
  Article,
  ArticleStatus,
  GetArticlesRequest,
  CreateArticleRequest,
  UpdateArticleContentRequest,
  UpdateArticleMetadataRequest,
  UpdateArticleStatusRequest,
  AIWriteRequest,
} from "@/lib/api/articles/types"

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface ArticlesState {
  articles: Article[]
  pagination: PaginationState
  loading: boolean
}

/**
 * Articles Hook
 * 管理文章列表的 CRUD 操作和状态管理
 */
export function useArticles() {
  const { toast } = useToast()
  const { t } = useTranslation()

  // ==================== 状态管理 ====================

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  // 过滤器状态
  const [titleFilter, setTitleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all")

  // 编辑和删除状态
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ==================== 数据获取 ====================

  const fetchArticles = useCallback(
    async (filters?: {
      title?: string
      status?: ArticleStatus | "all"
    }) => {
      setLoading(true)

      const result = await articlesClient.getArticles({
        page: pagination.page,
        page_size: pagination.pageSize,
        title: filters?.title || titleFilter || undefined,
        status: filters?.status && filters.status !== "all" ? filters.status : undefined,
      })

      setLoading(false)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: t("contentWriting.manager.toast.loadFailed"),
          description: result.error,
        })
        return false
      } else {
        setArticles(result.list)
        setPagination((prev) => ({
          ...prev,
          total: result.total,
        }))
        return true
      }
    },
    [pagination.page, pagination.pageSize, titleFilter, toast, t]
  )

  // 初始加载
  useEffect(() => {
    fetchArticles()
  }, [pagination.page, pagination.pageSize])

  // ==================== 分页操作 ====================

  const updatePagination = useCallback(
    (updates: Partial<{ page: number; pageSize: number }>) => {
      setPagination((prev) => ({
        ...prev,
        ...updates,
      }))
    },
    []
  )

  const handlePageChange = useCallback((page: number) => {
    updatePagination({ page })
  }, [updatePagination])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    updatePagination({ pageSize, page: 1 })  // 重置到第一页
  }, [updatePagination])

  // ==================== CRUD 操作 ====================

  const handleDelete = useCallback(async (id: number) => {
    setLoading(true)
    setDeletingId(id)

    const result = await articlesClient.deleteArticle(id)

    setLoading(false)
    setDeletingId(null)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.manager.toast.deleteFailed"),
        description: result.error,
      })
      return false
    }

    toast({
      title: t("contentWriting.manager.toast.deleteSuccess"),
    })

    // 从列表中移除
    setArticles((prev) => prev.filter((a) => a.id !== id))

    // 刷新列表
    await fetchArticles()

    return true
  }, [toast, fetchArticles, t])

  const handleEdit = useCallback((article: Article) => {
    setEditingArticle(article)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingArticle) return false

    setLoading(true)

    const result = await articlesClient.updateArticleMetadata(editingArticle.id, {
      title: editingArticle.title,
      category: editingArticle.category,
      tags: editingArticle.tags,
    })

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.manager.toast.updateFailed"),
        description: result.error,
      })
      return false
    }

    toast({
      title: t("contentWriting.manager.toast.updateSuccess"),
    })

    // 关闭编辑对话框
    setEditingArticle(null)

    // 刷新列表
    await fetchArticles()

    return true
  }, [editingArticle, toast, fetchArticles, t])

  // ==================== 状态更新 ====================

  const handleStatusChange = useCallback(async (id: number, newStatus: ArticleStatus) => {
    setLoading(true)

    const result = await articlesClient.updateArticleStatus(id, {
      status: newStatus,
    })

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.manager.toast.statusUpdateFailed"),
        description: result.error,
      })
      return false
    }

    toast({
      title: t("contentWriting.manager.toast.statusUpdateSuccess"),
    })

    // 更新本地状态
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )

    return true
  }, [toast, t])

  // 获取允许的状态转换选项
  const getAllowedStatuses = useCallback((currentStatus: ArticleStatus): ArticleStatus[] => {
    return getAllowedStatusTransitions(currentStatus) as ArticleStatus[]
  }, [])

  // ==================== AI 写作 ====================

  const handleAIWrite = useCallback(async (
    prompt: string,
    linkPost?: number,
    linkMaterials?: number[]
  ) => {
    setLoading(true)

    const result = await articlesClient.aiWrite({
      req: prompt,
      link_post: linkPost,
      link_materials: linkMaterials,
    })

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t("contentWriting.manager.toast.aiWriteStartFailed"),
        description: result.error,
      })
      return null
    }

    toast({
      title: t("contentWriting.manager.toast.aiWriteStarted"),
      description: t("contentWriting.manager.toast.aiWriteStartedDesc"),
    })

    // 返回创建的文章 ID
    return result.id
  }, [toast, t])

  // ==================== 手动刷新（用于 AI 生成完成） ====================

  const handleRefresh = useCallback(async () => {
    return await fetchArticles()
  }, [fetchArticles])

  return {
    // 状态
    articles,
    loading,
    pagination,
    editingArticle,
    deletingId,
    titleFilter,
    statusFilter,

    // Setters
    setEditingArticle,
    setDeletingId,
    setTitleFilter,
    setStatusFilter,

    // 数据获取
    fetchArticles,
    handleRefresh,

    // CRUD
    handleDelete,
    handleEdit,
    handleSaveEdit,

    // 状态更新
    handleStatusChange,
    getAllowedStatuses,

    // AI 写作
    handleAIWrite,

    // 分页
    handlePageChange,
    handlePageSizeChange,
  }
}
