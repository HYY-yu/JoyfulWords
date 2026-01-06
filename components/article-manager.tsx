"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, LoaderIcon, Eye, FileText, Image as ImageIcon, Link } from "lucide-react"
import { Article, ArticleStatus, mockArticles } from "./article-types"
import {
  ContentPreviewDialog,
  ImageGalleryDialog,
  LinksDialog,
  DeleteConfirmDialog,
  PublishManagementDialog,
  TranslationDialog
} from "./article-dialogs"
import { useToast } from "@/hooks/use-toast"

interface ArticleManagerProps {
  onNavigateToWriting?: () => void
}

export function ArticleManager({ onNavigateToWriting }: ArticleManagerProps = {}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [titleFilter, setTitleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all")

  // Dialog states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [contentPreviewOpen, setContentPreviewOpen] = useState(false)
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false)
  const [linksDialogOpen, setLinksDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [publishManagementOpen, setPublishManagementOpen] = useState(false)
  const [translationDialogOpen, setTranslationDialogOpen] = useState(false)

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Status filter
      if (statusFilter !== "all" && article.status !== statusFilter) {
        return false
      }

      // Title filter
      if (titleFilter) {
        const query = titleFilter.toLowerCase()
        if (!article.title.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })
  }, [articles, titleFilter, statusFilter])

  // Action handlers
  const handleEditArticle = (article: Article) => {
    // Navigate to article writing tab with article ID
    if (onNavigateToWriting) {
      onNavigateToWriting()
      toast({
        description: `${t("common.edit")}: ${article.title}`
      })
    }
  }

  const handleDeleteArticle = (article: Article) => {
    setSelectedArticle(article)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteArticle = () => {
    if (selectedArticle) {
      setArticles(prev => prev.filter(article => article.id !== selectedArticle.id))
      toast({
        description: t("common.delete")
      })
    }
    setDeleteConfirmOpen(false)
    setSelectedArticle(null)
  }

  const handlePublishArticle = (article: Article) => {
    setSelectedArticle(article)
    setPublishManagementOpen(true)
  }

  const handleTranslateArticle = (article: Article) => {
    setSelectedArticle(article)
    setTranslationDialogOpen(true)
  }

  const handlePreviewContent = (article: Article) => {
    setSelectedArticle(article)
    setContentPreviewOpen(true)
  }

  const handleViewImages = (article: Article) => {
    setSelectedArticle(article)
    setImageGalleryOpen(true)
  }

  const handleViewLinks = (article: Article) => {
    setSelectedArticle(article)
    setLinksDialogOpen(true)
  }

  const handleCreateNewArticle = () => {
    // Navigate to article writing tab
    if (onNavigateToWriting) {
      onNavigateToWriting()
      toast({
        description: t("contentWriting.manager.newArticleBtn")
      })
    }
  }

  // Get statistics
  const stats = useMemo(() => {
    const total = articles.length
    const published = articles.filter(a => a.status === 'published').length
    const draft = articles.filter(a => a.status === 'draft').length
    const archived = articles.filter(a => a.status === 'archived').length

    return { total, published, draft, archived }
  }, [articles])

  return (
    <div className="space-y-6">

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.manager.filterTitle")}</span>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("contentWriting.manager.searchTitlePlaceholder")}
                className="pl-8 h-9"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.manager.filterStatus")}</span>
            <Select value={statusFilter} onValueChange={(value: ArticleStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("contentWriting.manager.status.all")}</SelectItem>
                <SelectItem value="published">{t("contentWriting.manager.status.published")}</SelectItem>
                <SelectItem value="draft">{t("contentWriting.manager.status.draft")}</SelectItem>
                <SelectItem value="archived">{t("contentWriting.manager.status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">{t("contentWriting.manager.totalArticles").replace("{count}", filteredArticles.length.toString())}</div>
        </div>
        <Button onClick={handleCreateNewArticle} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          {t("contentWriting.manager.newArticleBtn")}
        </Button>
      </div>

      {/* Articles Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.title")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.content")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.images")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.links")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.created")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.modified")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.manager.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.manager.table.noData")}
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium truncate" title={article.title}>
                        {article.title}
                      </div>
                      <Badge
                        variant={article.status === 'published' ? 'default' : article.status === 'draft' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {article.status === 'published' ? t("contentWriting.manager.status.published") : article.status === 'draft' ? t("contentWriting.manager.status.draft") : t("contentWriting.manager.status.archived")}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 justify-start text-left hover:bg-transparent"
                      onClick={() => handlePreviewContent(article)}
                    >
                      <div className="max-w-md">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{t("contentWriting.manager.clickForDetail")}</span>
                        </div>
                        <div className="text-sm text-foreground line-clamp-2">
                          {article.summary || article.content.substring(0, 100) + '...'}
                        </div>
                      </div>
                    </Button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {article.images.length > 0 ? (
                      <Button
                        variant="ghost"
                        className="h-auto p-0 justify-start hover:bg-transparent"
                        onClick={() => handleViewImages(article)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {article.images.length > 3 ? t("contentWriting.manager.viewAllImages") : t("contentWriting.manager.viewImages")}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {article.images.slice(0, 3).map((image, index) => (
                              <img
                                key={image.id}
                                src={image.url}
                                alt={image.alt}
                                className="w-8 h-8 rounded object-cover border"
                              />
                            ))}
                            {article.images.length > 3 && (
                              <div className="w-8 h-8 rounded bg-muted border flex items-center justify-center text-xs text-muted-foreground">
                                +{article.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("contentWriting.manager.noImages")}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {article.referenceLinks.length > 0 ? (
                      <Button
                        variant="ghost"
                        className="h-auto p-0 justify-start text-left hover:bg-transparent"
                        onClick={() => handleViewLinks(article)}
                      >
                        <div className="max-w-[130px] space-y-1">
                          <div className="flex items-center gap-1">
                            <Link className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t("contentWriting.manager.linksCount").replace("{count}", article.referenceLinks.length.toString())}
                            </span>
                          </div>
                          <p className="text-sm truncate">
                            {article.referenceLinks[0].title}
                          </p>
                        </div>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("contentWriting.manager.noLinks")}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{article.createdAt.split(' ')[0]}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{article.modifiedAt.split(' ')[0]}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditArticle(article)} className="h-8 w-8 p-0">
                        <EditIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArticle(article)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {selectedArticle && (
        <>
          <ContentPreviewDialog
            article={selectedArticle}
            open={contentPreviewOpen}
            onOpenChange={setContentPreviewOpen}
          />

          <ImageGalleryDialog
            article={selectedArticle}
            open={imageGalleryOpen}
            onOpenChange={setImageGalleryOpen}
          />

          <LinksDialog
            article={selectedArticle}
            open={linksDialogOpen}
            onOpenChange={setLinksDialogOpen}
          />

          <DeleteConfirmDialog
            article={selectedArticle}
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={confirmDeleteArticle}
          />

          <PublishManagementDialog
            article={selectedArticle}
            open={publishManagementOpen}
            onOpenChange={setPublishManagementOpen}
          />

          <TranslationDialog
            article={selectedArticle}
            open={translationDialogOpen}
            onOpenChange={setTranslationDialogOpen}
          />
        </>
      )}
    </div>
  )
}