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
import { Separator } from "@/components/ui/separator"
import {
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  Globe,
  Languages,
  UploadCloud,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Article, ArticleImage, ReferenceLink } from "./article-types"
import { useToast } from "@/hooks/use-toast"

interface ContentPreviewDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContentPreviewDialog({ article, open, onOpenChange }: ContentPreviewDialogProps) {
  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={article.status === 'published' ? 'default' : article.status === 'draft' ? 'secondary' : 'outline'}>
                {article.status === 'published' ? '已发布' : article.status === 'draft' ? '草稿' : '已归档'}
              </Badge>
              <span>创建于 {article.createdAt}</span>
              <span>•</span>
              <span>修改于 {article.modifiedAt}</span>
            </div>

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.map((tag, index) => (
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
  if (article.images.length === 0) return null

  const currentImage = article.images[currentImageIndex]
  const hasMultipleImages = article.images.length > 1

  const copyImageUrl = () => {
    navigator.clipboard.writeText(currentImage.url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title} - 图片库</DialogTitle>
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
                  onClick={() => setCurrentImageIndex(Math.min(article.images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === article.images.length - 1}
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
                    {currentImageIndex + 1} / {article.images.length}
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
              {article.images.map((image, index) => (
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

export function LinksDialog({ article, open, onOpenChange }: LinksDialogProps) {
  const { toast } = useToast()

  if (!article) return null
  if (article.referenceLinks.length === 0) return null

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      description: "链接已复制到剪贴板"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title} - 引用链接</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {article.referenceLinks.map((link, index) => (
              <div key={link.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{link.title}</h4>
                    {link.description && (
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 truncate block mt-2"
                    >
                      {link.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(link.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
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
  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            确定要删除文章《{article.title}》吗？此操作无法撤销。
          </p>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">{article.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              创建于 {article.createdAt}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            删除文章
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>发布管理</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Doing 中...</h3>
            <p className="text-sm text-muted-foreground">
              发布管理功能正在开发中，敬请期待
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            我知道了
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>多语言翻译</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <Languages className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Doing 中...</h3>
            <p className="text-sm text-muted-foreground">
              多语言翻译功能正在开发中，敬请期待
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            我知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}