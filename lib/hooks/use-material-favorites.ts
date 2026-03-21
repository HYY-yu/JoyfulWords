"use client"

import { useState, useCallback, useEffect } from "react"

interface FavoriteGroup {
  id: string
  name: string
  materialIds: number[]
}

interface UseMaterialFavoritesReturn {
  groups: FavoriteGroup[]
  createGroup: (name: string) => void
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  addToGroup: (groupId: string, materialId: number) => void
  removeFromGroup: (groupId: string, materialId: number) => void
  isInGroup: (groupId: string, materialId: number) => boolean
}

const STORAGE_KEY = "joyfulwords-material-favorites"

export function useMaterialFavorites(): UseMaterialFavoritesReturn {
  const [groups, setGroups] = useState<FavoriteGroup[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  const createGroup = useCallback((name: string) => {
    setGroups(prev => [...prev, { id: crypto.randomUUID(), name, materialIds: [] }])
  }, [])

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  const renameGroup = useCallback((groupId: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g))
  }, [])

  const addToGroup = useCallback((groupId: string, materialId: number) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId && !g.materialIds.includes(materialId)
        ? { ...g, materialIds: [...g.materialIds, materialId] }
        : g
    ))
  }, [])

  const removeFromGroup = useCallback((groupId: string, materialId: number) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, materialIds: g.materialIds.filter(id => id !== materialId) }
        : g
    ))
  }, [])

  const isInGroup = useCallback((groupId: string, materialId: number) => {
    return groups.find(g => g.id === groupId)?.materialIds.includes(materialId) ?? false
  }, [groups])

  return { groups, createGroup, deleteGroup, renameGroup, addToGroup, removeFromGroup, isInGroup }
}
