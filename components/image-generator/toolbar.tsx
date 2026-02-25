"use client"

import type { ToolType } from "./types"
import { MousePointer2, Square, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  selectedTool: ToolType
  onToolSelect: (tool: ToolType) => void
}

const toolButtons = [
  { id: "select" as const, icon: MousePointer2, label: "选择" },
  { id: "rectangle" as const, icon: Square, label: "矩形" },
  { id: "delete" as const, icon: Trash2, label: "删除" },
]

export function Toolbar({ selectedTool, onToolSelect }: ToolbarProps) {
  return (
    <div className="w-16 border-r border-border bg-muted/30 flex flex-col items-center py-4 gap-2">
      {toolButtons.map((tool) => (
        <Button
          key={tool.id}
          variant={selectedTool === tool.id ? "default" : "ghost"}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-xl transition-all duration-200",
            selectedTool === tool.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-muted-foreground/10"
          )}
          onClick={() => onToolSelect(tool.id)}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
        </Button>
      ))}
    </div>
  )
}
