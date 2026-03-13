"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/base/dialog"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Loader2, Image as ImageIcon } from "lucide-react"

interface ImageMaterial {
  id: number
  title: string
  source_url: string
}

interface MaterialSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materials: ImageMaterial[]
  isLoading: boolean
  onSelect: (url: string) => void
  currentUrl?: string
}

export function MaterialSelectorDialog({
  open,
  onOpenChange,
  materials,
  isLoading,
  onSelect,
  currentUrl,
}: MaterialSelectorDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("imageGeneration.properties.selectReferenceImage")}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("imageGeneration.properties.noImageMaterials")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              {materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => {
                    onSelect(material.source_url)
                    onOpenChange(false)
                  }}
                  className={`
                    relative aspect-square rounded-lg border-2 overflow-hidden
                    hover:border-primary transition-colors group
                    ${currentUrl === material.source_url ? "border-primary" : "border-border"}
                  `}
                >
                  <img
                    src={material.source_url}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm p-2 text-center line-clamp-2">
                      {material.title}
                    </p>
                  </div>
                  {currentUrl === material.source_url && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
