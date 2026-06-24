"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { materialsClient } from "@/lib/api/materials/client"
import type { Material, MaterialFavorite } from "@/lib/api/materials/types"
import { useInfiniteScroll } from "./use-infinite-scroll"

export type MaterialPickerScope = "all" | "article" | "favorites"

export interface UseInfiniteMaterialPickerOptions {
  articleId?: number
  scope?: MaterialPickerScope
  nameFilter?: string
  pageSize?: number
  enabled?: boolean
}

const getMaterialKey = (material: Material) => material.id

function favoriteToMaterial(favorite: MaterialFavorite): Material {
  return {
    id: favorite.material_id,
    user_id: favorite.material_user_id,
    material_logs_id: favorite.material_logs_id,
    article_id: favorite.article_id,
    is_favorite: true,
    favorite_id: favorite.id,
    title: favorite.title,
    material_type: favorite.material_type,
    source_url: favorite.source_url,
    content: favorite.content,
    parse_task_id: favorite.parse_task_id,
    parse_status: favorite.parse_status,
    parse_failed_code: favorite.parse_failed_code,
    markdown_url: favorite.markdown_url,
    created_at: favorite.created_at,
  }
}

export function useInfiniteMaterialPicker(options: UseInfiniteMaterialPickerOptions = {}) {
  const {
    articleId,
    scope = "article",
    nameFilter,
    pageSize = 20,
    enabled = true,
  } = options

  const prevArticleIdRef = useRef<number | undefined>(articleId)
  const prevScopeRef = useRef<MaterialPickerScope>(scope)
  const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)
  const prevNameFilterRef = useRef<string | undefined>(debouncedNameFilter)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedNameFilter(nameFilter)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [nameFilter])

  const fetchMaterials = useCallback(
    async (page: number, pageSize: number) => {
      if (scope === "article" && !articleId) {
        return { list: [], total: 0 }
      }

      if (scope === "favorites") {
        const result = await materialsClient.getFavorites({
          page,
          page_size: pageSize,
          name: debouncedNameFilter,
        })

        if ("error" in result) {
          return { error: result.error }
        }

        return {
          list: result.list.map(favoriteToMaterial),
          total: result.total,
        }
      }

      const result = await materialsClient.getMaterials({
        page,
        page_size: pageSize,
        article_id: scope === "article" ? articleId : undefined,
        name: debouncedNameFilter,
      })

      if ("error" in result) {
        return { error: result.error }
      }

      return {
        list: result.list,
        total: result.total,
      }
    },
    [articleId, scope, debouncedNameFilter]
  )

  const infiniteScroll = useInfiniteScroll<Material>({
    fetchFn: fetchMaterials,
    pageSize,
    enabled,
    getItemKey: getMaterialKey,
  })
  const { reset } = infiniteScroll

  useEffect(() => {
    const articleIdChanged = prevArticleIdRef.current !== articleId
    const scopeChanged = prevScopeRef.current !== scope
    const nameFilterChanged = prevNameFilterRef.current !== debouncedNameFilter

    if (articleIdChanged || scopeChanged || nameFilterChanged) {
      prevArticleIdRef.current = articleId
      prevScopeRef.current = scope
      prevNameFilterRef.current = debouncedNameFilter
      reset()
    }
  }, [articleId, scope, debouncedNameFilter, reset])

  return {
    ...infiniteScroll,
    materials: infiniteScroll.items,
  }
}
