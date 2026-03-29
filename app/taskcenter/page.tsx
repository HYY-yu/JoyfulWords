"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TaskCenterPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到 dashboard 页面，并设置 activeTab 为 taskcenter
    router.push("/dashboard")
    // 设置 localStorage 以便 dashboard 页面能正确显示任务中心
    if (typeof window !== "undefined") {
      localStorage.setItem("joyfulwords-active-tab", "taskcenter")
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
