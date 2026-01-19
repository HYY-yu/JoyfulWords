"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { SearchIcon, ClockIcon, ExternalLinkIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { useCompetitors } from "@/lib/hooks/use-competitors"
import { PLATFORM_OPTIONS, CRAWL_LOG_STATUS_COLOR_CONFIG } from "@/lib/api/competitors/enums"
import { formatApiTime } from "@/lib/api/competitors/utils"
import type { SocialPlatform, UrlType, ScheduleConfig } from "@/lib/api/competitors/types"

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

  // 计算总页数
  const getTotalPages = (total: number, pageSize: number) => {
    return Math.ceil(total / pageSize)
  }

  // 渲染分页组件
  const renderPagination = (type: "tasks" | "results" | "logs") => {
    const { page, pageSize, total } = pagination[type]
    const totalPages = getTotalPages(total, pageSize)

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-muted-foreground">
          {t("contentWriting.competitors.pagination.totalInfo", {
            current: page,
            total: totalPages,
            items: total,
          })}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && handlePageChange(type, page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {/* 显示页码 */}
            {page > 2 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(type, 1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {page > 3 && <PaginationEllipsis />}

            {page > 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(type, page - 1)} className="cursor-pointer">
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink isActive className="cursor-default">
                {page}
              </PaginationLink>
            </PaginationItem>

            {page < totalPages && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(type, page + 1)} className="cursor-pointer">
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {page < totalPages - 2 && <PaginationEllipsis />}

            {page < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(type, totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && handlePageChange(type, page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar with Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="space-y-4">
          {/* Platform Tabs */}
          <div className="flex gap-2">
            {PLATFORM_OPTIONS.map((platform) => (
              <button
                key={platform.value}
                onClick={() => {
                  setActivePlatform(platform.value as SocialPlatform)
                  setProfileUrl("")
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    activePlatform === platform.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }
                `}
              >
                {platform.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="space-y-3">
            {/* URL Type Selection */}
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-foreground">{t("contentWriting.competitors.urlType.label")}:</span>
              <RadioGroup value={urlType} onValueChange={(value) => setUrlType(value as UrlType)} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profile" id="profile" />
                  <Label htmlFor="profile" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.urlType.profile")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" />
                  <Label htmlFor="post" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.urlType.post")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder={currentPlatform.placeholder}
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                  className="h-11"
                />
              </div>
              <Button onClick={handleSearchClick} disabled={!profileUrl.trim() || searching} className="h-11 px-6">
                <SearchIcon className="w-4 h-4 mr-2" />
                {t("contentWriting.competitors.crawlBtn")}
              </Button>
              <Button
                onClick={() => setShowScheduleDialog(true)}
                disabled={!profileUrl.trim() || urlType !== "profile"}
                variant="outline"
                className="h-11 px-6"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                {t("contentWriting.competitors.timerCrawlBtn")}
              </Button>
            </div>

            {/* Loading State */}
            {searching && (
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-md animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-primary font-medium">{t("contentWriting.competitors.aiSearching")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

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

        {/* Scheduled Tasks Table */}
        {activeDataTab === "tasks" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.platform")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.url")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.interval")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.lastRun")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.nextRun")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.status")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        加载中...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t("contentWriting.competitors.table.noTasks")}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {task.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">{task.url}</td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            onClick={() => openEditIntervalDialog(task)}
                            className="text-primary hover:underline cursor-pointer text-left"
                          >
                            {task.interval_desc}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {task.last_run_at ? formatApiTime(task.last_run_at) : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {task.next_run_at ? formatApiTime(task.next_run_at) : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            onClick={() => toggleTaskStatus(task.id, task.status)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${
                              task.status === "running"
                                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                            }`}
                          >
                            {task.status === "running" ? t("contentWriting.competitors.table.running") : t("contentWriting.competitors.table.paused")}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTaskId(task.id)}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination("tasks")}
          </div>
        )}

        {/* Crawl Logs Table */}
        {activeDataTab === "logs" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.logs.table.id")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.logs.table.snapshotId")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.logs.table.status")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.logs.table.createdAt")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.logs.table.updatedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        加载中...
                      </td>
                    </tr>
                  ) : crawlLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        {t("contentWriting.competitors.logs.table.noData")}
                      </td>
                    </tr>
                  ) : (
                    crawlLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm font-medium">{log.id}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate" title={log.snapshot_id}>
                          {log.snapshot_id}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              CRAWL_LOG_STATUS_COLOR_CONFIG[log.status].bg
                            } ${CRAWL_LOG_STATUS_COLOR_CONFIG[log.status].text}`}
                          >
                            {t(`contentWriting.competitors.logs.status.${log.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatApiTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatApiTime(log.updated_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination("logs")}
          </div>
        )}

        {/* Results Table */}
        {activeDataTab === "results" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.platform")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.content")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.link")} (Source)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Comments</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        加载中...
                      </td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        {t("contentWriting.competitors.table.noResults")}
                      </td>
                    </tr>
                  ) : (
                    results.map((post) => (
                      <tr key={post.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {post.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-md">
                          <div className="line-clamp-2">{post.content}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline max-w-xs truncate"
                          >
                            <span className="truncate">{post.url}</span>
                            <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{post.like_count}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{post.comment_count}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatApiTime(post.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination("results")}
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog
        open={showScheduleDialog || !!editingIntervalTaskId}
        onOpenChange={(open) => {
          if (!open) {
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
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIntervalTaskId ? t("contentWriting.competitors.dialog.editInterval") : t("contentWriting.competitors.dialog.configTask")}</DialogTitle>
            <DialogDescription>
              {editingIntervalTaskId ? t("contentWriting.competitors.dialog.editDesc") : t("contentWriting.competitors.dialog.configDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingIntervalTaskId && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.platform")}</label>
                  <Input value={currentPlatform.label} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.url")}</label>
                  <Input value={profileUrl} disabled className="bg-muted" />
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.interval")}</label>
              <RadioGroup
                value={scheduleConfig.mode}
                onValueChange={(value) => setScheduleConfig({ ...scheduleConfig, mode: value as "simple" | "custom" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.dialog.modeSimple")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.dialog.modeCron")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {scheduleConfig.mode === "simple" && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">{t("contentWriting.competitors.dialog.intervalNum")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={scheduleConfig.simpleInterval}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, simpleInterval: Number.parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">{t("contentWriting.competitors.dialog.unit")}</label>
                  <Select
                    value={scheduleConfig.simpleUnit}
                    onValueChange={(value) => setScheduleConfig({ ...scheduleConfig, simpleUnit: value as "hours" | "days" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">{t("contentWriting.competitors.dialog.unitHours")}</SelectItem>
                      <SelectItem value="days">{t("contentWriting.competitors.dialog.unitDays")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {scheduleConfig.mode === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cron 表达式</label>
                <Input
                  placeholder="0 0 * * *"
                  value={scheduleConfig.cronExpression}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, cronExpression: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false)
                setEditingIntervalTaskId(null)
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={editingIntervalTaskId ? () => handleUpdateInterval(editingIntervalTaskId, scheduleConfig) : handleScheduleClick}>
              {t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contentWriting.competitors.dialog.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contentWriting.competitors.dialog.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
