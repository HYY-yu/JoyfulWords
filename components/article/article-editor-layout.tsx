"use client"

import type { CSSProperties, ReactNode } from "react"
import { useResizablePanels } from "@/lib/hooks/use-resizable-panels"
import { useJoyfulTheme, type JoyfulTheme } from "@/lib/theme/joyful-theme"

interface ArticleEditorLayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
  topBar: ReactNode
  theme?: JoyfulTheme
}

export function ArticleEditorLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
  theme: themeOverride,
}: ArticleEditorLayoutProps) {
  const { theme } = useJoyfulTheme()
  const activeTheme = themeOverride ?? theme
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
    "jw-editor-panel overflow-hidden rounded-lg backdrop-blur-xl"

  const leftPanelStyle = {
    ["--left-panel-width" as string]: `${leftWidth}%`,
  } as CSSProperties

  const rightPanelStyle = {
    ["--right-panel-width" as string]: `${rightWidth}%`,
  } as CSSProperties

  return (
    <div className="jw-editor-workspace flex h-screen flex-col overflow-hidden" data-editor-theme={activeTheme}>
      <div className="jw-editor-topbar-shell shrink-0 backdrop-blur-xl">
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
                <div className="jw-editor-panel-inner flex h-full min-h-0 flex-col overflow-hidden">
                  {leftPanel}
                </div>
              </div>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleLeftDragStart}
              >
                <div className={`h-16 w-[2px] rounded-full transition-colors duration-150 ${leftAtMin ? "bg-destructive/50" : "jw-resize-handle"}`} />
                {leftAtMin && (
                  <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-[calc(50%+24px)] whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-xs text-background shadow-md">
                    已到最小宽度
                  </div>
                )}
              </div>
            </>
          )}

          <div className={`min-h-0 min-w-0 w-full flex-[1.2] lg:flex-1 ${panelShellClassName}`}>
            <div className="jw-editor-panel-inner flex h-full min-h-0 flex-col overflow-hidden">
              {centerPanel}
            </div>
          </div>

          {!rightCollapsed && (
            <>
              <div
                className="group relative hidden w-2 shrink-0 cursor-col-resize lg:flex lg:items-center lg:justify-center"
                onMouseDown={handleRightDragStart}
              >
                <div className={`h-16 w-[2px] rounded-full transition-colors duration-150 ${rightAtMin ? "bg-destructive/50" : "jw-resize-handle"}`} />
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
                <div className="jw-editor-panel-inner flex h-full min-h-0 flex-col overflow-hidden">
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
