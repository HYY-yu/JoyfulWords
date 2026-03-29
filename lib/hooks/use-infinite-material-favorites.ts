"use client"

import { useCallback } from "react"
import { materialsClient } from "@/lib/api/materials/client"
import type { MaterialFavorite } from "@/lib/api/materials/types"
import { useInfiniteScroll } from "./use-infinite-scroll"

export interface UseInfiniteMaterialFavoritesOptions {
  pageSize?: number
  enabled?: boolean
}

export function useInfiniteMaterialFavorites(options: UseInfiniteMaterialFavoritesOptions = {}) {
  const { pageSize = 20, enabled = true } = options

  const fetchFavorites = useCallback(
    async (page: number, pageSize: number) => {
      const result = await materialsClient.getFavorites({
        page,
        page_size: pageSize,
      })

      if ("error" in result) {
        return { error: result.error }
      }

      return {
        list: result.list,
        total: result.total,
      }
    },
    []
  )

  const infiniteScroll = useInfiniteScroll<MaterialFavorite>({
    fetchFn: fetchFavorites,
    pageSize,
    enabled,
  })

  return {
    ...infiniteScroll,
    favorites: infiniteScroll.items,
  }
}
