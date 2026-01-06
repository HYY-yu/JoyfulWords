import type React from "react"
import { SearchIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SEARCH_TAB_OPTIONS } from "@/lib/api/materials/enums"

interface MaterialSearchBarProps {
  activeSearchTab: string
  setActiveSearchTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searching: boolean
  onSearch: () => void
  t: (key: string) => string
}

export function MaterialSearchBar({
  activeSearchTab,
  setActiveSearchTab,
  searchQuery,
  setSearchQuery,
  searching,
  onSearch,
  t,
}: MaterialSearchBarProps) {
  const { FileTextIcon, NewspaperIcon, ImageIcon } = SEARCH_TAB_OPTIONS.reduce(
    (acc, tab) => {
      if (tab.i18nKey === "info") acc.FileTextIcon = require("lucide-react").FileTextIcon
      if (tab.i18nKey === "news") acc.NewspaperIcon = require("lucide-react").NewspaperIcon
      if (tab.i18nKey === "image") acc.ImageIcon = require("lucide-react").ImageIcon
      return acc
    },
    { FileTextIcon: null, NewspaperIcon: null, ImageIcon: null } as {
      FileTextIcon: any
      NewspaperIcon: any
      ImageIcon: any
    }
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="space-y-4">
        {/* Search Tabs */}
        <div className="flex gap-2">
          {SEARCH_TAB_OPTIONS.map((tab) => {
            const Icon =
              tab.i18nKey === "info"
                ? require("lucide-react").FileTextIcon
                : tab.i18nKey === "news"
                ? require("lucide-react").NewspaperIcon
                : require("lucide-react").ImageIcon
            const isActive = activeSearchTab === tab.uiLabel
            return (
              <button
                key={tab.uiLabel}
                onClick={() => setActiveSearchTab(tab.uiLabel)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }
                  `}
              >
                <Icon className="w-4 h-4" />
                {t(`contentWriting.materials.types.${tab.i18nKey}`)}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("contentWriting.materials.searchPlaceholder").replace(
                "{type}",
                t(`contentWriting.materials.types.${activeSearchTab.toLowerCase()}`)
              )}
              className="pl-10 pr-24 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={onSearch}
              disabled={!searchQuery.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9"
            >
              {searching ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  {t("contentWriting.materials.searchingBtn")}
                </>
              ) : (
                t("contentWriting.materials.searchBtn")
              )}
            </Button>
          </div>

          {searching && (
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-md animate-in slide-in-from-top-2 fade-in duration-300">
              <LoaderIcon className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">{t("contentWriting.materials.aiSearching")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
