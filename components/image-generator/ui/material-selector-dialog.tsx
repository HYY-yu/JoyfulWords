"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/base/dialog"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Loader2, Image as ImageIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  hasMore: boolean
  onLoadMore: () => Promise<void>
  observerTarget: React.RefObject<HTMLDivElement | null>
  onSelect: (url: string) => void
  currentUrl?: string
}

export function MaterialSelectorDialog({
  open,
  onOpenChange,
  materials,
  isLoading,
  hasMore,
  onLoadMore,
  observerTarget,
  onSelect,
  currentUrl,
}: MaterialSelectorDialogProps) {
  const { t } = useTranslation()

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // 保存滚动位置
  const [scrollPosition, setScrollPosition] = useState(0)

  // 对话框打开时，重置到顶部
  useEffect(() => {
    if (open) {
      setScrollPosition(0)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [open])

  // 数据更新后，恢复滚动位置（只在对话框打开时恢复）
  useEffect(() => {
    if (open && scrollPosition > 0 && scrollContainerRef.current) {
      // 使用 setTimeout 确保在 DOM 更新后恢复滚动位置
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPosition
        }
      }, 0)
    }
  }, [open]) // 只依赖 open，避免数据加载时频繁触发

  // 保存滚动位置的函数
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("imageGeneration.properties.selectReferenceImage")}</DialogTitle>
        </DialogHeader>

        {/* 使用原生 div 替代 ScrollArea，避免滚动位置重置 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-h-[60vh] overflow-y-auto"
        >
          {materials.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("imageGeneration.properties.noImageMaterials")}
              </p>
            </div>
          ) : materials.length === 0 && isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
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

              {/* 无限滚动加载指示器 */}
              {(hasMore || isLoading) && materials.length > 0 && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* 加载完毕提示 */}
              {!hasMore && materials.length > 0 && (
                <div className="flex justify-center py-4">
                  <p className="text-sm text-muted-foreground">
                    {t("imageGeneration.properties.noMoreMaterials")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
