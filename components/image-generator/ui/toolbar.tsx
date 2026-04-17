"use client"

import type { ToolType } from "../types"
import { useState } from "react"
import { LayoutTemplate, MousePointer2, Square, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/base/popover"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface ToolbarProps {
  selectedTool: ToolType
  onToolSelect: (tool: ToolType) => void
  templateOptions?: Array<{
    id: string
    title: string
    description: string
  }>
  onApplyTemplate?: (templateId: string) => void
  onReset?: () => void
}

export function Toolbar({
  selectedTool,
  onToolSelect,
  templateOptions = [],
  onApplyTemplate,
  onReset,
}: ToolbarProps) {
  const { t } = useTranslation()
  const [templateOpen, setTemplateOpen] = useState(false)

  const renderTemplatePreview = (templateId: string) => {
    if (templateId === "sideBySide") {
      return (
        <div className="grid h-9 w-9 grid-cols-2 gap-1 rounded-md border border-border bg-muted/40 p-1">
          <div className="rounded-[3px] bg-primary/50" />
          <div className="rounded-[3px] bg-primary/25" />
        </div>
      )
    }

    if (templateId === "nestedRectangles") {
      return (
        <div className="relative h-9 w-9 rounded-md border border-border bg-muted/40 p-1">
          <div className="h-full w-full rounded-[3px] border border-primary/50 bg-primary/10" />
          <div className="absolute right-[6px] top-[6px] h-3.5 w-3.5 rounded-[3px] border border-primary/70 bg-primary/25" />
        </div>
      )
    }

    return (
      <div className="grid h-9 w-9 grid-rows-2 gap-1 rounded-md border border-border bg-muted/40 p-1">
        <div className="rounded-[3px] bg-primary/45" />
        <div className="rounded-[3px] bg-primary/20" />
      </div>
    )
  }

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

      <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-xl transition-all duration-200 hover:bg-muted-foreground/10"
            title={t("imageGeneration.toolbar.template")}
          >
            <LayoutTemplate className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-72 p-2">
          <div className="space-y-2">
            <div className="px-2 pt-1">
              <div className="text-sm font-semibold text-foreground">
                {t("imageGeneration.toolbar.template")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("imageGeneration.toolbar.templateHint")}
              </p>
            </div>

            <div className="space-y-1">
              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                  onClick={() => {
                    onApplyTemplate?.(template.id)
                    setTemplateOpen(false)
                  }}
                >
                  <div className="mt-0.5 shrink-0">{renderTemplatePreview(template.id)}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{template.title}</div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

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
