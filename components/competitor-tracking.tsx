"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useCompetitors } from "@/lib/hooks/use-competitors"
import { PLATFORM_OPTIONS } from "@/lib/api/competitors/enums"
import type { SocialPlatform, UrlType } from "@/lib/api/competitors/types"
import { CompetitorSearchBar } from "@/components/competitors/competitor-search-bar"
import { CompetitorTasksTable } from "@/components/competitors/competitor-tasks-table"
import { CompetitorResultsTable } from "@/components/competitors/competitor-results-table"
import { CompetitorLogsTable } from "@/components/competitors/competitor-logs-table"
import { CompetitorDialogs } from "@/components/competitors/competitor-dialogs"

export function CompetitorTracking() {
  const { t } = useTranslation()
  const {
    // 数据状态
    tasks,
    results,
    crawlLogs,
    loading,
    searching,

    // 分页状态
    pagination,

    // UI 状态
    editingIntervalTaskId,
    deleteTaskId,
    scheduleConfig,

    // Setters
    setEditingIntervalTaskId,
    setDeleteTaskId,
    setScheduleConfig,

    // 数据获取
    fetchTasks,
    fetchResults,
    fetchCrawlLogs,

    // 抓取功能
    handleFetch,
    handleSchedule,

    // 任务管理
    toggleTaskStatus,
    handleDeleteTask,
    handleUpdateInterval,
    openEditIntervalDialog,

    // 分页
    handlePageChange,
    updatePagination,
  } = useCompetitors()

  // 本地状态
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>("LinkedIn")
  const [profileUrl, setProfileUrl] = useState("")
  const [urlType, setUrlType] = useState<UrlType>("profile")
  const [activeDataTab, setActiveDataTab] = useState<"tasks" | "results" | "logs">("tasks")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  // 当前平台配置
  const currentPlatform = PLATFORM_OPTIONS.find((p) => p.value === activePlatform)!

  // ==================== 数据获取 ====================

  // 组件初始加载时获取数据
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 监听 tab 切换，自动刷新数据
  useEffect(() => {
    if (activeDataTab === "tasks") {
      fetchTasks()
    } else if (activeDataTab === "results") {
      fetchResults()
    } else if (activeDataTab === "logs") {
      fetchCrawlLogs()
    }
  }, [activeDataTab, fetchTasks, fetchResults, fetchCrawlLogs])

  // ==================== 事件处理 ====================

  // 立即抓取处理
  const handleSearchClick = async () => {
    if (!profileUrl.trim()) return

    const success = await handleFetch(activePlatform, profileUrl, urlType, 3)
    if (success) {
      setActiveDataTab("results")
    }
  }

  // 定时抓取处理
  const handleScheduleClick = async () => {
    if (!profileUrl.trim()) return

    const success = await handleSchedule(activePlatform, profileUrl, scheduleConfig)
    if (success) {
      setShowScheduleDialog(false)
      setActiveDataTab("tasks")
      // 重置配置
      setScheduleConfig({
        mode: "simple",
        simpleInterval: 1,
        simpleUnit: "days",
        cronExpression: "0 0 * * *",
      })
    }
  }

  // 取消定时配置对话框
  const handleScheduleCancel = () => {
    setShowScheduleDialog(false)
    setEditingIntervalTaskId(null)
    // 重置配置
    setScheduleConfig({
      mode: "simple",
      simpleInterval: 1,
      simpleUnit: "days",
      cronExpression: "0 0 * * *",
    })
  }

  // ==================== 分页处理 ====================

  const handleTasksPageChange = (page: number) => {
    handlePageChange("tasks", page)
  }

  const handleTasksPageSizeChange = (pageSize: number) => {
    updatePagination("tasks", { pageSize, page: 1 })
  }

  const handleResultsPageChange = (page: number) => {
    handlePageChange("results", page)
  }

  const handleResultsPageSizeChange = (pageSize: number) => {
    updatePagination("results", { pageSize, page: 1 })
  }

  const handleLogsPageChange = (page: number) => {
    handlePageChange("logs", page)
  }

  const handleLogsPageSizeChange = (pageSize: number) => {
    updatePagination("logs", { pageSize, page: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <CompetitorSearchBar
        activePlatform={activePlatform}
        setActivePlatform={setActivePlatform}
        profileUrl={profileUrl}
        setProfileUrl={setProfileUrl}
        urlType={urlType}
        setUrlType={setUrlType}
        searching={searching}
        onFetch={handleSearchClick}
        onSchedule={() => setShowScheduleDialog(true)}
        t={t}
      />

      {/* Divider */}
      <div className="border-t border-dashed border-border/60" />

      {/* Data Tables */}
      <div className="space-y-4">
        {/* Table Tabs */}
        <div className="flex gap-2 border-b border-border/50">
          <button
            onClick={() => setActiveDataTab("tasks")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "tasks"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {t("contentWriting.competitors.tabs.tasks")}
          </button>
          <button
            onClick={() => setActiveDataTab("results")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "results"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {t("contentWriting.competitors.tabs.results")}
          </button>
          <button
            onClick={() => setActiveDataTab("logs")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "logs"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {t("contentWriting.competitors.tabs.logs")}
          </button>
        </div>

        {/* Conditional Table Rendering */}
        {activeDataTab === "tasks" && (
          <CompetitorTasksTable
            tasks={tasks}
            loading={loading}
            pagination={pagination.tasks}
            onPageChange={handleTasksPageChange}
            onPageSizeChange={handleTasksPageSizeChange}
            onToggleStatus={toggleTaskStatus}
            onDelete={(taskId) => setDeleteTaskId(taskId)}
            onEditInterval={openEditIntervalDialog}
            t={t}
          />
        )}

        {activeDataTab === "results" && (
          <CompetitorResultsTable
            results={results}
            loading={loading}
            pagination={pagination.results}
            onPageChange={handleResultsPageChange}
            onPageSizeChange={handleResultsPageSizeChange}
            t={t}
          />
        )}

        {activeDataTab === "logs" && (
          <CompetitorLogsTable
            logs={crawlLogs}
            loading={loading}
            pagination={pagination.logs}
            onPageChange={handleLogsPageChange}
            onPageSizeChange={handleLogsPageSizeChange}
            t={t}
          />
        )}
      </div>

      {/* Dialogs */}
      <CompetitorDialogs
        showScheduleDialog={showScheduleDialog}
        setShowScheduleDialog={setShowScheduleDialog}
        editingIntervalTaskId={editingIntervalTaskId}
        scheduleConfig={scheduleConfig}
        setScheduleConfig={setScheduleConfig}
        onScheduleSubmit={editingIntervalTaskId ? () => handleUpdateInterval(editingIntervalTaskId, scheduleConfig) : handleScheduleClick}
        onScheduleCancel={handleScheduleCancel}
        deleteTaskId={deleteTaskId}
        setDeleteTaskId={setDeleteTaskId}
        onDeleteConfirm={handleDeleteTask}
        loading={loading}
        profileUrl={profileUrl}
        currentPlatform={currentPlatform}
        t={t}
      />
    </div>
  )
}
