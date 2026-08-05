"use client"

/* eslint-disable @next/next/no-img-element */

import { Fragment, useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/base/dialog"
import { Button } from "@/components/ui/base/button"
import { Badge } from "@/components/ui/base/badge"
import { ScrollArea } from "@/components/ui/base/scroll-area"
import { Input } from "@/components/ui/base/input"
import {
  ExternalLink,
  Trash2,
  Copy,
  Languages,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  CheckIcon,
  LoaderIcon,
  XIcon
} from "lucide-react"
import { Article, ArticleImage, ReferenceLink, mergeTags, parseTags, stringifyTags } from "./article-types"
import type { UpdateArticleMetadataRequest } from "@/lib/api/articles/types"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"

/**
 * @deprecated 内容预览对话框已弃用
 * 表格中直接显示内容预览，不再使用弹窗
 * 保留此组件供未来可能的功能使用
 */
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
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
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
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
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
                    {material.source_url && (
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {material.source_url
                          .split(/[,，]/)
                          .map((url, index) => url.trim())
                          .filter(url => url.length > 0)
                          .map((url, index) => (
                            <Fragment key={index}>
                              {index > 0 && <span className="text-xs text-muted-foreground">\</span>}
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-xs text-teal-700 transition-colors hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Link{index + 1}
                              </a>
                            </Fragment>
                          ))}
                      </div>
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

interface EditArticleMetadataDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (articleId: number, metadata: UpdateArticleMetadataRequest) => Promise<void>
  categorySuggestions?: string[]
  tagSuggestions?: string[]
}

export function EditArticleMetadataDialog({
  article,
  open,
  onOpenChange,
  onSave,
  categorySuggestions = [],
  tagSuggestions = [],
}: EditArticleMetadataDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // 当弹窗打开或文章变化时，重置文章元数据。
  useEffect(() => {
    if (article) {
      setTitle(article.title)
      setCategory(article.category ?? "")
      setTags(parseTags(article.tags))
      setTagInput("")
    }
  }, [article, open])

  const handleSave = async () => {
    if (!article || !title.trim()) return

    const nextTags = mergeTags(tags, tagInput)
    const serializedTags = stringifyTags(nextTags)
    if (serializedTags.length > 500) return

    setIsSaving(true)
    try {
      await onSave(article.id, {
        title: title.trim(),
        category: category.trim(),
        tags: serializedTags,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const addPendingTags = () => {
    setTags((currentTags) => mergeTags(currentTags, tagInput))
    setTagInput("")
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addPendingTags()
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((currentTags) => currentTags.slice(0, -1))
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove))
  }

  const serializedTagLength = stringifyTags(mergeTags(tags, tagInput)).length
  const visibleTagSuggestions = tagSuggestions.filter(
    (suggestion) => !tags.some((tag) => tag.toLocaleLowerCase() === suggestion.toLocaleLowerCase())
  ).slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("contentWriting.articleDialogs.editMetadata.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title-input" className="text-sm font-medium">
              {t("contentWriting.articleDialogs.editMetadata.titleLabel")}
            </label>
            <Input
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("contentWriting.articleDialogs.editMetadata.titlePlaceholder")}
              maxLength={200}
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category-input" className="text-sm font-medium">
              {t("contentWriting.articleDialogs.editMetadata.categoryLabel")}
            </label>
            <Input
              id="category-input"
              list="article-category-suggestions"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder={t("contentWriting.articleDialogs.editMetadata.categoryPlaceholder")}
              maxLength={100}
              disabled={isSaving}
            />
            <datalist id="article-category-suggestions">
              {categorySuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags-input" className="text-sm font-medium">
              {t("contentWriting.articleDialogs.editMetadata.tagsLabel")}
            </label>
            <div className="min-h-11 rounded-md border border-input bg-background px-2 py-2 focus-within:ring-2 focus-within:ring-ring">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-background/80"
                      onClick={() => removeTag(tag)}
                      aria-label={t("contentWriting.articleDialogs.editMetadata.removeTag", { tag })}
                      disabled={isSaving}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="tags-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addPendingTags}
                  placeholder={tags.length === 0 ? t("contentWriting.articleDialogs.editMetadata.tagsPlaceholder") : ""}
                  className="h-6 min-w-[150px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{t("contentWriting.articleDialogs.editMetadata.tagsHint")}</span>
              <span className={serializedTagLength > 500 ? "text-destructive" : undefined}>
                {serializedTagLength}/500
              </span>
            </div>
            {visibleTagSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {visibleTagSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    onClick={() => setTags((currentTags) => mergeTags(currentTags, suggestion))}
                    disabled={isSaving}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || serializedTagLength > 500 || isSaving}
          >
            {isSaving ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4 mr-2" />
                {t("common.save")}
              </>
            )}
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

export function PublishManagementDialog({ article: _article, open, onOpenChange }: PublishManagementDialogProps) {
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

export function TranslationDialog({ article: _article, open, onOpenChange }: TranslationDialogProps) {
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
