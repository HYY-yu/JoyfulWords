"use client"

import { ImageIcon, FileTextIcon, CreditCardIcon, SearchIcon, VideoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  {
    id: "image-generation",
    label: "图片生成",
    icon: ImageIcon,
  },
  {
    id: "content-writing",
    label: "悦文悦己",
    icon: FileTextIcon,
  },
  {
    id: "knowledge-cards",
    label: "知识卡片",
    icon: CreditCardIcon,
  },
  {
    id: "seo-geo",
    label: "SEO/GEO",
    icon: SearchIcon,
  },
  {
    id: "video-editing",
    label: "基础视频剪辑",
    icon: VideoIcon,
  },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col fixed left-0 top-0 h-screen z-20">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">创作者工具箱</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Content Creator Tools</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "text-sm font-medium",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
