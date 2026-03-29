"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialSearchBar } from "@/components/materials/material-search-bar"
import { MaterialLogTable } from "@/components/materials/material-log-table"

export function MaterialSearchTab() {
  const { t } = useTranslation()

  const {
    materialLogs,
    searching,
    pagination,
    fetchSearchLogs,
    handleSearch,
    updatePagination,
  } = useMaterials()

  // 搜索栏状态
  const [activeSearchTab, setActiveSearchTab] = useState("Info")
  const [searchQuery, setSearchQuery] = useState("")

  // 日志筛选状态
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all")
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all")

  // 初始加载搜索日志
  useEffect(() => {
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }, [fetchSearchLogs, logTypeFilter, logStatusFilter])

  const onSearch = async () => {
    const success = await handleSearch(searchQuery, activeSearchTab)
    if (success) {
      setSearchQuery("")
    }
  }

  const handleLogsPageChange = (page: number) => {
    updatePagination('logs', { page })
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }

  const handleLogsPageSizeChange = (pageSize: number) => {
    updatePagination('logs', { pageSize, page: 1 })
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 搜索栏 */}
      <div className="shrink-0">
        <MaterialSearchBar
          activeSearchTab={activeSearchTab}
          setActiveSearchTab={setActiveSearchTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searching={searching}
          onSearch={onSearch}
          t={t}
        />
      </div>

      {/* 生成记录 */}
      <div className="flex-1 min-h-0">
        <MaterialLogTable
          materialLogs={materialLogs}
          logTypeFilter={logTypeFilter}
          setLogTypeFilter={setLogTypeFilter}
          logStatusFilter={logStatusFilter}
          setLogStatusFilter={setLogStatusFilter}
          pagination={pagination.logs}
          onPageChange={handleLogsPageChange}
          onPageSizeChange={handleLogsPageSizeChange}
          t={t}
        />
      </div>
    </div>
  )
}
