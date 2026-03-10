"use client"

import { Cpu } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Label } from "@/components/ui/base/label"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface ModelSelectorProps {
  selectedModel: string
  availableModels: string[]
  isLoading: boolean
  onModelChange: (model: string) => void
}

export function ModelSelector({
  selectedModel,
  availableModels,
  isLoading,
  onModelChange,
}: ModelSelectorProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          {t("imageGeneration.properties.model")}
        </Label>
        <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  if (availableModels.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          {t("imageGeneration.properties.model")}
        </Label>
        <div className="h-9 w-full border border-input rounded-md flex items-center px-3 text-sm text-muted-foreground">
          {t("imageGeneration.model.noModelsAvailable")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="model-select" className="text-sm text-muted-foreground">
        {t("imageGeneration.properties.model")}
      </Label>
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={availableModels.length === 0}
      >
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue placeholder={t("imageGeneration.model.selectPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
