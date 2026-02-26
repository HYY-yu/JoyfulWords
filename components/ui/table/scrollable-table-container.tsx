"use client"

import { ReactNode } from "react"

interface ScrollableTableContainerProps {
  filterBar: ReactNode
  table: ReactNode
  pagination: ReactNode
  heightOffset?: number  // 默认 280px (Header 100px + TabBar 60px + Padding 64px + 间距 56px)
}

export function ScrollableTableContainer({
  filterBar,
  table,
  pagination,
  heightOffset = 280,
}: ScrollableTableContainerProps) {
  return (
    <div
      className="flex flex-col overflow-hidden animate-in fade-in duration-300"
      style={{ maxHeight: `calc(100vh - ${heightOffset}px)` }}
    >
      {/* Filter Bar - 固定顶部 */}
      <div className="shrink-0 pb-4">
        {filterBar}
      </div>

      {/* Table - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto border border-border rounded-lg min-h-0">
        {table}
      </div>

      {/* Pagination - 固定底部 */}
      {pagination && (
        <div className="shrink-0 pt-4">
          {pagination}
        </div>
      )}
    </div>
  )
}
