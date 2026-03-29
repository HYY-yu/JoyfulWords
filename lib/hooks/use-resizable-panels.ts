"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface PanelConstraints {
  minWidth: number
  maxWidth: number
}

interface UseResizablePanelsOptions {
  storageKey: string
  defaultLeftWidth: number
  defaultRightWidth: number
  leftConstraints: PanelConstraints
  rightConstraints: PanelConstraints
  centerMinWidth: number
}

interface ResizablePanelsReturn {
  leftWidth: number
  rightWidth: number
  centerWidth: number
  leftCollapsed: boolean
  rightCollapsed: boolean
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  handleLeftDragStart: (e: React.MouseEvent) => void
  handleRightDragStart: (e: React.MouseEvent) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useResizablePanels(options: UseResizablePanelsOptions): ResizablePanelsReturn {
  const {
    storageKey,
    defaultLeftWidth,
    defaultRightWidth,
    leftConstraints,
    rightConstraints,
    centerMinWidth,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)

  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === "undefined") return defaultLeftWidth
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.leftWidth ?? defaultLeftWidth
      } catch { return defaultLeftWidth }
    }
    return defaultLeftWidth
  })

  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window === "undefined") return defaultRightWidth
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.rightWidth ?? defaultRightWidth
      } catch { return defaultRightWidth }
    }
    return defaultRightWidth
  })

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ leftWidth, rightWidth }))
  }, [storageKey, leftWidth, rightWidth])

  const centerWidth = 100 - (leftCollapsed ? 0 : leftWidth) - (rightCollapsed ? 0 : rightWidth)

  const toggleLeftPanel = useCallback(() => setLeftCollapsed(prev => !prev), [])
  const toggleRightPanel = useCallback(() => setRightCollapsed(prev => !prev), [])

  const createDragHandler = useCallback((side: "left" | "right") => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const relativeX = moveEvent.clientX - containerRect.left
        const percentage = (relativeX / containerWidth) * 100

        if (side === "left") {
          const minPct = (leftConstraints.minWidth / containerWidth) * 100
          const maxPct = (leftConstraints.maxWidth / containerWidth) * 100
          const centerMinPct = (centerMinWidth / containerWidth) * 100
          const maxAllowed = 100 - (rightCollapsed ? 0 : rightWidth) - centerMinPct
          const newWidth = Math.max(minPct, Math.min(maxPct, Math.min(maxAllowed, percentage)))
          setLeftWidth(newWidth)
        } else {
          const rightPct = 100 - (relativeX / containerWidth) * 100
          const minPct = (rightConstraints.minWidth / containerWidth) * 100
          const maxPct = (rightConstraints.maxWidth / containerWidth) * 100
          const centerMinPct = (centerMinWidth / containerWidth) * 100
          const maxAllowed = 100 - (leftCollapsed ? 0 : leftWidth) - centerMinPct
          const newWidth = Math.max(minPct, Math.min(maxPct, Math.min(maxAllowed, rightPct)))
          setRightWidth(newWidth)
        }
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }
  }, [leftConstraints, rightConstraints, centerMinWidth, leftWidth, rightWidth, leftCollapsed, rightCollapsed])

  return {
    leftWidth,
    rightWidth,
    centerWidth,
    leftCollapsed,
    rightCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    handleLeftDragStart: createDragHandler("left"),
    handleRightDragStart: createDragHandler("right"),
    containerRef,
  }
}
