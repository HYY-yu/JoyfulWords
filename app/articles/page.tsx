"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useArticles } from "@/lib/hooks/use-articles"
import { Input } from "@/components/ui/base/input"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import {
  UserCircleIcon,
  LogOutIcon,
  Wallet,
  CheckSquareIcon,
  LoaderIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  RefreshCw,
  ChevronLeftIcon,
  ChevronRightIcon,
  Globe,
  BookOpenTextIcon,
  FilePenLineIcon,
  PencilLineIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
import { TallyFeedbackButton, FeedbackErrorBoundary } from "@/components/feedback"
import { ProfileDialog } from "@/components/auth/profile-dialog"
import { BrandLogo } from "@/components/brand/brand-logo"
import { getStatusVariant, formatShortDate } from "@/components/article/article-types"
import type { Article } from "@/lib/api/articles/types"
import {
  DeleteConfirmDialog,
  EditTitleDialog,
} from "@/components/article/article-dialogs"
import { articlesClient } from "@/lib/api/articles/client"
import { useToast } from "@/hooks/use-toast"
import { ArticleAIHelpDialog } from "@/components/article/article-ai-help-dialog"
import { ArticleCreateModeDialog } from "@/components/article/article-create-mode-dialog"
import { BillingFullscreenDialog } from "@/components/billing/billing-fullscreen-dialog"
import { TaskCenterDialog } from "@/components/taskcenter/taskcenter-dialog"
import type { TaskCenterTaskReference, TaskCenterTaskType } from "@/lib/api/taskcenter/types"
import { cn } from "@/lib/utils"

function getArticlePlainText(content: string) {
  return content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

const DEFAULT_ARTICLE_THUMBNAIL = "/article-default-thumbnail.svg"

function getFirstArticleImage(content: string) {
  const htmlImageMatch = content.match(/<img[^>]+src=(["'])(.*?)\1/i)
  if (htmlImageMatch?.[2]) return htmlImageMatch[2]

  const markdownImageMatch = content.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/)
  return markdownImageMatch?.[1] ?? null
}

function getArticleThumbnail(article: Article) {
  return (
    getFirstArticleImage(article.content) ??
    article.materials
      ?.find((material) => material.type === "image" && material.content?.trim())
      ?.content?.trim() ??
    DEFAULT_ARTICLE_THUMBNAIL
  )
}

function toCssBackgroundImage(url: string) {
  return `url("${url.replace(/"/g, "%22")}")`
}

function BillingDialogQuerySync({
  onOpenBillingDialog,
}: {
  onOpenBillingDialog: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "billing") {
      console.info("[ArticlesPage] Opening billing dialog from query param")
      onOpenBillingDialog()
      router.replace("/articles")
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const activeTab = localStorage.getItem("joyfulwords-active-tab")
    if (activeTab === "billing") {
      console.info("[ArticlesPage] Opening billing dialog from localStorage flag")
      onOpenBillingDialog()
      localStorage.removeItem("joyfulwords-active-tab")
    }
  }, [searchParams, router, onOpenBillingDialog])

  return null
}

function TaskCenterDialogQuerySync({
  onOpenTaskCenterDialog,
}: {
  onOpenTaskCenterDialog: (taskRef: TaskCenterTaskReference | null) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const shouldOpenTaskCenter = searchParams.get("taskCenter") === "1"
    const taskId = searchParams.get("taskId")
    const taskType = searchParams.get("taskType")

    if (!shouldOpenTaskCenter && (!taskId || !taskType)) {
      return
    }

    const nextTaskRef =
      taskId && taskType
        ? {
            id: Number(taskId),
            type: taskType as TaskCenterTaskType,
          }
        : null

    onOpenTaskCenterDialog(
      nextTaskRef && Number.isFinite(nextTaskRef.id) ? nextTaskRef : null
    )
    router.replace("/articles")
  }, [onOpenTaskCenterDialog, router, searchParams])

  return null
}

export default function ArticlesPage() {
  const { t, locale, setLocale } = useTranslation()
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [createModeDialogOpen, setCreateModeDialogOpen] = useState(false)
  const [aiHelpDialogOpen, setAiHelpDialogOpen] = useState(false)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [taskCenterOpen, setTaskCenterOpen] = useState(false)
  const [taskCenterDeepLink, setTaskCenterDeepLink] =
    useState<TaskCenterTaskReference | null>(null)
  const [isCreatingArticle, setIsCreatingArticle] = useState(false)

  const {
    articles,
    loading,
    pagination,
    titleFilter,
    statusFilter,
    setTitleFilter,
    setStatusFilter,
    handleDelete,
    handleRefresh,
    handlePageChange,
    handlePageSizeChange,
  } = useArticles()

  // Dialog states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editTitleOpen, setEditTitleOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  const handleEditArticle = (article: Article) => {
    router.push(`/articles/${article.id}/edit`)
  }

  const confirmDeleteArticle = () => {
    if (selectedArticle) {
      handleDelete(selectedArticle.id)
      setDeleteConfirmOpen(false)
      setSelectedArticle(null)
    }
  }

  const saveTitle = async (articleId: number, newTitle: string) => {
    const result = await articlesClient.updateArticleMetadata(articleId, {
      title: newTitle,
    })

    if ("message" in result) {
      toast({
        description: t("contentWriting.manager.titleUpdated"),
      })
      handleRefresh()
    } else {
      toast({
        variant: "destructive",
        description: result.error,
      })
      throw new Error(result.error)
    }
  }

  const handleAIArticleCreated = () => {
    handleRefresh()
  }

  const handleCreateManualArticle = async () => {
    setIsCreatingArticle(true)
    console.info("[ArticlesPage] Creating manual article from article manager")

    try {
      const result = await articlesClient.createArticle({
        title: t("contentWriting.createModeDialog.manual.defaultTitle"),
        content: "",
      })

      if ("error" in result) {
        console.warn("[ArticlesPage] Manual article creation failed:", result.error)
        throw new Error(result.error)
      }

      console.info("[ArticlesPage] Manual article created successfully:", {
        articleId: result.id,
      })

      toast({
        description: t("contentWriting.createModeDialog.manual.success"),
      })

      setCreateModeDialogOpen(false)
      router.push(`/articles/${result.id}/edit`)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("contentWriting.createModeDialog.manual.failed")

      console.error("[ArticlesPage] Manual article creation error:", error)
      toast({
        variant: "destructive",
        description: errorMessage,
      })
    } finally {
      setIsCreatingArticle(false)
    }
  }

  const handleOpenAIHelpDialog = () => {
    setCreateModeDialogOpen(false)
    window.setTimeout(() => {
      setAiHelpDialogOpen(true)
    }, 0)
  }

  const handleOpenBillingDialog = useCallback(() => {
    setBillingDialogOpen(true)
  }, [])

  const handleOpenTaskCenterDialog = useCallback((taskRef: TaskCenterTaskReference | null) => {
    setTaskCenterDeepLink(taskRef)
    setTaskCenterOpen(true)
  }, [])

  const handleTaskCenterInitialTaskHandled = useCallback(() => {
    setTaskCenterDeepLink(null)
  }, [])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const normalizedTitleFilter = titleFilter.trim().toLocaleLowerCase(
    locale === "zh" ? "zh-CN" : "en-US"
  )
  const visibleArticles = normalizedTitleFilter
    ? articles.filter((article) =>
        article.title
          .toLocaleLowerCase(locale === "zh" ? "zh-CN" : "en-US")
          .includes(normalizedTitleFilter)
      )
    : articles
  const displayedTotal = normalizedTitleFilter ? visibleArticles.length : pagination.total
  const totalPages = normalizedTitleFilter
    ? 1
    : Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  const draftCount = articles.filter((article) => article.status === "draft").length
  const publishedCount = articles.filter((article) => article.status === "published").length
  const latestArticle = articles[0]

  return (
    <div className="flex h-screen flex-col bg-[#fbf7ec] text-[#221f1a]">
      <Suspense fallback={null}>
        <BillingDialogQuerySync onOpenBillingDialog={handleOpenBillingDialog} />
      </Suspense>
      <Suspense fallback={null}>
        <TaskCenterDialogQuerySync onOpenTaskCenterDialog={handleOpenTaskCenterDialog} />
      </Suspense>

      {/* Top Navigation Bar */}
      <header className="shrink-0 border-b border-[#ded4c4]/85 bg-[#fffdf7]/92 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <button
            onClick={() => router.push("/articles")}
            className="rounded-xl transition-transform hover:-translate-y-0.5"
            aria-label="JoyfulWords"
          >
            <BrandLogo />
          </button>

          {/* Right - Actions */}
          <div className="flex items-center gap-3 h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full text-sm text-[#6b6255] hover:bg-[#f4eee1] hover:text-[#221f1a]"
              onClick={() => setTaskCenterOpen(true)}
            >
              <CheckSquareIcon className="w-4 h-4 text-teal-700" />
              {t("contentWriting.taskCenter.title")}
            </Button>

            {/* Feedback */}
            <FeedbackErrorBoundary>
              <TallyFeedbackButton className="h-8 w-auto rounded-full py-0 text-sm text-[#6b6255] hover:bg-[#f4eee1] hover:text-[#221f1a]" />
            </FeedbackErrorBoundary>

            {/* Language */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full text-sm text-[#6b6255] hover:bg-[#f4eee1] hover:text-[#221f1a]"
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            >
              <Globe className="w-4 h-4 text-amber-700" />
              {locale === "zh" ? "English" : "中文"}
            </Button>

            {/* Billing */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full text-sm text-[#6b6255] hover:bg-[#f4eee1] hover:text-[#221f1a]"
              onClick={() => setBillingDialogOpen(true)}
            >
              <Wallet className="w-4 h-4 text-pink-700" />
              {t("sidebar.billing")}
            </Button>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-[#f4eee1]">
                  <UserCircleIcon className="!size-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{t("common.account")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setProfileOpen(true)}
                >
                  <UserCircleIcon className="mr-2 h-4 w-4" />
                  {t("auth.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={() => signOut()}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1500px] flex-col px-6 py-6">
          {/* Page Title + Actions */}
          <div className="mb-5 rounded-[28px] border border-[#ded4c4]/85 bg-[#fffdf7]/88 p-5 shadow-[0_22px_60px_-48px_rgba(84,64,38,0.55)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Article Workspace
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#16130f]">
                  {t("contentWriting.tabs.articleManager")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6255]">
                  {t("contentWriting.manager.workspaceSubtitle")}
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-4 xl:min-w-[520px]">
                {[
                  { label: t("contentWriting.manager.totalArticles"), value: displayedTotal, icon: BookOpenTextIcon, color: "bg-teal-50 text-teal-700" },
                  { label: t("contentWriting.manager.status.draft"), value: draftCount, icon: FilePenLineIcon, color: "bg-amber-50 text-amber-700" },
                  { label: t("contentWriting.manager.status.published"), value: publishedCount, icon: CheckSquareIcon, color: "bg-emerald-50 text-emerald-700" },
                  { label: t("contentWriting.manager.recentlyUpdated"), value: latestArticle ? formatShortDate(latestArticle.updated_at) : "-", icon: RefreshCw, color: "bg-pink-50 text-pink-700" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="rounded-xl border border-[#e5dbc9] bg-[#fffdf7] p-3">
                      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", item.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="truncate text-lg font-bold text-[#16130f]">{item.value}</div>
                      <div className="truncate text-[11px] text-[#7a7165]">{item.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#ded4c4]/85 bg-[#fffdf7]/82 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a7165]" />
                <Input
                  value={titleFilter}
                  onChange={(event) => setTitleFilter(event.target.value)}
                  placeholder={t("contentWriting.manager.searchTitlePlaceholder")}
                  className="h-10 rounded-lg border-[#ded4c4] bg-[#fffef9] pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as any)
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-[#ded4c4] bg-[#fffef9] sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("contentWriting.manager.status.all")}</SelectItem>
                  <SelectItem value="init">{t("contentWriting.manager.status.init")}</SelectItem>
                  <SelectItem value="draft">{t("contentWriting.manager.status.draft")}</SelectItem>
                  <SelectItem value="published">{t("contentWriting.manager.status.published")}</SelectItem>
                  <SelectItem value="archived">{t("contentWriting.manager.status.archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-[#ded4c4] bg-[#fffef9]"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={() => setCreateModeDialogOpen(true)}
                className="h-10 gap-2 rounded-lg bg-teal-700 text-white shadow-[0_14px_26px_-18px_rgba(15,118,110,0.8)] hover:bg-teal-800"
              >
                <PlusIcon className="w-4 h-4" />
                {t("contentWriting.editorHeader.newArticle")}
              </Button>
            </div>
          </div>

          {/* Article Rows */}
          <div className="min-h-0 flex-1 rounded-[18px] border border-[#ded4c4]/85 bg-[#fffdf7]/72 p-3 shadow-[0_20px_60px_-52px_rgba(84,64,38,0.45)]">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  <span>{t("contentWriting.manager.loading")}</span>
                </div>
              </div>
            ) : visibleArticles.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8cdbb] text-muted-foreground">
                <BookOpenTextIcon className="mb-3 h-10 w-10 text-teal-700/55" />
                <p className="text-lg">
                  {normalizedTitleFilter
                    ? t("contentWriting.manager.emptySearchTitle")
                    : t("contentWriting.manager.emptyTitle")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleArticles.map((article) => {
                  const thumbnailUrl = getArticleThumbnail(article)
                  const isDefaultThumbnail = thumbnailUrl === DEFAULT_ARTICLE_THUMBNAIL

                  return (
                    <div
                      key={article.id}
                      className="group grid cursor-pointer gap-4 rounded-xl border border-[#e5dbc9] bg-[#fffef9] p-4 transition-all hover:-translate-y-0.5 hover:border-teal-700/30 hover:shadow-[0_18px_36px_-30px_rgba(15,118,110,0.55)] sm:grid-cols-[164px_1fr] lg:grid-cols-[176px_1fr_auto]"
                      onClick={() => handleEditArticle(article)}
                    >
                      <div
                        className="relative min-h-32 overflow-hidden rounded-xl border border-[#e5dbc9] bg-cover bg-center shadow-inner sm:min-h-0"
                        style={{ backgroundImage: toCssBackgroundImage(thumbnailUrl) }}
                        aria-hidden="true"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,247,0)_25%,rgba(31,29,25,0.36)_100%)] opacity-80 transition-opacity group-hover:opacity-60" />
                        {isDefaultThumbnail && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#fffdf7]/90 px-2.5 py-1 text-[11px] font-semibold text-teal-800 shadow-sm">
                            <SparklesIcon className="h-3 w-3" />
                            JoyfulWords
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant={getStatusVariant(article.status)} className="text-xs">
                            {t(`contentWriting.manager.status.${article.status}`)}
                          </Badge>
                          <span className="text-xs text-[#7a7165]">
                            {formatShortDate(article.updated_at)}
                          </span>
                        </div>

                        <div className="mb-2 flex min-w-0 items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <FilePenLineIcon className="h-4 w-4" />
                          </span>
                          <h3 className="min-w-0 truncate text-lg font-bold text-[#16130f] transition-colors group-hover:text-teal-800">
                            {article.title}
                          </h3>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="h-8 w-8 shrink-0 rounded-lg border-[#ded4c4] bg-[#fffdf7] text-[#6b6255] hover:bg-teal-50 hover:text-teal-800"
                            title={t("contentWriting.manager.editTitleAction")}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedArticle(article)
                              setEditTitleOpen(true)
                            }}
                          >
                            <PencilLineIcon className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <p className="line-clamp-2 max-w-4xl text-sm leading-6 text-[#62594d]">
                          {getArticlePlainText(article.content) ||
                            t("contentWriting.writing.editorPlaceholder")}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {article.tags
                            ?.split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#f4eee1] px-2.5 py-1 text-xs text-[#7a7165]"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-[#e5dbc9] pt-3 sm:col-span-2 lg:col-span-1 lg:min-w-[220px] lg:flex-col lg:items-end lg:justify-center lg:border-t-0 lg:pt-0">
                        <Button
                          className="h-9 gap-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditArticle(article)
                          }}
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                          {t("contentWriting.manager.openEditor")}
                        </Button>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedArticle(article)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Pagination - 固定在底部 */}
      {displayedTotal > 0 && (
        <footer className="shrink-0 border-t border-[#ded4c4]/85 bg-[#fffdf7]/92">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
            <div className="text-sm text-[#7a7165]">
              {t("contentWriting.manager.totalCount", {
                total: displayedTotal,
                page: pagination.page,
              })}
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-9 w-[76px] rounded-lg border-[#ded4c4] bg-[#fffef9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-[#ded4c4] bg-[#fffef9]"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={normalizedTitleFilter.length > 0 || pagination.page <= 1 || loading}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <div className="min-w-[80px] text-center text-sm text-[#221f1a]">
                {pagination.page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-[#ded4c4] bg-[#fffef9]"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={normalizedTitleFilter.length > 0 || pagination.page >= totalPages || loading}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* Dialogs */}
      {selectedArticle && (
        <>
          <EditTitleDialog
            article={selectedArticle}
            open={editTitleOpen}
            onOpenChange={setEditTitleOpen}
            onSave={saveTitle}
          />
          <DeleteConfirmDialog
            article={selectedArticle}
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={confirmDeleteArticle}
          />
        </>
      )}

      {/* Profile Dialog */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />

      <ArticleCreateModeDialog
        open={createModeDialogOpen}
        onOpenChange={setCreateModeDialogOpen}
        onSelectManual={handleCreateManualArticle}
        onSelectAI={handleOpenAIHelpDialog}
        isCreatingManual={isCreatingArticle}
      />

      <ArticleAIHelpDialog
        open={aiHelpDialogOpen}
        onOpenChange={setAiHelpDialogOpen}
        onArticleCreated={handleAIArticleCreated}
        variant="feature-compact"
      />

      <BillingFullscreenDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />
      <TaskCenterDialog
        open={taskCenterOpen}
        onOpenChange={setTaskCenterOpen}
        initialTaskRef={taskCenterDeepLink}
        onInitialTaskHandled={handleTaskCenterInitialTaskHandled}
      />
    </div>
  )
}
