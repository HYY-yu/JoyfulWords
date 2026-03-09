"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Copy, Check } from "lucide-react"

interface PromptPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: string
}

export function PromptPreviewDialog({
  open,
  onOpenChange,
  prompt,
}: PromptPreviewDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      toast({
        title: t("imageGeneration.promptPreview.copied"),
      })

      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("imageGeneration.promptPreview.copyFailed"),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("imageGeneration.promptPreview.title")}</DialogTitle>
          <DialogDescription>
            {t("imageGeneration.promptPreview.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Prompt 内容 */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm whitespace-pre-wrap break-words">
              {prompt}
            </p>
          </div>

          {/* 复制按钮 */}
          <Button
            onClick={handleCopy}
            className="w-full"
            variant={copied ? "default" : "outline"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t("imageGeneration.promptPreview.copied")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                {t("imageGeneration.promptPreview.copy")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
