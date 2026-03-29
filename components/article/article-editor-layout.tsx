"use client"

import type { CSSProperties, ReactNode } from "react"
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
    leftConstraints: { minWidth: 160, maxWidth: 400 },
    rightConstraints: { minWidth: 200, maxWidth: 420 },
    centerMinWidth: 400,
  })

  const panelShellClassName =
    "overflow-hidden rounded-[14px] border border-border/70 bg-background/95 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.24)] ring-1 ring-black/[0.02] backdrop-blur-sm"

  const leftPanelStyle = {
    ["--left-panel-width" as string]: `${leftWidth}%`,
  } as CSSProperties

  const rightPanelStyle = {
    ["--right-panel-width" as string]: `${rightWidth}%`,
  } as CSSProperties

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col bg-muted/60">
      <div className="shrink-0 bg-background/90 backdrop-blur-sm">
        {topBar}
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex h-full min-h-0 flex-col gap-2 px-2 py-2 sm:px-3 sm:py-3 lg:flex-row lg:items-stretch lg:gap-1 xl:gap-1.5 xl:px-4 xl:py-4"
        >
          {!leftCollapsed && (
            <>
              <div
                className={`min-h-0 w-full flex-1 lg:w-[var(--left-panel-width)] lg:flex-none ${panelShellClassName}`}
                style={leftPanelStyle}
              >
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/90">
                  {leftPanel}
                </div>
              </div>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleLeftDragStart}
              >
                <div className="h-16 w-[3px] rounded-full bg-border/90 transition-colors duration-150 group-hover:bg-primary/35 group-active:bg-primary/45" />
              </div>
            </>
          )}

          <div className={`min-h-0 min-w-0 w-full flex-[1.2] lg:flex-1 ${panelShellClassName}`}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/90">
              {centerPanel}
            </div>
          </div>

          {!rightCollapsed && (
            <>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleRightDragStart}
              >
                <div className="h-16 w-[3px] rounded-full bg-border/90 transition-colors duration-150 group-hover:bg-primary/35 group-active:bg-primary/45" />
              </div>
              <div
                className={`min-h-0 w-full flex-1 lg:w-[var(--right-panel-width)] lg:flex-none ${panelShellClassName}`}
                style={rightPanelStyle}
              >
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/90">
                  {rightPanel}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
