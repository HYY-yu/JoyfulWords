"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useArticles } from "@/lib/hooks/use-articles"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
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
} from "lucide-react"
import { TallyFeedbackButton, FeedbackErrorBoundary } from "@/components/feedback"
import { ProfileDialog } from "@/components/auth/profile-dialog"
import { useState } from "react"
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

  const handleOpenTaskCenterDialog = (taskRef: TaskCenterTaskReference | null) => {
    setTaskCenterDeepLink(taskRef)
    setTaskCenterOpen(true)
  }

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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Suspense fallback={null}>
        <BillingDialogQuerySync onOpenBillingDialog={() => setBillingDialogOpen(true)} />
      </Suspense>
      <Suspense fallback={null}>
        <TaskCenterDialogQuerySync onOpenTaskCenterDialog={handleOpenTaskCenterDialog} />
      </Suspense>

      {/* Top Navigation Bar */}
      <header className="shrink-0 border-b border-border bg-background">
        <div className="flex items-center justify-between h-14 px-6">
          {/* Left - Logo / Stay on articles */}
          <button
            onClick={() => router.push("/articles")}
            className="text-base font-semibold text-foreground hover:text-foreground/80 transition-colors"
          >
            {t("sidebar.title")}
          </button>

          {/* Right - Actions */}
          <div className="flex items-center gap-3 h-full">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm text-muted-foreground hover:text-foreground h-8"
              onClick={() => setTaskCenterOpen(true)}
            >
              <CheckSquareIcon className="w-4 h-4" />
              {t("contentWriting.taskCenter.title")}
            </Button>

            {/* Feedback */}
            <FeedbackErrorBoundary>
              <TallyFeedbackButton className="w-auto py-0 h-8 text-sm text-muted-foreground hover:text-foreground hover:bg-accent" />
            </FeedbackErrorBoundary>

            {/* Language */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm text-muted-foreground hover:text-foreground h-8"
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            >
              <Globe className="w-4 h-4" />
              {locale === "zh" ? "English" : "中文"}
            </Button>

            {/* Billing */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm text-muted-foreground hover:text-foreground h-8"
              onClick={() => setBillingDialogOpen(true)}
            >
              <Wallet className="w-4 h-4" />
              {t("sidebar.billing")}
            </Button>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-full">
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Title + Actions */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {t("contentWriting.tabs.articleManager")}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={() => setCreateModeDialogOpen(true)}
                className="gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {t("contentWriting.editorHeader.newArticle")}
              </Button>
            </div>
          </div>

          {/* Article Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span>{t("contentWriting.manager.loading")}</span>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <p className="text-lg">{t("contentWriting.manager.emptyTitle")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-foreground/20 transition-all cursor-pointer"
                  onClick={() => handleEditArticle(article)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant={getStatusVariant(article.status)}
                      className="text-xs"
                    >
                      {t(`contentWriting.manager.status.${article.status}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(article.updated_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {article.content.replace(/<[^>]*>/g, "").substring(0, 150)}
                  </p>

                  {/* Footer - Tags & Actions */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {article.tags &&
                        article.tags
                          .split(",")
                          .slice(0, 2)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground truncate max-w-[80px]"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                    </div>

                    {/* Action Buttons */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedArticle(article)
                          setEditTitleOpen(true)
                        }}
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
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
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Pagination - 固定在底部 */}
      {pagination.total > 0 && (
        <footer className="shrink-0 border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t("contentWriting.manager.totalCount", {
                total: pagination.total,
                page: pagination.page,
              })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <div className="text-sm text-foreground min-w-[80px] text-center">
                {pagination.page} /{" "}
                {Math.ceil(pagination.total / pagination.pageSize)}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={
                  pagination.page >=
                    Math.ceil(pagination.total / pagination.pageSize) ||
                  loading
                }
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
        onInitialTaskHandled={() => setTaskCenterDeepLink(null)}
      />
    </div>
  )
}
