import { useCallback } from "react"
import { useInfiniteScroll } from "./use-infinite-scroll"
import { competitorsClient } from "@/lib/api/competitors/client"
import type { CrawlResult } from "@/lib/api/competitors/types"

/**
 * 竞品无限滚动 Hook 的配置选项
 */
export interface UseInfiniteCompetitorsOptions {
  /**
   * 每页数量，默认 20
   */
  pageSize?: number

  /**
   * 是否启用无限滚动，默认 true
   */
  enabled?: boolean
}

/**
 * 竞品无限滚动 Hook
 *
 * 封装 competitorsClient.getResults API 调用，提供无限滚动功能
 *
 * @example
 * ```tsx
 * const {
 *   competitors,
 *   isLoading,
 *   hasMore,
 *   loadMore,
 *   reset,
 *   observerTarget
 * } = useInfiniteCompetitors({
 *   pageSize: 20,
 *   enabled: true
 * })
 *
 * return (
 *   <div>
 *     {competitors.map(competitor => (
 *       <div key={competitor.id}>{competitor.content}</div>
 *     ))}
 *     {hasMore && <div ref={observerTarget}>加载中...</div>}
 *   </div>
 * )
 * ```
 */
export function useInfiniteCompetitors(options: UseInfiniteCompetitorsOptions = {}) {
  const { pageSize = 20, enabled = true } = options

  // ==================== 数据获取函数 ====================

  const fetchCompetitors = useCallback(
    async (page: number, pageSize: number) => {
      const result = await competitorsClient.getResults({
        page,
        page_size: pageSize,
      })

      if ("error" in result) {
        return { error: result.error }
      }

      return {
        list: result.posts,
        total: result.total,
      }
    },
    []
  )

  // ==================== 使用核心无限滚动 Hook ====================

  const infiniteScroll = useInfiniteScroll<CrawlResult>({
    fetchFn: fetchCompetitors,
    pageSize,
    enabled,
  })

  // ==================== 返回值 ====================

  return {
    ...infiniteScroll,
    competitors: infiniteScroll.items,
  }
}
