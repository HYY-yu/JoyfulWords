"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { useAuth } from "@/lib/auth/auth-context"

const TAB_STORAGE_KEY = 'joyfulwords-active-tab'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 从 localStorage 读取上次的 tab，如果没有则默认为 "content-writing"
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TAB_STORAGE_KEY) || "content-writing"
    }
    return "content-writing"
  })

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
      <div className="flex-1 ml-64">
        <MainContent activeTab={activeTab} />
      </div>
    </div>
  )
}
