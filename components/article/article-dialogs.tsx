"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ExternalLink,
  Trash2,
  Copy,
  Languages,
  UploadCloud,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Article, ArticleImage, ReferenceLink, parseTags } from "./article-types"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface ContentPreviewDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContentPreviewDialog({ article, open, onOpenChange }: ContentPreviewDialogProps) {
  if (!article) return null

  const tags = parseTags(article.tags)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {article.content}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface ImageGalleryDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageGalleryDialog({ article, open, onOpenChange }: ImageGalleryDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!article) return null
  // 从 materials 中提取 type=image 的素材
  const images = article.materials?.filter(m => m.type === 'image').map(m => ({
    id: m.id,
    url: m.content || '',
    alt: m.title,
    caption: '',
  })) || []
  if (images.length === 0) return null

  const currentImage = images[currentImageIndex]
  const hasMultipleImages = images.length > 1

  const copyImageUrl = () => {
    navigator.clipboard.writeText(currentImage.url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main image display */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="w-full h-auto max-h-[60vh] object-contain"
            />

            {/* Navigation buttons */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === images.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Image info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentImage.alt}</p>
                {currentImage.caption && (
                  <p className="text-sm text-muted-foreground">{currentImage.caption}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasMultipleImages && (
                  <span className="text-sm text-muted-foreground">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={copyImageUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Thumbnail grid */}
          {hasMultipleImages && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface LinksDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MaterialsLinksDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaterialsLinksDialog({ article, open, onOpenChange }: MaterialsLinksDialogProps) {
  const { t } = useTranslation()

  if (!article) return null
  // 过滤出非图片类型的素材
  const materials = article.materials?.filter(m => m.type !== 'image') || []
  if (materials.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("contentWriting.articleDialogs.materialsLinks.title")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {t("contentWriting.articleDialogs.materialsLinks.type")}:
                      </span>
                      <span className="text-xs font-medium">
                        {material.type === 'info' ? t("contentWriting.materials.types.info") : t("contentWriting.materials.types.news")}
                      </span>
                    </div>
                    <h4 className="font-medium truncate">{material.title}</h4>
                    {material.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {material.content}
                      </p>
                    )}
                    // FIXME: 后端返回的 source_url 是一个逗号分割的字符串，如果字符串存在，需要设计成 Link1 \ Link2 \ Link3 ... 这种 badge 形式，可以点击，点击即可跳转。
                    // Link+index 
                    {material.source_url && (
                      <a
                        href={material.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 truncate block mt-2"
                      >
                        {material.source_url}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface PostsDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostsDialog({ article, open, onOpenChange }: PostsDialogProps) {
  const { t } = useTranslation()

  if (!article) return null
  const posts = article.posts || []
  if (posts.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("contentWriting.articleDialogs.posts.title")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {t("contentWriting.articleDialogs.posts.platform")}:
                      </span>
                      <span className="text-xs font-medium">{post.platform}</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-3">
                      {post.content}
                    </p>
                    {post.author_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        作者: {post.author_name}
                      </p>
                    )}
                    {post.original_link && (
                      <a
                        href={post.original_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("contentWriting.articleDialogs.posts.viewOriginal")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ article, open, onOpenChange, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useTranslation()

  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contentWriting.articleDialogs.deleteConfirm.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">{article.title}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("contentWriting.articleDialogs.deleteConfirm.cancelBtn")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("contentWriting.articleDialogs.deleteConfirm.confirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PublishManagementDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishManagementDialog({ article, open, onOpenChange }: PublishManagementDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contentWriting.articleDialogs.publishManagement.title")}</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t("contentWriting.articleDialogs.publishManagement.statusTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("contentWriting.articleDialogs.publishManagement.statusDesc")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t("contentWriting.articleDialogs.publishManagement.confirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TranslationDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TranslationDialog({ article, open, onOpenChange }: TranslationDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contentWriting.articleDialogs.translation.title")}</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <Languages className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t("contentWriting.articleDialogs.translation.statusTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("contentWriting.articleDialogs.translation.statusDesc")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t("contentWriting.articleDialogs.translation.confirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}