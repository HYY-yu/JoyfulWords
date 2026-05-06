"use client"

import type { ToolType } from "../types"
import { LayoutTemplate, MousePointer2, Square, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/base/button"
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
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
      <div className="flex h-full flex-col gap-5">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            {t("imageGeneration.toolbar.template")}
          </div>
          <div className="space-y-2">
            {templateOptions.map((template) => (
              <button
                key={template.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left shadow-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                onClick={() => onApplyTemplate?.(template.id)}
              >
                <div className="shrink-0">{renderTemplatePreview(template.id)}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{template.title}</div>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {template.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {t("imageGeneration.toolbar.tools")}
          </div>
          <div className="grid gap-2">
            {toolButtons.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                className={cn(
                  "h-10 justify-start px-3",
                  selectedTool === tool.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background"
                )}
                onClick={() => onToolSelect(tool.id)}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
                <span>{tool.label}</span>
              </Button>
            ))}
          </div>
        </section>

        <Button
          variant="ghost"
          className="mt-auto justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onReset}
          title={t("imageGeneration.toolbar.reset")}
        >
          <RotateCcw className="h-4 w-4" />
          {t("imageGeneration.toolbar.reset")}
        </Button>
      </div>
    </aside>
  )
}
