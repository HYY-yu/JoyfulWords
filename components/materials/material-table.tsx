import { SearchIcon, LoaderIcon, UploadIcon, PencilIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const getMaterialTypeLabel = (type: MaterialType) => {
    return t(`contentWriting.materials.types.${type}`)
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
                {t("contentWriting.materials.table.link")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.table.content")}
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
                  <td className="py-3 px-4 text-sm">
                    {material.source_url ? (
                      <a
                        href={material.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block max-w-[200px]"
                      >
                        {material.source_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-md">
                    <div className="line-clamp-2">
                      {material.material_type === "image" ? (
                        <a
                          href={material.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {material.content}
                        </a>
                      ) : (
                        material.content
                      )}
                    </div>
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
    </div>
  )
}
