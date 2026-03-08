"use client"

import type { TabValue } from "./types"
import { Sparkles, Palette, RefreshCw } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"

const TAB_STORAGE_KEY = 'joyfulwords-image-generation-tab'

export function ModeTabs({ activeTab, onTabChange }: { activeTab: TabValue; onTabChange: (tab: TabValue) => void }) {
  const { t } = useTranslation()

  const tabs = [
    { value: "creation" as const, label: t("imageGeneration.modeTabs.creation"), icon: Sparkles },
    { value: "style" as const, label: t("imageGeneration.modeTabs.style"), icon: Palette },
    { value: "inversion" as const, label: t("imageGeneration.modeTabs.inversion"), icon: RefreshCw },
  ]

  // 当 activeTab 改变时，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab)
    }
  }, [activeTab])

  return (
    <div className="border-b border-border/50 bg-background">
      <div className="px-8">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
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
    </div>
  )
}
