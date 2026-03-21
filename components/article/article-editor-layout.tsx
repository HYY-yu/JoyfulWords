"use client"

import { ReactNode } from "react"
import { useResizablePanels } from "@/lib/hooks/use-resizable-panels"

interface ArticleEditorLayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
  topBar: ReactNode
}

export function ArticleEditorLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
}: ArticleEditorLayoutProps) {
  const {
    leftWidth,
    rightWidth,
    leftCollapsed,
    rightCollapsed,
    handleLeftDragStart,
    handleRightDragStart,
    containerRef,
  } = useResizablePanels({
    storageKey: "joyfulwords-editor-panel-widths",
    defaultLeftWidth: 22,
    defaultRightWidth: 24,
    leftConstraints: { minWidth: 180, maxWidth: 400 },
    rightConstraints: { minWidth: 200, maxWidth: 420 },
    centerMinWidth: 400,
  })

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {topBar}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {!leftCollapsed && (
          <>
            <div
              className="flex flex-col overflow-hidden border-r bg-muted/30"
              style={{ width: `${leftWidth}%` }}
            >
              {leftPanel}
            </div>
            <div
              className="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative flex-shrink-0 group"
              onMouseDown={handleLeftDragStart}
            >
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-border rounded-full -translate-y-1/2 group-hover:bg-primary/40" />
            </div>
          </>
        )}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {centerPanel}
        </div>
        {!rightCollapsed && (
          <>
            <div
              className="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative flex-shrink-0 group"
              onMouseDown={handleRightDragStart}
            >
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-border rounded-full -translate-y-1/2 group-hover:bg-primary/40" />
            </div>
            <div
              className="flex flex-col overflow-hidden border-l bg-muted/30"
              style={{ width: `${rightWidth}%` }}
            >
              {rightPanel}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
