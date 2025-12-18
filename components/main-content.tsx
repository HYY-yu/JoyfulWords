"use client"

import { ImageIcon, FileTextIcon, CreditCardIcon, SearchIcon, VideoIcon } from "lucide-react"
import { ImageGeneration } from "./image-generation"
import { ContentWriting } from "./content-writing"

interface MainContentProps {
  activeTab: string
}

const tabConfig = {
  "image-generation": {
    title: "图片生成",
    description: "AI-powered image generation tools",
    icon: ImageIcon,
  },
  "content-writing": {
    title: "悦文悦己",
    description: "Content reading and management",
    icon: FileTextIcon,
  },
  "knowledge-cards": {
    title: "知识卡片",
    description: "Create and organize knowledge cards",
    icon: CreditCardIcon,
  },
  "seo-geo": {
    title: "SEO/GEO",
    description: "SEO and geographic optimization tools",
    icon: SearchIcon,
  },
  "video-editing": {
    title: "基础视频剪辑",
    description: "Basic video editing capabilities",
    icon: VideoIcon,
  },
}

export function MainContent({ activeTab }: MainContentProps) {
  if (activeTab === "image-generation") {
    return <ImageGeneration />
  }

  if (activeTab === "content-writing") {
    return <ContentWriting />
  }

  const config = tabConfig[activeTab as keyof typeof tabConfig]

  // 如果找不到配置，显示默认错误页面
  if (!config) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">页面未找到</h3>
              <p className="text-muted-foreground">无法找到对应的功能模块</p>
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
              <p className="text-muted-foreground max-w-md">这个功能正在开发中，敬请期待...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
