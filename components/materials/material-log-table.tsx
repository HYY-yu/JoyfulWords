import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MaterialLog, MaterialType } from "@/lib/api/materials/types"
import { STATUS_COLOR_CONFIG } from "@/lib/api/materials/enums"

interface MaterialLogTableProps {
  materialLogs: MaterialLog[]
  logTypeFilter: string
  setLogTypeFilter: (type: string) => void
  logStatusFilter: string
  setLogStatusFilter: (status: string) => void
  t: (key: string) => string
}

export function MaterialLogTable({
  materialLogs,
  logTypeFilter,
  setLogTypeFilter,
  logStatusFilter,
  setLogStatusFilter,
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
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("contentWriting.materials.logs.totalCount").replace("{count}", materialLogs.length.toString())}
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
    </div>
  )
}
