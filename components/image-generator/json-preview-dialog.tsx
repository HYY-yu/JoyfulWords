"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Textarea } from "@/components/ui/base/textarea"
import { Label } from "@/components/ui/base/label"
import { Loader2Icon, CopyIcon, CheckIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import type { CreatorConfig } from "@/components/image-generator/types"

interface JsonPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: CreatorConfig
  onGenerateImage?: (prompt: string) => void
}

export function JsonPreviewDialog({
  open,
  onOpenChange,
  config,
  onGenerateImage,
}: JsonPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState("")
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()
  const { t } = useTranslation()

  // 弹框打开时自动转换提示词
  useEffect(() => {
    if (open) {
      convertPrompt()
    }
  }, [open])

  const convertPrompt = async () => {
    setIsLoading(true)
    setEnhancedPrompt("")
    setCopied(false)

    try {
      const result = await imageGenerationClient.convertPrompt(config)

      if ("error" in result) {
        throw new Error(String(result.error))
      }

      setEnhancedPrompt(result.enhanced_prompt)
      toast({
        title: t("imageGeneration.jsonPreviewDialog.toast.convertSuccess"),
      })
    } catch (error) {
      console.error("[JSON Preview Dialog] Failed to convert prompt:", error)
      toast({
        variant: "destructive",
        title: t("imageGeneration.jsonPreviewDialog.toast.convertFailed"),
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt)
      setCopied(true)
      toast({
        title: t("imageGeneration.jsonPreviewDialog.toast.copySuccess"),
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[JSON Preview Dialog] Failed to copy:", error)
    }
  }

  const handleGenerateImage = () => {
    if (enhancedPrompt && onGenerateImage) {
      onGenerateImage(enhancedPrompt)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("imageGeneration.jsonPreviewDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("imageGeneration.jsonPreviewDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* 左侧：JSON 配置 */}
          <div className="flex flex-col">
            <Label className="mb-2">
              {t("imageGeneration.jsonPreviewDialog.jsonLabel")}
            </Label>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[400px]">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>

          {/* 右侧：专业提示词 */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label>{t("imageGeneration.jsonPreviewDialog.promptLabel")}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!enhancedPrompt || isLoading}
                className="h-6 px-2"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3 w-3 mr-1" />
                    {t("imageGeneration.jsonPreviewDialog.copiedButton")}
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3 w-3 mr-1" />
                    {t("imageGeneration.jsonPreviewDialog.copyButton")}
                  </>
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[400px] border rounded-md bg-muted/30">
                <div className="flex flex-col items-center gap-2">
                  <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t("imageGeneration.jsonPreviewDialog.convertingButton")}
                  </span>
                </div>
              </div>
            ) : (
              <Textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                placeholder={t("imageGeneration.jsonPreviewDialog.convertingButton")}
                className="min-h-[400px] resize-none font-mono text-sm"
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleGenerateImage}
            disabled={!enhancedPrompt || isLoading}
          >
            {t("imageGeneration.jsonPreviewDialog.generateImageButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
