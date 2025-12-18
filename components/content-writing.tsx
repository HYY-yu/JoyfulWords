"use client"

import { useState } from "react"
import { SearchIcon, TrendingUpIcon, PenToolIcon, NotebookTabs } from "lucide-react"
import { MaterialSearch } from "./material-search"
import { CompetitorTracking } from "./competitor-tracking"
import { ArticleWriting } from "./article-writing"

const tabs = [
  { id: "material-search", label: "素材搜索", icon: SearchIcon },
  { id: "competitor-tracking", label: "竞品跟踪", icon: TrendingUpIcon },
  { id: "article-writing", label: "文章撰写", icon: PenToolIcon },
  { id: "article-manager", label: "文章管理", icon: NotebookTabs },
]

export function ContentWriting() {
  const [activeTab, setActiveTab] = useState("material-search")

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
              <h2 className="text-2xl font-semibold text-foreground">悦文悦己</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Content creation and management tools</p>
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
          <ArticleWriting />
        ) : (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <activeTabConfig.icon className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">{activeTabConfig.label}</h3>
                <p className="text-muted-foreground max-w-md">Doing 中...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
