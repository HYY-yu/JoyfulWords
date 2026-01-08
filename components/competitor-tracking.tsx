"use client"

import { useState } from "react"
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

type Platform = "linkedin" | "facebook" | "x.com" | "reddit"

type Post = {
  id: string
  platform: Platform
  content: string
  url: string
  likes: number
  comments: number
  createdAt: string
  sourceUrl: string
}

type ScheduledTask = {
  id: string
  platform: Platform
  profileUrl: string
  interval: string
  lastRun: string
  nextRun: string
  status: "active" | "paused"
}

type ScheduleConfig = {
  mode: "simple" | "custom"
  simpleInterval: number
  simpleUnit: "hours" | "days"
  cronExpression: string
}

const platforms: { id: Platform; label: string; placeholder: string }[] = [
  { id: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/username" },
  { id: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/username" },
  { id: "x.com", label: "X.com", placeholder: "https://x.com/username" },
  { id: "reddit", label: "Reddit", placeholder: "https://www.reddit.com/user/username" },
]

type UrlType = "profile" | "post"

type CrawlLog = {
  id: string
  type: "profile" | "post"
  status: "doing" | "success" | "failed"
  created_at: string
  updated_at: string
}

export function CompetitorTracking() {
  const { t } = useTranslation()
  const [activePlatform, setActivePlatform] = useState<Platform>("linkedin")
  const [profileUrl, setProfileUrl] = useState("")
  const [urlType, setUrlType] = useState<UrlType>("profile")
  const [isSearching, setIsSearching] = useState(false)
  const [activeDataTab, setActiveDataTab] = useState<"scheduled" | "results" | "logs">("scheduled")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    mode: "simple",
    simpleInterval: 1,
    simpleUnit: "days",
    cronExpression: "0 0 * * *",
  })
  const [editingIntervalTaskId, setEditingIntervalTaskId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const STATUS_COLOR_CONFIG = {
    doing: { bg: "bg-blue-500/10", text: "text-blue-600" },
    success: { bg: "bg-green-500/10", text: "text-green-600" },
    failed: { bg: "bg-red-500/10", text: "text-red-600" },
  }

  const [crawlLogs, setCrawlLogs] = useState<CrawlLog[]>([
    {
      id: "log-1",
      type: "profile",
      status: "success",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 80000000).toISOString(),
    },
    {
      id: "log-2",
      type: "post",
      status: "doing",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "log-3",
      type: "profile",
      status: "failed",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7000000).toISOString(),
    },
  ])

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      platform: "linkedin",
      content: "Excited to announce our new AI-powered content creation tool...",
      url: "https://linkedin.com/post/123",
      likes: 245,
      comments: 38,
      createdAt: "2024-01-15 14:30",
      sourceUrl: "https://www.linkedin.com/in/competitor1",
    },
    {
      id: "2",
      platform: "linkedin",
      content: "5 tips for building better SaaS products in 2024...",
      url: "https://linkedin.com/post/124",
      likes: 189,
      comments: 22,
      createdAt: "2024-01-14 09:15",
      sourceUrl: "https://www.linkedin.com/in/competitor1",
    },
  ])

  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    {
      id: "1",
      platform: "linkedin",
      profileUrl: "https://www.linkedin.com/in/competitor1",
      interval: "每天",
      lastRun: "2024-01-15 08:00",
      nextRun: "2024-01-16 08:00",
      status: "active",
    },
    {
      id: "2",
      platform: "x.com",
      profileUrl: "https://x.com/competitor2",
      interval: "每小时",
      lastRun: "2024-01-15 14:00",
      nextRun: "2024-01-15 15:00",
      status: "active",
    },
  ])

  const currentPlatform = platforms.find((p) => p.id === activePlatform)!

  const handleSearch = async () => {
    if (!profileUrl.trim()) return

    setIsSearching(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Add mock results
    const newPosts: Post[] = Array.from({ length: 10 }, (_, i) => ({
      id: `new-${Date.now()}-${i}`,
      platform: activePlatform,
      content: `Sample post content from ${currentPlatform.label} #${i + 1}...`,
      url: `${profileUrl}/post/${i + 1}`,
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 16).replace("T", " "),
      sourceUrl: profileUrl,
    }))

    setPosts([...newPosts, ...posts])
    setIsSearching(false)
    setActiveDataTab("results")
  }

  const handleSchedule = () => {
    if (!profileUrl.trim()) return

    let intervalDisplay = ""
    if (scheduleConfig.mode === "simple") {
      intervalDisplay = `${t("contentWriting.competitors.dialog.modeSimple")}: ${scheduleConfig.simpleInterval} ${scheduleConfig.simpleUnit === "hours" ? t("contentWriting.competitors.dialog.unitHours") : t("contentWriting.competitors.dialog.unitDays")}`
    } else {
      intervalDisplay = `Cron: ${scheduleConfig.cronExpression}`
    }

    const newTask: ScheduledTask = {
      id: Date.now().toString(),
      platform: activePlatform,
      profileUrl: profileUrl,
      interval: intervalDisplay,
      lastRun: "-",
      nextRun: new Date(Date.now() + 3600000).toISOString().slice(0, 16).replace("T", " "),
      status: "active",
    }

    setScheduledTasks([newTask, ...scheduledTasks])
    setShowScheduleDialog(false)
    // Reset config
    setScheduleConfig({
      mode: "simple",
      simpleInterval: 1,
      simpleUnit: "days",
      cronExpression: "0 0 * * *",
    })
  }

  const toggleTaskStatus = (taskId: string) => {
    setScheduledTasks(
      scheduledTasks.map((task) =>
        task.id === taskId ? { ...task, status: task.status === "active" ? "paused" : "active" } : task,
      ),
    )
  }

  const openIntervalDialog = (task: ScheduledTask) => {
    setEditingIntervalTaskId(task.id)

    // Parse existing interval
    if (task.interval.startsWith("Cron:")) {
      setScheduleConfig({
        mode: "custom",
        simpleInterval: 1,
        simpleUnit: "days",
        cronExpression: task.interval.replace("Cron: ", ""),
      })
    } else {
      const match = task.interval.match(/每 (\d+) (小时|天)/)
      if (match) {
        setScheduleConfig({
          mode: "simple",
          simpleInterval: Number.parseInt(match[1]),
          simpleUnit: match[2] === "小时" ? "hours" : "days",
          cronExpression: "0 0 * * *",
        })
      }
    }
  }

  const handleUpdateInterval = () => {
    if (!editingIntervalTaskId) return

    let intervalDisplay = ""
    if (scheduleConfig.mode === "simple") {
      intervalDisplay = `${t("contentWriting.competitors.dialog.modeSimple")}: ${scheduleConfig.simpleInterval} ${scheduleConfig.simpleUnit === "hours" ? t("contentWriting.competitors.dialog.unitHours") : t("contentWriting.competitors.dialog.unitDays")}`
    } else {
      intervalDisplay = `Cron: ${scheduleConfig.cronExpression}`
    }

    setScheduledTasks(
      scheduledTasks.map((task) =>
        task.id === editingIntervalTaskId
          ? {
              ...task,
              interval: intervalDisplay,
            }
          : task,
      ),
    )
    setEditingIntervalTaskId(null)
    // Reset config
    setScheduleConfig({
      mode: "simple",
      simpleInterval: 1,
      simpleUnit: "days",
      cronExpression: "0 0 * * *",
    })
  }

  const handleDeleteTask = (id: string) => {
    setScheduledTasks(scheduledTasks.filter((task) => task.id !== id))
    setDeleteTaskId(null)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar with Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="space-y-4">
          {/* Platform Tabs */}
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setActivePlatform(platform.id)
                  setProfileUrl("")
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    activePlatform === platform.id
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
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11"
                />
              </div>
              <Button onClick={handleSearch} disabled={!profileUrl.trim() || isSearching} className="h-11 px-6">
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
            {isSearching && (
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
            onClick={() => setActiveDataTab("scheduled")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "scheduled"
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
        {activeDataTab === "scheduled" && (
          <div className="border border-border rounded-lg overflow-hidden animate-in fade-in duration-300">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.platform")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.url")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.interval")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.lastRun")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.nextRun")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    {t("contentWriting.competitors.table.status")}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {scheduledTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      {t("contentWriting.competitors.table.noTasks")}
                    </td>
                  </tr>
                ) : (
                  scheduledTasks.map((task) => (
                    <tr key={task.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {platforms.find((p) => p.id === task.platform)?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">{task.profileUrl}</td>
                      <td className="py-3 px-4 text-sm">
                        <button
                          onClick={() => openIntervalDialog(task)}
                          className="text-primary hover:underline cursor-pointer text-left"
                        >
                          {task.interval}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{task.lastRun}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{task.nextRun}</td>
                      <td className="py-3 px-4 text-sm">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${
                            task.status === "active"
                              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                              : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                          }`}
                        >
                          {task.status === "active" ? t("contentWriting.competitors.table.running") : t("contentWriting.competitors.table.paused")}
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
        )}

        {/* Crawl Logs Table */}
        {activeDataTab === "logs" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("contentWriting.competitors.logs.table.id")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("contentWriting.competitors.logs.table.type")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("contentWriting.competitors.logs.table.status")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("contentWriting.competitors.logs.table.createdAt")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("contentWriting.competitors.logs.table.updatedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {crawlLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        {t("contentWriting.competitors.logs.table.noData")}
                      </td>
                    </tr>
                  ) : (
                    crawlLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm font-medium">{log.id}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {log.type === "profile" ? t("contentWriting.competitors.urlType.profile") : t("contentWriting.competitors.urlType.post")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLOR_CONFIG[log.status].bg
                            } ${STATUS_COLOR_CONFIG[log.status].text}`}
                          >
                            {t(`contentWriting.competitors.logs.status.${log.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.updated_at).toLocaleString("zh-CN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Table */}
        {activeDataTab === "results" && (
          <div className="border border-border rounded-lg overflow-hidden animate-in fade-in duration-300">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.competitors.table.platform")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.content")}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.link")} (Source)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.link")} (Post)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Comments</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.time")}</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      {t("contentWriting.competitors.table.noResults")}
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {platforms.find((p) => p.id === post.platform)?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground max-w-md">
                        <div className="line-clamp-2">{post.content}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline max-w-xs truncate"
                        >
                          <span className="truncate">{post.sourceUrl}</span>
                          <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span>{t("common.preview")}</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{post.likes}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{post.comments}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{post.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            // Reset config
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
                    onValueChange={(value) =>
                      setScheduleConfig({ ...scheduleConfig, simpleUnit: value as "hours" | "days" })
                    }
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
                <p className="text-xs text-muted-foreground">例如：0 0 * * * (每天午夜)，0 */6 * * * (每 6 小时)</p>
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
            <Button onClick={editingIntervalTaskId ? handleUpdateInterval : handleSchedule}>{t("common.submit")}</Button>
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
