"use client"

import { useState, useEffect } from "react"
import { SearchIcon, PenToolIcon, NotebookTabs, FileTextIcon, DatabaseIcon } from "lucide-react"
import { MaterialSearchTab } from "./materials/material-search-tab"
import { MaterialLibraryTab } from "./materials/material-library-tab"
import { ArticleWriting } from "./article/article-writing"
import { ArticleManager } from "./article/article-manager"
import { useTranslation } from "@/lib/i18n/i18n-context"

const CONTENT_TAB_STORAGE_KEY = 'joyfulwords-content-writing-tab'
const CONTENT_TAB_IDS = ["article-writing", "article-manager", "search", "material-library"] as const

export function ContentWriting() {
  const { t } = useTranslation()
  const [editTrigger, setEditTrigger] = useState(0)
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null)

  const tabs = [
    { id: "article-writing", label: t("contentWriting.tabs.articleWriting"), icon: PenToolIcon },
    { id: "article-manager", label: t("contentWriting.tabs.articleManager"), icon: NotebookTabs },
    { id: "search", label: t("contentWriting.tabs.search"), icon: SearchIcon },
    { id: "material-library", label: t("contentWriting.tabs.materialLibrary"), icon: DatabaseIcon },
  ]

  // 从 localStorage 读取上次的子 tab，如果没有则默认为 "article-writing"
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(CONTENT_TAB_STORAGE_KEY)
      return savedTab && CONTENT_TAB_IDS.includes(savedTab as (typeof CONTENT_TAB_IDS)[number])
        ? savedTab
        : "article-writing"
    }
    return "article-writing"
  })

  // 当 activeTab 改变时，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONTENT_TAB_STORAGE_KEY, activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    if (!CONTENT_TAB_IDS.includes(activeTab as (typeof CONTENT_TAB_IDS)[number])) {
      setActiveTab("article-writing")
    }
  }, [activeTab])

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

    // Listen for navigate to article manager event
    const handleNavigateToManager = () => {
      setActiveTab("article-manager")
    }

    // Listen for custom events
    window.addEventListener('article-edit-navigate', handleEditNavigation)
    window.addEventListener('navigate-to-article-manager', handleNavigateToManager)

    return () => {
      window.removeEventListener('article-edit-navigate', handleEditNavigation)
      window.removeEventListener('navigate-to-article-manager', handleNavigateToManager)
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

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header with Title */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileTextIcon className="w-6 h-6 text-primary" />
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
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        {activeTab === "search" ? (
          <MaterialSearchTab />
        ) : activeTab === "material-library" ? (
          <MaterialLibraryTab />
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
