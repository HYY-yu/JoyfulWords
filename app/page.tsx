"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("content-writing")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 ml-64">
        <MainContent activeTab={activeTab} />
      </div>
    </div>
  )
}
