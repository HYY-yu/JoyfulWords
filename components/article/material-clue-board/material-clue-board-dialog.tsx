"use client"

import { useCallback, useEffect, useState } from "react"
import { Network, Search, XIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { MaterialClueCanvas } from "./canvas"

interface MaterialClueBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuery: string
  articleId?: number | null
  onMaterialAdded?: () => void
}

export function MaterialClueBoardDialog({
  open,
  onOpenChange,
  initialQuery,
  articleId,
  onMaterialAdded,
}: MaterialClueBoardDialogProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(initialQuery)
  const [rootQuery, setRootQuery] = useState("")
  const [resetToken, setResetToken] = useState(0)

  useEffect(() => {
    if (!open) return
    const nextQuery = initialQuery.trim()
    setInputValue(initialQuery)
    if (nextQuery) {
      setRootQuery(nextQuery)
      setResetToken((value) => value + 1)
      console.info("[MaterialClueBoard] opened with initial query", { query: nextQuery })
    }
  }, [initialQuery, open])

  const handleStart = useCallback(() => {
    const nextQuery = inputValue.trim()
    if (!nextQuery) return
    setRootQuery(nextQuery)
    setResetToken((value) => value + 1)
    console.info("[MaterialClueBoard] manual root query submitted", { query: nextQuery })
  }, [inputValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl [&>button]:hidden">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Network className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold">
                {t("contentWriting.materialPanel.clueBoardTitle")}
              </DialogTitle>
              <p className="truncate text-xs text-muted-foreground">
                {t("contentWriting.materialPanel.clueBoardDescription")}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 md:ml-auto md:max-w-xl">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleStart()
              }}
              placeholder={t("contentWriting.materialPanel.clueBoardInputPlaceholder")}
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleStart}
              disabled={!inputValue.trim()}
              className="h-9 shrink-0"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              {t("contentWriting.materialPanel.clueBoardStart")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 shrink-0 rounded-full"
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {rootQuery.trim() ? (
            <MaterialClueCanvas
              rootQuery={rootQuery}
              resetToken={resetToken}
              articleId={articleId}
              onMaterialAdded={onMaterialAdded}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20 px-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Network className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {t("contentWriting.materialPanel.clueBoardEmptyTitle")}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {t("contentWriting.materialPanel.clueBoardEmptyDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
