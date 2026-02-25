"use client"

/**
 * 风格模式演示组件
 * 用于独立测试和展示风格模式功能
 */

import { StyleMode } from "./style-mode"

export function StyleModeDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* 模拟主应用头部 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">图片生成</h2>
              <p className="text-sm text-muted-foreground mt-0.5">AI 驱动的图片生成工具</p>
            </div>
          </div>
        </div>

        {/* 模拟模式标签 */}
        <div className="px-8 border-t border-border/50">
          <div className="flex gap-1">
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              创作模式
            </button>
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px text-primary border-primary bg-primary/5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              风格模式
            </button>
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              反向模式
            </button>
          </div>
        </div>
      </header>

      {/* 风格模式组件 */}
      <StyleMode />
    </div>
  )
}
