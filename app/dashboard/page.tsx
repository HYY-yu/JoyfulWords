"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { useAuth } from "@/lib/auth/auth-context"

const TAB_STORAGE_KEY = 'joyfulwords-active-tab'

// 迁移映射：旧 tab ID -> 新 tab ID
const TAB_MIGRATION_MAP: Record<string, string> = {
  "content-writing": "joyfulwords-content-writing",
  "image-generation": "joyfulwords-image-generation",
  "knowledge-cards": "joyfulwords-knowledge-cards",
  "seo-geo": "joyfulwords-seo-geo",
  "video-editing": "joyfulwords-video-editing",
}

// 获取初始 tab，包含迁移逻辑
const getInitialTab = () => {
  if (typeof window === 'undefined') return "joyfulwords-content-writing"

  const storedTab = localStorage.getItem(TAB_STORAGE_KEY)

  // 迁移旧 tab ID 到新格式
  if (storedTab && TAB_MIGRATION_MAP[storedTab]) {
    const newTab = TAB_MIGRATION_MAP[storedTab]
    localStorage.setItem(TAB_STORAGE_KEY, newTab)
    return newTab
  }

  return storedTab || "joyfulwords-content-writing"
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 从 localStorage 读取上次的 tab，如果没有则默认为 "joyfulwords-content-writing"
  const [activeTab, setActiveTab] = useState(() => getInitialTab())

  // 当 activeTab 改变时，保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
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
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        <MainContent activeTab={activeTab} />
      </div>
    </div>
  )
}
