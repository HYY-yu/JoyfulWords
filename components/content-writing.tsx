"use client"

import { useState, useEffect } from "react"
import { SearchIcon, TrendingUpIcon, PenToolIcon, NotebookTabs } from "lucide-react"
import { MaterialSearch } from "./material-search"
import { CompetitorTracking } from "./competitor-tracking"
import { ArticleWriting } from "./article/article-writing"
import { ArticleManager } from "./article/article-manager"
import { useTranslation } from "@/lib/i18n/i18n-context"

export function ContentWriting() {
  const { t } = useTranslation()
  const [editTrigger, setEditTrigger] = useState(0)
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null)

  const tabs = [
    { id: "material-search", label: t("contentWriting.tabs.materialSearch"), icon: SearchIcon },
    { id: "competitor-tracking", label: t("contentWriting.tabs.competitorTracking"), icon: TrendingUpIcon },
    { id: "article-writing", label: t("contentWriting.tabs.articleWriting"), icon: PenToolIcon },
    { id: "article-manager", label: t("contentWriting.tabs.articleManager"), icon: NotebookTabs },
  ]

  const [activeTab, setActiveTab] = useState("material-search")

  // Listen for edit navigation
  useEffect(() => {
    const handleEditNavigation = () => {
      // 读取文章 ID（如果有）
      const articleId = (window as any).__editArticleId
      const editArticle = (window as any).__editArticle

      // 只有同时有 __editArticleId 和 __editArticle 才是编辑模式
      // 如果只有 __editArticleId 而没有 __editArticle，说明是切换 tab，保持原状态
      // 如果都没有，说明是新建模式
      if (articleId && editArticle) {
        setCurrentArticleId(articleId)
      } else if (!articleId && !editArticle) {
        // 新建模式，清除 articleId
        setCurrentArticleId(null)
      }
      // 如果只有 articleId 而没有 editArticle，保持 currentArticleId 不变（切换 tab）

      setEditTrigger(prev => prev + 1)
    }

    // Listen for custom event
    window.addEventListener('article-edit-navigate', handleEditNavigation)

    return () => {
      window.removeEventListener('article-edit-navigate', handleEditNavigation)
    }
  }, [])

  const handleNavigateToWriting = () => {
    setActiveTab("article-writing")
    // 读取文章 ID（如果有）
    const articleId = (window as any).__editArticleId
    const editArticle = (window as any).__editArticle

    // 只有同时有 __editArticleId 和 __editArticle 才是编辑模式
    if (articleId && editArticle) {
      setCurrentArticleId(articleId)
    } else if (!articleId && !editArticle) {
      // 新建模式，清除 articleId
      setCurrentArticleId(null)
    }
    // 如果只有 articleId 而没有 editArticle，保持 currentArticleId 不变（切换 tab）

    setEditTrigger(prev => prev + 1)
  }

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="flex-1 overflow-auto flex flex-col">
      {/* Header with Title */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <PenToolIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{t("contentWriting.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("contentWriting.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-t border-border/50">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                    border-b-2 -mb-px
                    ${
                      isActive
                        ? "text-primary border-primary bg-primary/5"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Tab Content Area */}
      <div className="flex-1 p-8">
        {activeTab === "material-search" ? (
          <MaterialSearch />
        ) : activeTab === "competitor-tracking" ? (
          <CompetitorTracking />
        ) : activeTab === "article-writing" ? (
          <ArticleWriting key={currentArticleId || 'new'} articleId={currentArticleId} />
        ) : activeTab === "article-manager" ? (
          <ArticleManager onNavigateToWriting={handleNavigateToWriting} />
        ) : (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <activeTabConfig.icon className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">{activeTabConfig.label}</h3>
                <p className="text-muted-foreground max-w-md">{t("common.doing")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
