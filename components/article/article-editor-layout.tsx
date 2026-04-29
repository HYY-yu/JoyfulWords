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
    defaultLeftWidth: 24,
    defaultRightWidth: 25,
    leftConstraints: { minWidth: 320, maxWidth: 440 },
    rightConstraints: { minWidth: 320, maxWidth: 460 },
    centerMinWidth: 560,
  })

  const panelShellClassName =
    "jw-editor-panel overflow-hidden rounded-lg bg-[#fffdf7]/90 shadow-[0_20px_54px_-44px_rgba(84,64,38,0.34)] ring-1 ring-[#d8cbb8]/45 backdrop-blur-xl"

  const leftPanelStyle = {
    ["--left-panel-width" as string]: `${leftWidth}%`,
  } as CSSProperties

  const rightPanelStyle = {
    ["--right-panel-width" as string]: `${rightWidth}%`,
  } as CSSProperties

  return (
    <div className="jw-editor-workspace flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e8ddcc]/55 bg-[#fffdf7]/92 backdrop-blur-xl">
        {topBar}
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex h-full min-h-0 flex-col gap-3 p-3 lg:flex-row lg:items-stretch"
        >
          {!leftCollapsed && (
            <>
              <div
                className={`min-h-0 w-full flex-1 lg:w-[var(--left-panel-width)] lg:flex-none ${panelShellClassName}`}
                style={leftPanelStyle}
              >
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fffdf7]/92">
                  {leftPanel}
                </div>
              </div>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleLeftDragStart}
              >
                <div className={`h-16 w-[2px] rounded-full transition-colors duration-150 ${leftAtMin ? "bg-destructive/50" : "bg-stone-300/50 group-hover:bg-primary/35 group-active:bg-primary/50"}`} />
                {leftAtMin && (
                  <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-[calc(50%+24px)] whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-xs text-background shadow-md">
                    已到最小宽度
                  </div>
                )}
              </div>
            </>
          )}

          <div className={`min-h-0 min-w-0 w-full flex-[1.2] lg:flex-1 ${panelShellClassName}`}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fffdf7]/94">
              {centerPanel}
            </div>
          </div>

          {!rightCollapsed && (
            <>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleRightDragStart}
              >
                <div className={`h-16 w-[2px] rounded-full transition-colors duration-150 ${rightAtMin ? "bg-destructive/50" : "bg-stone-300/50 group-hover:bg-primary/35 group-active:bg-primary/50"}`} />
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
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fffdf7]/92">
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
