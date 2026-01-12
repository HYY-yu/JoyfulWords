import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { MaterialLog, MaterialType } from "@/lib/api/materials/types"
import { STATUS_COLOR_CONFIG } from "@/lib/api/materials/enums"

interface MaterialLogTableProps {
  materialLogs: MaterialLog[]
  logTypeFilter: string
  setLogTypeFilter: (type: string) => void
  logStatusFilter: string
  setLogStatusFilter: (status: string) => void
  // 分页相关
  pagination: { page: number; pageSize: number; total: number }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  t: (key: string) => string
}

export function MaterialLogTable({
  materialLogs,
  logTypeFilter,
  setLogTypeFilter,
  logStatusFilter,
  setLogStatusFilter,
  pagination,
  onPageChange,
  onPageSizeChange,
  t,
}: MaterialLogTableProps) {
  const getMaterialTypeLabel = (type: MaterialType) => {
    return t(`contentWriting.materials.types.${type}`)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("contentWriting.materials.logs.filterType")}
          </span>
          <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("contentWriting.materials.logs.types.all")}</SelectItem>
              <SelectItem value="info">{t("contentWriting.materials.logs.types.info")}</SelectItem>
              <SelectItem value="news">{t("contentWriting.materials.logs.types.news")}</SelectItem>
              <SelectItem value="image">{t("contentWriting.materials.logs.types.image")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("contentWriting.materials.logs.filterStatus")}
          </span>
          <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("contentWriting.materials.logs.status.all")}</SelectItem>
              <SelectItem value="doing">{t("contentWriting.materials.logs.status.doing")}</SelectItem>
              <SelectItem value="success">{t("contentWriting.materials.logs.status.success")}</SelectItem>
              <SelectItem value="failed">{t("contentWriting.materials.logs.status.failed")}</SelectItem>
              <SelectItem value="nodata">{t("contentWriting.materials.logs.status.nodata")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MaterialsLog Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.logs.table.id")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.logs.table.type")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.logs.table.status")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.logs.table.createdAt")}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                {t("contentWriting.materials.logs.table.updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {materialLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.materials.logs.table.noData")}
                </td>
              </tr>
            ) : (
              materialLogs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium">{log.id}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getMaterialTypeLabel(log.material_type)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLOR_CONFIG[log.status].bg
                      } ${STATUS_COLOR_CONFIG[log.status].text}`}
                    >
                      {t(`contentWriting.materials.logs.status.${log.status}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(log.updated_at).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("contentWriting.materials.pagination.totalInfo").replace("{total}", String(pagination.total)).replace("{page}", String(pagination.page))}
          </div>
          <div className="flex items-center gap-4">
            {/* 页大小选择 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("contentWriting.materials.pagination.perPage")}</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                  onPageSizeChange(Number(value))
                  onPageChange(1)
                }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{t("contentWriting.materials.pagination.items")}</span>
            </div>

            {/* 分页按钮 */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              <div className="text-sm text-foreground min-w-[80px] text-center">
                {pagination.page} {t("contentWriting.materials.pagination.pageOf")} {Math.ceil(pagination.total / pagination.pageSize)}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
