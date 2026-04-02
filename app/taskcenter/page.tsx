"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TaskCenterPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到 articles 页面，并透传任务中心参数能力
    router.push("/articles?tab=taskcenter")
    // 保留 localStorage 标记，便于后续页面消费该状态
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
