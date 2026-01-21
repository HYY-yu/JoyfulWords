"use client"

import { ImageIcon, FileTextIcon, CreditCardIcon, SearchIcon, VideoIcon } from "lucide-react"
import { ImageGeneration } from "./image-generation"
import { ContentWriting } from "./content-writing"
import { KnowledgeCards } from "./knowledge-cards"
import { SeoGeo } from "./seo-geo/seo-geo"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { isFeatureEnabled } from "@/lib/config"

interface MainContentProps {
  activeTab: string
}

export function MainContent({ activeTab }: MainContentProps) {
  const { t } = useTranslation()

  // ============ 功能开关逻辑 ============
  // 已上线功能的早期返回
  if (activeTab === "image-generation" && isFeatureEnabled("image-generation")) {
    return <ImageGeneration />
  }

  if (activeTab === "content-writing") {
    return <ContentWriting />
  }

  if (activeTab === "knowledge-cards" && isFeatureEnabled("knowledge-cards")) {
    return <KnowledgeCards />
  }

  if (activeTab === "seo-geo" && isFeatureEnabled("seo-geo")) {
    return <SeoGeo />
  }

  const tabConfig = {
    "image-generation": {
      title: t("sidebar.imageGeneration"),
      description: t("imageGeneration.subtitle"),
      icon: ImageIcon,
    },
    "content-writing": {
      title: t("sidebar.contentWriting"),
      description: t("contentWriting.subtitle"),
      icon: FileTextIcon,
    },
    "knowledge-cards": {
      title: t("sidebar.knowledgeCards"),
      description: t("knowledgeCards.subtitle"),
      icon: CreditCardIcon,
    },
    "seo-geo": {
      title: t("sidebar.seoGeo"),
      description: t("seoGeo.subtitle"),
      icon: SearchIcon,
    },
    "video-editing": {
      title: t("sidebar.videoEditing"),
      description: t("common.comingSoon"),
      icon: VideoIcon,
    },
  }

  const config = tabConfig[activeTab as keyof typeof tabConfig]

  // 如果找不到配置，显示默认错误页面
  if (!config) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">{t("common.notFound")}</h3>
              <p className="text-muted-foreground">{t("common.notFoundDesc")}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const Icon = config.icon

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{config.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
              <Icon className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-foreground">Doing</h3>
              <p className="text-muted-foreground max-w-md">{t("common.comingSoon")}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}