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
    leftAtMin,
    rightAtMin,
    handleLeftDragStart,
    handleRightDragStart,
    containerRef,
  } = useResizablePanels({
    storageKey: "joyfulwords-editor-panel-widths",
    defaultLeftWidth: 22,
    defaultRightWidth: 24,
    leftConstraints: { minWidth: 320, maxWidth: 400 },
    rightConstraints: { minWidth: 320, maxWidth: 480 },
    centerMinWidth: 400,
  })

  const panelShellClassName =
    "overflow-hidden rounded-[7px] border border-border/70 bg-background/95 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.24)] ring-1 ring-black/[0.02] backdrop-blur-sm"

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
          className="flex h-full min-h-0 flex-col gap-1.5 p-1.5 lg:flex-row lg:items-stretch lg:gap-px"
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
                <div className={`h-16 w-[3px] rounded-full transition-colors duration-150 ${leftAtMin ? "bg-destructive/60" : "bg-border/90 group-hover:bg-primary/35 group-active:bg-primary/45"}`} />
                {leftAtMin && (
                  <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-[calc(50%+24px)] whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-xs text-background shadow-md">
                    已到最小宽度
                  </div>
                )}
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
                <div className={`h-16 w-[3px] rounded-full transition-colors duration-150 ${rightAtMin ? "bg-destructive/60" : "bg-border/90 group-hover:bg-primary/35 group-active:bg-primary/45"}`} />
                {rightAtMin && (
                  <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-[calc(50%+24px)] whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-xs text-background shadow-md">
                    已到最小宽度
                  </div>
                )}
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
