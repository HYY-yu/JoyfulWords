import { SearchIcon, LoaderIcon, UploadIcon, PencilIcon, TrashIcon, LinkIcon, ExternalLinkIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Material, MaterialType } from "@/lib/api/materials/types"

interface MaterialTableProps {
  materials: Material[]
  loading: boolean
  nameFilter: string
  setNameFilter: (filter: string) => void
  filterType: string
  setFilterType: (type: string) => void
  onUpload: () => void
  onEdit: (material: Material) => void
  onDelete: (id: number) => void
  t: (key: string) => string
}

export function MaterialTable({
  materials,
  loading,
  nameFilter,
  setNameFilter,
  filterType,
  setFilterType,
  onUpload,
  onEdit,
  onDelete,
  t,
}: MaterialTableProps) {
  // 预览状态
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [textPreview, setTextPreview] = useState<{ title: string; content: string } | null>(null)
  const [linkPreview, setLinkPreview] = useState<{ title: string; links: string[] } | null>(null)

  const getMaterialTypeLabel = (type: MaterialType) => {
    return t(`contentWriting.materials.types.${type}`)
  }

  const handleImageClick = (imageUrl: string) => {
    setImagePreview(imageUrl)
  }

  const handleTextClick = (material: Material) => {
    setTextPreview({
      title: material.title,
      content: material.content,
    })
  }

  const handleLinkClick = (material: Material) => {
    if (!material.source_url) return

    // 分割逗号分隔的 URL
    const links = material.source_url
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    setLinkPreview({
      title: material.title,
      links,
    })
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("contentWriting.materials.filterName")}
            </span>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("contentWriting.materials.filterNamePlaceholder")}
                className="pl-8 h-9"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("contentWriting.materials.filterType")}
            </span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("contentWriting.materials.types.all")}</SelectItem>
                <SelectItem value="info">{t("contentWriting.materials.types.info")}</SelectItem>
                <SelectItem value="news">{t("contentWriting.materials.types.news")}</SelectItem>
                <SelectItem value="image">{t("contentWriting.materials.types.image")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {t("contentWriting.materials.totalCount").replace("{count}", materials.length.toString())}
          </div>
        </div>
        <Button onClick={onUpload} className="gap-2" disabled={loading}>
          <UploadIcon className="w-4 h-4" />
          {t("contentWriting.materials.uploadBtn")}
        </Button>
      </div>

      {/* Materials Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.name")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.type")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.content")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.link")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.time")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.materials.table.noData")}
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr
                  key={material.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                >
                  <td className="py-3 px-4 text-sm font-medium">{material.title}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getMaterialTypeLabel(material.material_type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-md">
                    <div className="line-clamp-2">
                      {material.material_type === "image" ? (
                        <div
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(material.content)}
                        >
                          <img
                            src={material.content}
                            alt={material.title}
                            className="h-16 w-16 object-cover rounded-md border border-border"
                          />
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleTextClick(material)}
                          title={t("contentWriting.materials.table.clickToView")}
                        >
                          {material.content}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {material.source_url ? (
                      <div
                        className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                        onClick={() => handleLinkClick(material)}
                        title={t("contentWriting.materials.table.clickToViewLinks")}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>
                          {material.source_url.split(',').filter(url => url.trim()).length} {t("contentWriting.materials.table.links")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(material.created_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(material)}
                        className="h-8 w-8 p-0"
                        disabled={loading}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(material.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={loading}
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

      {/* 图片预览 Dialog */}
      <Dialog open={imagePreview !== null} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.materials.preview.imageTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 文本内容预览 Dialog */}
      <Dialog open={textPreview !== null} onOpenChange={(open) => !open && setTextPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{textPreview?.title}</DialogTitle>
            <DialogDescription>
              {t("contentWriting.materials.preview.textContent")}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/30 rounded-lg">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {textPreview?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 链接列表预览 Dialog */}
      <Dialog open={linkPreview !== null} onOpenChange={(open) => !open && setLinkPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{linkPreview?.title}</DialogTitle>
            <DialogDescription>
              {t("contentWriting.materials.preview.linksTitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/30 rounded-lg">
            <ul className="space-y-2">
              {linkPreview?.links.map((link, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground text-sm mt-0.5 min-w-[20px]">
                    {index + 1}.
                  </span>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary hover:underline break-all flex items-center gap-1.5"
                  >
                    <span className="flex-1">{link}</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
