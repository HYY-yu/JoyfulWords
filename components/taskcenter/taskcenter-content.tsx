"use client"

import { TaskCenterBrowser } from "./taskcenter-browser"

export function TaskCenterContent() {
  return (
    <div className="h-full p-8">
      <TaskCenterBrowser />
    </div>
  )
}
