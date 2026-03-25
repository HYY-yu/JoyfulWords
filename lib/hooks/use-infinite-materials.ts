import { useCallback, useRef, useEffect } from "react"
import { useInfiniteScroll } from "./use-infinite-scroll"
import { materialsClient } from "@/lib/api/materials/client"
import type { Material, MaterialType } from "@/lib/api/materials/types"

/**
 * 素材无限滚动 Hook 的配置选项
 */
export interface UseInfiniteMaterialsOptions {
  /**
   * 按文章筛选素材
   */
  articleId?: number

  /**
   * 素材类型过滤
   */
  type?: MaterialType

  /**
   * 名称搜索（模糊匹配）
   */
  nameFilter?: string

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
 * 素材无限滚动 Hook
 *
 * 封装 materialsClient.getMaterials API 调用，提供无限滚动功能
 *
 * @example
 * ```tsx
 * const {
 *   materials,
 *   isLoading,
 *   hasMore,
 *   loadMore,
 *   reset,
 *   observerTarget
 * } = useInfiniteMaterials({
 *   type: 'image',
 *   nameFilter: 'AI',
 *   pageSize: 20,
 *   enabled: true
 * })
 *
 * return (
 *   <div>
 *     {materials.map(material => (
 *       <div key={material.id}>{material.title}</div>
 *     ))}
 *     {hasMore && <div ref={observerTarget}>加载中...</div>}
 *   </div>
 * )
 * ```
 */
export function useInfiniteMaterials(options: UseInfiniteMaterialsOptions = {}) {
  const { articleId, type, nameFilter, pageSize = 20, enabled = true } = options

  // 保存上一次的过滤参数，用于检测变化
  const prevArticleIdRef = useRef<number | undefined>(articleId)
  const prevTypeRef = useRef<MaterialType | undefined>(type)
  const prevNameFilterRef = useRef<string | undefined>(nameFilter)

  // ==================== 数据获取函数 ====================

  const fetchMaterials = useCallback(
    async (page: number, pageSize: number) => {
      const result = await materialsClient.getMaterials({
        page,
        page_size: pageSize,
        article_id: articleId,
        type,
        name: nameFilter,
      })

      if ("error" in result) {
        return { error: result.error }
      }

      return {
        list: result.list,
        total: result.total,
      }
    },
    [articleId, type, nameFilter]
  )

  // ==================== 使用核心无限滚动 Hook ====================

  const infiniteScroll = useInfiniteScroll<Material>({
    fetchFn: fetchMaterials,
    pageSize,
    enabled,
  })
  const { reset } = infiniteScroll

  // ==================== 参数变化时重置 ====================

  useEffect(() => {
    // 检测过滤参数是否发生变化
    const articleIdChanged = prevArticleIdRef.current !== articleId
    const typeChanged = prevTypeRef.current !== type
    const nameFilterChanged = prevNameFilterRef.current !== nameFilter

    if (articleIdChanged || typeChanged || nameFilterChanged) {
      // 更新 ref
      prevArticleIdRef.current = articleId
      prevTypeRef.current = type
      prevNameFilterRef.current = nameFilter

      // 如果参数发生变化，重置列表
      reset()
    }
  }, [articleId, type, nameFilter, reset]) // 只依赖 reset 函数，避免频繁重置

  // ==================== 返回值 ====================

  return {
    ...infiniteScroll,
    materials: infiniteScroll.items,
  }
}
