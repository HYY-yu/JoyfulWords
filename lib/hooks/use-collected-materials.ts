"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"

const STORAGE_KEY_PREFIX = "joyfulwords-collected-materials"

function getStorageKey(userId: number): string {
  return `${STORAGE_KEY_PREFIX}-${userId}`
}

function loadFromStorage(userId: number): Set<number> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return new Set()
    const ids: number[] = JSON.parse(raw)
    return new Set(ids)
  } catch {
    return new Set()
  }
}

function saveToStorage(userId: number, ids: Set<number>): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify([...ids]))
}

export interface UseCollectedMaterialsReturn {
  collectedIds: Set<number>
  collect: (id: number) => void
  uncollect: (id: number) => void
  isCollected: (id: number) => boolean
}

export function useCollectedMaterials(): UseCollectedMaterialsReturn {
  const { user } = useAuth()
  const [collectedIds, setCollectedIds] = useState<Set<number>>(new Set())

  // Load from localStorage when user is available
  useEffect(() => {
    if (user?.id) {
      setCollectedIds(loadFromStorage(user.id))
    }
  }, [user?.id])

  const collect = useCallback(
    (id: number) => {
      if (!user?.id) return
      setCollectedIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        saveToStorage(user.id, next)
        return next
      })
    },
    [user?.id]
  )

  const uncollect = useCallback(
    (id: number) => {
      if (!user?.id) return
      setCollectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        saveToStorage(user.id, next)
        return next
      })
    },
    [user?.id]
  )

  const isCollected = useCallback(
    (id: number) => collectedIds.has(id),
    [collectedIds]
  )

  return { collectedIds, collect, uncollect, isCollected }
}
