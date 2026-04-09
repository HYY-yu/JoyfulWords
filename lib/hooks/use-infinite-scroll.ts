import { useState, useCallback, useRef, useEffect } from "react"

/**
 * 无限滚动核心 Hook
 * 使用 IntersectionObserver 实现下拉加载更多功能
 *
 * @template T - 列表项类型
 */
export interface UseInfiniteScrollOptions<T> {
  /**
   * 数据获取函数
   * @param page - 当前页码（从 1 开始）
   * @param pageSize - 每页数量
   * @returns Promise<{ list: T[]; total: number } | { error: string }>
   */
  fetchFn: (page: number, pageSize: number) => Promise<{
    list: T[]
    total: number
  } | { error: string }>

  /**
   * 每页数量，默认 20
   */
  pageSize?: number

  /**
   * 防抖延迟（毫秒），默认 300ms
   */
  debounceMs?: number

  /**
   * 是否启用无限滚动，默认 true
   */
  enabled?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  /**
   * 当前已加载的所有数据项
   */
  items: T[]

  /**
   * 是否正在加载
   */
  isLoading: boolean

  /**
   * 是否发生错误
   */
  isError: boolean

  /**
   * 错误信息
   */
  error?: string

  /**
   * 是否还有更多数据可加载
   */
  hasMore: boolean

  /**
   * 总数据量
   */
  total: number

  /**
   * 手动加载更多
   */
  loadMore: () => Promise<void>

  /**
   * 重置状态并重新加载第一页
   */
  reset: () => void

  /**
   * Observer 目标元素的 ref
   * 将此 ref 绑定到列表底部的元素上
   */
  observerTarget: React.RefObject<HTMLDivElement | null>
}

/**
 * 无限滚动 Hook
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   isLoading,
 *   hasMore,
 *   loadMore,
 *   reset,
 *   observerTarget
 * } = useInfiniteScroll({
 *   fetchFn: async (page, pageSize) => {
 *     const response = await fetchItems(page, pageSize)
 *     return { list: response.data, total: response.total }
 *   },
 *   pageSize: 20,
 *   enabled: true
 * })
 *
 * return (
 *   <div>
 *     {items.map(item => <div key={item.id}>{item.name}</div>)}
 *     {hasMore && <div ref={observerTarget}>加载中...</div>}
 *   </div>
 * )
 * ```
 */
export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  debounceMs = 300,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  // ==================== 状态管理 ====================

  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [total, setTotal] = useState(0)

  // ==================== Refs ====================

  const observerTarget = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitializedRef = useRef(false)

  // ==================== 计算属性 ====================

  // hasMore 判断逻辑：
  // 1. 未加载过数据（total === 0 且 items.length === 0）并且是第一页：允许初始加载
  // 2. 已加载过数据（total > 0）：items.length < total
  // 3. 空数据结果（total === 0 但 items.length > 0 或 page > 1）：禁止继续加载
  const hasMore = (total === 0 && items.length === 0 && page === 1) || (total > 0 && items.length < total)

  // ==================== 数据获取 ====================

  const loadMore = useCallback(async () => {
    // 防止重复请求
    if (isLoadingRef.current || !hasMore || !enabled) {
      return
    }

    // 标记加载中
    isLoadingRef.current = true
    setIsLoading(true)
    setIsError(false)
    setError(undefined)

    try {
      const result = await fetchFn(page, pageSize)

      if ("error" in result) {
        setIsError(true)
        setError(result.error)
      } else {
        setItems((prev) => [...prev, ...result.list])
        setTotal(result.total)
        setPage((prev) => prev + 1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "加载失败"
      setIsError(true)
      setError(errorMessage)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [fetchFn, page, pageSize, hasMore, enabled])

  // ==================== 重置功能 ====================

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setIsLoading(false)
    setIsError(false)
    setError(undefined)
    setTotal(0)
    isLoadingRef.current = false
    hasInitializedRef.current = false // 重置初始化标记

    // 清理防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // ==================== Intersection Observer ====================

  useEffect(() => {
    if (!enabled) {
      return
    }

    // 创建观察器
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        // 当目标元素进入视口时，触发加载（在回调内部通过 loadMore 检查状态）
        if (entry.isIntersecting && !isLoadingRef.current) {
          // 清理之前的防抖定时器
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
          }

          // 防抖处理
          debounceTimerRef.current = setTimeout(() => {
            loadMore()
          }, debounceMs)
        }
      },
      {
        // 提前 100px 触发加载，提升用户体验
        rootMargin: "100px",
        // 当目标元素至少 10% 可见时触发
        threshold: 0.1,
      }
    )

    observerRef.current = observer

    // 开始观察目标元素
    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    // 清理函数
    return () => {
      observer.disconnect()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [enabled, loadMore, debounceMs]) // 移除 hasMore 依赖，避免 Observer 重建导致闪烁

  // ==================== 初始加载 ====================

  useEffect(() => {
    if (enabled && items.length === 0 && !isLoading && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      loadMore()
    }
  }, [enabled, items.length, isLoading, loadMore])

  // ==================== 返回值 ====================

  return {
    items,
    isLoading,
    isError,
    error,
    hasMore,
    total,
    loadMore,
    reset,
    observerTarget,
  }
}
