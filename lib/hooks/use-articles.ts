import { useState, useCallback, useEffect, useRef } from "react"
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
  ArticleFacetsResponse,
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

interface UseArticlesOptions {
  enabled?: boolean
}

export const ALL_ARTICLE_FACETS = "__joyfulwords_all__"

/**
 * Articles Hook
 * 管理文章列表的 CRUD 操作和状态管理
 */
export function useArticles(options: UseArticlesOptions = {}) {
  const enabled = options.enabled ?? true
  const { toast } = useToast()
  const { t } = useTranslation()

  // ==================== 状态管理 ====================

  const [articles, setArticles] = useState<Article[]>([])
  const [facets, setFacets] = useState<ArticleFacetsResponse>({
    categories: [],
    tags: [],
  })
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  // 过滤器状态
  const [titleFilter, setTitleFilterState] = useState("")
  const [debouncedTitleFilter, setDebouncedTitleFilter] = useState("")
  const [statusFilter, setStatusFilterState] = useState<ArticleStatus | "all">("all")
  const [categoryFilter, setCategoryFilterState] = useState(ALL_ARTICLE_FACETS)
  const [tagFilter, setTagFilterState] = useState(ALL_ARTICLE_FACETS)
  const fetchRequestIdRef = useRef(0)

  // 编辑和删除状态
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)

  // ==================== 数据获取 ====================

  const fetchArticles = useCallback(
    async () => {
      if (!enabled) {
        fetchRequestIdRef.current += 1
        setLoading(false)
        return false
      }

      const requestId = ++fetchRequestIdRef.current
      setLoading(true)
      const result = await articlesClient.getArticles({
        page: pagination.page,
        page_size: pagination.pageSize,
        title: debouncedTitleFilter.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== ALL_ARTICLE_FACETS ? categoryFilter : undefined,
        tag: tagFilter !== ALL_ARTICLE_FACETS ? tagFilter : undefined,
      })

      if (requestId !== fetchRequestIdRef.current) {
        console.debug("[Articles] Ignoring stale list response", { requestId })
        return false
      }

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
    [
      categoryFilter,
      debouncedTitleFilter,
      enabled,
      pagination.page,
      pagination.pageSize,
      statusFilter,
      tagFilter,
      toast,
      t,
    ]
  )

  const fetchFacets = useCallback(async () => {
    if (!enabled) return false

    const result = await articlesClient.getArticleFacets()
    if ("error" in result) {
      console.warn(`[Articles] Failed to load category and tag facets: ${result.error}`)
      return false
    }

    setFacets(result)
    return true
  }, [enabled])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTitleFilter(titleFilter)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [titleFilter])

  // 初始加载
  useEffect(() => {
    if (!enabled) return
    fetchArticles()
  }, [enabled, pagination.page, pagination.pageSize, fetchArticles])

  useEffect(() => {
    if (!enabled) return
    void fetchFacets()
  }, [enabled, fetchFacets])

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

  const resetToFirstPage = useCallback(() => {
    setPagination((prev) => prev.page === 1 ? prev : { ...prev, page: 1 })
  }, [])

  const setTitleFilter = useCallback((value: string) => {
    setTitleFilterState(value)
    resetToFirstPage()
  }, [resetToFirstPage])

  const setStatusFilter = useCallback((value: ArticleStatus | "all") => {
    setStatusFilterState(value)
    resetToFirstPage()
  }, [resetToFirstPage])

  const setCategoryFilter = useCallback((value: string) => {
    setCategoryFilterState(value)
    resetToFirstPage()
  }, [resetToFirstPage])

  const setTagFilter = useCallback((value: string) => {
    setTagFilterState(value)
    resetToFirstPage()
  }, [resetToFirstPage])

  const handlePageChange = useCallback((page: number) => {
    updatePagination({ page })
  }, [updatePagination])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    updatePagination({ pageSize, page: 1 })  // 重置到第一页
  }, [updatePagination])

  // ==================== CRUD 操作 ====================

  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id)

    const result = await articlesClient.deleteArticle(id)

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
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }))
    void fetchFacets()

    return true
  }, [fetchFacets, toast, t])

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
    await Promise.all([fetchArticles(), fetchFacets()])

    return true
  }, [editingArticle, toast, fetchArticles, fetchFacets, t])

  // ==================== 状态更新 ====================

  const handleStatusChange = useCallback(async (id: number, newStatus: ArticleStatus) => {
    setStatusUpdatingId(id)

    const result = await articlesClient.updateArticleStatus(id, {
      status: newStatus,
    })

    setStatusUpdatingId(null)

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
    const [articlesLoaded] = await Promise.all([fetchArticles(), fetchFacets()])
    return articlesLoaded
  }, [fetchArticles, fetchFacets])

  return {
    // 状态
    articles,
    facets,
    loading,
    pagination,
    editingArticle,
    deletingId,
    statusUpdatingId,
    titleFilter,
    statusFilter,
    categoryFilter,
    tagFilter,

    // Setters
    setEditingArticle,
    setDeletingId,
    setTitleFilter,
    setStatusFilter,
    setCategoryFilter,
    setTagFilter,

    // 数据获取
    fetchArticles,
    fetchFacets,
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
