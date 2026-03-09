"use client"

import type { ToolType } from "./types"
import { MousePointer2, Square, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface ToolbarProps {
  selectedTool: ToolType
  onToolSelect: (tool: ToolType) => void
  onReset?: () => void
}

export function Toolbar({ selectedTool, onToolSelect, onReset }: ToolbarProps) {
  const { t } = useTranslation()

  const toolButtons = [
    { id: "select" as const, icon: MousePointer2, label: t("imageGeneration.toolbar.select") },
    { id: "rectangle" as const, icon: Square, label: t("imageGeneration.toolbar.rectangle") },
    { id: "delete" as const, icon: Trash2, label: t("imageGeneration.toolbar.delete") },
  ]

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

      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        onClick={onReset}
        title={t("imageGeneration.toolbar.reset")}
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
    </div>
  )
}
