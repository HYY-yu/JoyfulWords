"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  SearchIcon,
  FileTextIcon,
  NewspaperIcon,
  ImageIcon,
  UploadIcon,
  PencilIcon,
  TrashIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  materialsClient,
  uploadFileToPresignedUrl,
} from "@/lib/api/materials/client"
import type {
  Material,
  MaterialLog,
  MaterialType,
  MaterialStatus,
} from "@/lib/api/materials/types"
import {
  SEARCH_TAB_OPTIONS,
  UI_TAB_TO_API_TYPE,
  STATUS_COLOR_CONFIG,
} from "@/lib/api/materials/enums"

export function MaterialSearch() {
  const { t } = useTranslation()
  const { toast } = useToast()

  // ==================== 状态管理 ====================

  // Tab 状态
  const [activeDataTab, setActiveDataTab] = useState<"materials" | "logs">("materials")
  const [activeSearchTab, setActiveSearchTab] = useState("Info")

  // 数据状态（使用 API 类型）
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>([])

  // 加载和搜索状态
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // 分页状态
  const [pagination, setPagination] = useState({
    materials: { page: 1, pageSize: 20, total: 0 },
    logs: { page: 1, pageSize: 20, total: 0 },
  })

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all")
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all")

  // 编辑和删除状态
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 上传状态
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "Info" as "Info" | "Image",
    content: "",
    imageFile: null as File | null,
    imageUrl: "",
  })
  const [uploadErrors, setUploadErrors] = useState<{ name?: string; content?: string }>({})
  const [imagePreview, setImagePreview] = useState<string>("")

  // ==================== 数据获取 ====================

  /**
   * 获取素材列表
   * 支持按名称和类型筛选
   */
  const fetchMaterials = async () => {
    setLoading(true)

    const result = await materialsClient.getMaterials({
      page: pagination.materials.page,
      page_size: pagination.materials.pageSize,
      name: nameFilter || undefined,
      type: filterType !== 'all' ? filterType as MaterialType : undefined,
    })

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '获取素材列表失败',
        description: result.error,
      })
    } else {
      setMaterials(result.list)
      setPagination(prev => ({
        ...prev,
        materials: { ...prev.materials, total: result.total },
      }))
    }
  }

  /**
   * 获取搜索日志列表
   * 支持按类型和状态筛选
   */
  const fetchSearchLogs = async () => {
    const result = await materialsClient.getSearchLogs({
      page: pagination.logs.page,
      page_size: pagination.logs.pageSize,
      type: logTypeFilter !== 'all' ? logTypeFilter as MaterialType : undefined,
      status: logStatusFilter !== 'all' ? logStatusFilter as MaterialStatus : undefined,
    })

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '获取搜索日志失败',
        description: result.error,
      })
    } else {
      setMaterialLogs(result.list)
      setPagination(prev => ({
        ...prev,
        logs: { ...prev.logs, total: result.total },
      }))
    }
  }

  // 监听筛选条件变化，自动刷新数据
  useEffect(() => {
    if (activeDataTab === 'materials') {
      fetchMaterials()
    } else {
      fetchSearchLogs()
    }
  }, [filterType, nameFilter, logTypeFilter, logStatusFilter, activeDataTab])

  // 组件初始加载时获取数据
  useEffect(() => {
    fetchMaterials()
  }, [])

  // ==================== 搜索功能 ====================

  /**
   * 触发素材搜索
   * 1. 调用 API 触发搜索
   * 2. 开始轮询搜索状态
   * 3. 搜索完成后刷新素材列表
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)

    // 映射 UI Tab 到 API 枚举值
    const materialType = UI_TAB_TO_API_TYPE[activeSearchTab]

    const result = await materialsClient.search(materialType, searchQuery)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '搜索启动失败',
        description: result.error,
      })
      setSearching(false)
      return
    }

    // 搜索任务创建成功，开始轮询搜索状态
    toast({
      title: '搜索已启动',
      description: 'AI 正在搜索相关素材，请稍候...',
    })

    setSearchQuery('')
    startSearchPolling()
  }

  /**
   * 轮询搜索状态
   * 每 3 秒检查一次搜索进度
   * 当所有搜索任务完成时停止轮询
   */
  let pollingInterval: NodeJS.Timeout | null = null

  const startSearchPolling = () => {
    // 清除之前的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // 立即执行一次
    checkSearchStatus()

    // 设置轮询
    pollingInterval = setInterval(async () => {
      const completed = await checkSearchStatus()

      if (completed) {
        stopSearchPolling()
      }
    }, 3000) // 每 3 秒轮询一次
  }

  const stopSearchPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    setSearching(false)
  }

  /**
   * 检查搜索状态
   * @returns boolean - 是否所有搜索都已完成
   */
  const checkSearchStatus = async (): Promise<boolean> => {
    const result = await materialsClient.getSearchLogs({
      page: 1,
      page_size: 10,
      status: 'doing', // 只查询进行中的搜索
    })

    if ('error' in result) {
      console.error('Failed to check search status:', result.error)
      return false
    }

    // 如果没有进行中的搜索，说明搜索已完成
    const allCompleted = result.list.length === 0

    if (allCompleted) {
      // 刷新素材列表和搜索日志
      await Promise.all([
        fetchMaterials(),
        fetchSearchLogs(),
      ])

      toast({
        title: '搜索完成',
        description: '素材搜索已完成，已自动加载到列表中',
      })

      // 切换到素材列表 tab
      setActiveDataTab('materials')
    }

    return allCompleted
  }

  // 组件卸载时清除轮询
  useEffect(() => {
    return () => {
      stopSearchPolling()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  // ==================== 素材 CRUD 操作 ====================

  /**
   * 删除素材
   */
  const handleDelete = async (id: number) => {
    setLoading(true)

    const result = await materialsClient.deleteMaterial(id)

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '删除素材失败',
        description: result.error,
      })
      return
    }

    toast({
      title: '素材删除成功',
    })

    // 从列表中移除
    setMaterials(materials.filter(m => m.id !== id))

    // 关闭删除确认对话框
    setDeletingId(null)

    // 刷新列表（更新总数）
    await fetchMaterials()
  }

  /**
   * 编辑素材
   */
  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
  }

  /**
   * 保存素材编辑
   */
  const handleSaveEdit = async () => {
    if (!editingMaterial) return

    setLoading(true)

    const result = await materialsClient.updateMaterial(editingMaterial.id, {
      title: editingMaterial.title,
      source_url: editingMaterial.source_url,
      content: editingMaterial.content,
    })

    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '更新素材失败',
        description: result.error,
      })
      return
    }

    toast({
      title: '素材更新成功',
    })

    // 刷新素材列表
    await fetchMaterials()

    // 关闭编辑对话框
    setEditingMaterial(null)
  }

  /**
   * 处理素材上传提交
   * 支持 Info（文本）和 Image（图片）两种类型
   */
  const handleUploadSubmit = async () => {
    // 表单验证
    const errors: { name?: string; content?: string } = {}

    if (!uploadForm.name.trim()) {
      errors.name = t('contentWriting.materials.errors.nameRequired')
    }

    if (uploadForm.type === 'Info' && !uploadForm.content.trim()) {
      errors.content = t('contentWriting.materials.errors.contentRequired')
    }

    if (uploadForm.type === 'Image' && !uploadForm.imageFile) {
      errors.content = t('contentWriting.materials.errors.imageRequired')
    }

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      return
    }

    setLoading(true)
    setUploadErrors({})

    try {
      let content = uploadForm.content
      const materialType = uploadForm.type.toLowerCase() as MaterialType

      // 如果是图片类型，先上传图片到 R2
      if (materialType === 'image' && uploadForm.imageFile) {
        const presignedResult = await materialsClient.getPresignedUrl(
          uploadForm.imageFile.name,
          uploadForm.imageFile.type
        )

        if ('error' in presignedResult) {
          throw new Error(presignedResult.error)
        }

        // 上传文件到 R2
        const uploadSuccess = await uploadFileToPresignedUrl(
          presignedResult.upload_url,
          uploadForm.imageFile,
          uploadForm.imageFile.type
        )

        if (!uploadSuccess) {
          throw new Error('图片上传失败')
        }

        // 使用返回的 file_url 作为素材内容
        content = presignedResult.file_url
      }

      // 创建素材记录
      const createResult = await materialsClient.createMaterial({
        title: uploadForm.name,
        material_type: materialType,
        content,
      })

      if ('error' in createResult) {
        throw new Error(createResult.error)
      }

      // 成功
      toast({
        title: '素材创建成功',
        description: `素材 "${uploadForm.name}" 已成功添加到列表`,
      })

      // 刷新素材列表
      await fetchMaterials()

      // 关闭对话框并重置表单
      setShowUploadDialog(false)
      setUploadForm({
        name: '',
        type: 'Info',
        content: '',
        imageFile: null,
        imageUrl: '',
      })
      setImagePreview('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建素材失败'

      toast({
        variant: 'destructive',
        title: '创建素材失败',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadCancel = () => {
    setShowUploadDialog(false)
    setUploadForm({
      name: '',
      type: 'Info',
      content: '',
      imageFile: null,
      imageUrl: '',
    })
    setUploadErrors({})
    setImagePreview('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setUploadErrors({ content: t('contentWriting.materials.errors.invalidImageType') })
        return
      }
      // 验证文件大小 (例如限制为 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setUploadErrors({ content: t('contentWriting.materials.errors.imageTooLarge') })
        return
      }

      setUploadForm({ ...uploadForm, imageFile: file })
      setUploadErrors({})

      // 创建预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setUploadForm({ ...uploadForm, imageFile: null, imageUrl: '' })
    setImagePreview('')
    setUploadErrors({})
  }

  // ==================== 辅助函数 ====================

  /**
   * 获取素材类型显示文本
   */
  const getMaterialTypeLabel = (type: MaterialType) => {
    return t(`contentWriting.materials.types.${type}`)
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-6">
      {/* Search Bar with Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="space-y-4">
          {/* Search Tabs */}
          <div className="flex gap-2">
            {SEARCH_TAB_OPTIONS.map((tab) => {
              const Icon = tab.i18nKey === 'info' ? FileTextIcon : tab.i18nKey === 'news' ? NewspaperIcon : ImageIcon
              const isActive = activeSearchTab === tab.uiLabel
              return (
                <button
                  key={tab.uiLabel}
                  onClick={() => setActiveSearchTab(tab.uiLabel)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {t(`contentWriting.materials.types.${tab.i18nKey}`)}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t("contentWriting.materials.searchPlaceholder").replace("{type}", t(`contentWriting.materials.types.${activeSearchTab.toLowerCase()}`))}
                className="pl-10 pr-24 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={searching}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9"
              >
                {searching ? (
                  <>
                    <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    {t("contentWriting.materials.searchingBtn")}
                  </>
                ) : (
                  t("contentWriting.materials.searchBtn")
                )}
              </Button>
            </div>

            {searching && (
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-md animate-in slide-in-from-top-2 fade-in duration-300">
                <LoaderIcon className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">{t("contentWriting.materials.aiSearching")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-border/60" />

      {/* Data Tables */}
      <div className="space-y-4">
        {/* Table Tabs */}
        <div className="flex gap-2 border-b border-border/50">
          <button
            onClick={() => setActiveDataTab("materials")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "materials"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {t("contentWriting.materials.logs.tabs.materials")}
          </button>
          <button
            onClick={() => setActiveDataTab("logs")}
            className={`
              px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${
                activeDataTab === "logs"
                  ? "text-primary border-primary bg-primary/5"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {t("contentWriting.materials.logs.tabs.logs")}
          </button>
        </div>

        {/* Materials Table Section */}
        {activeDataTab === "materials" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.materials.filterName")}</span>
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
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.materials.filterType")}</span>
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
                <div className="text-sm text-muted-foreground">{t("contentWriting.materials.totalCount").replace("{count}", materials.length.toString())}</div>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} className="gap-2" disabled={loading}>
                <UploadIcon className="w-4 h-4" />
                {t("contentWriting.materials.uploadBtn")}
              </Button>
            </div>

            {/* Materials Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.name")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.type")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.link")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.content")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.time")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.table.actions")}</th>
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
                      <tr key={material.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
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
                            {material.material_type === 'image' ? (
                              <a href={material.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {material.content}
                              </a>
                            ) : (
                              material.content
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(material.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(material)} className="h-8 w-8 p-0" disabled={loading}>
                              <PencilIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(material.id)}
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
        )}

        {/* MaterialsLog Table Section */}
        {activeDataTab === "logs" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filter Bar */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.materials.logs.filterType")}</span>
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t("contentWriting.materials.logs.filterStatus")}</span>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.logs.table.id")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.logs.table.type")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.logs.table.status")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.logs.table.createdAt")}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("contentWriting.materials.logs.table.updatedAt")}</th>
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
                          {new Date(log.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.updated_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.materials.dialog.editTitle")}</DialogTitle>
            <DialogDescription>{t("contentWriting.materials.dialog.editDesc")}</DialogDescription>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("contentWriting.materials.dialog.nameLabel")}</label>
                <Input
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("contentWriting.materials.dialog.linkLabel")}</label>
                <Input
                  value={editingMaterial.source_url}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, source_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("contentWriting.materials.dialog.contentLabel")}</label>
                <textarea
                  value={editingMaterial.content}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, content: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMaterial(null)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? <LoaderIcon className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("contentWriting.materials.dialog.saveBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contentWriting.materials.dialog.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contentWriting.materials.dialog.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? <LoaderIcon className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.materials.dialog.uploadTitle")}</DialogTitle>
            <DialogDescription>{t("contentWriting.materials.dialog.uploadDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-name">
                {t("contentWriting.materials.dialog.nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-name"
                placeholder={t("contentWriting.materials.dialog.namePlaceholder")}
                value={uploadForm.name}
                onChange={(e) => {
                  setUploadForm({ ...uploadForm, name: e.target.value })
                  if (uploadErrors.name) {
                    setUploadErrors({ ...uploadErrors, name: undefined })
                  }
                }}
                className={uploadErrors.name ? "border-destructive" : ""}
              />
              {uploadErrors.name && <p className="text-sm text-destructive">{uploadErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-type">{t("contentWriting.materials.dialog.typeLabel")}</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => {
                  setUploadForm({ ...uploadForm, type: value as "Info" | "Image", content: "", imageFile: null, imageUrl: "" })
                  setImagePreview("")
                  setUploadErrors({})
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">{t("contentWriting.materials.types.info")}</SelectItem>
                  <SelectItem value="Image">{t("contentWriting.materials.types.image")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {uploadForm.type === "Info"
                  ? t("contentWriting.materials.dialog.typeHintInfo")
                  : t("contentWriting.materials.dialog.typeHintImage")}
              </p>
            </div>

            {/* Info 类型：文本输入框 */}
            {uploadForm.type === "Info" && (
              <div className="space-y-2">
                <Label htmlFor="upload-content">
                  {t("contentWriting.materials.dialog.contentLabel")} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="upload-content"
                  placeholder={t("contentWriting.materials.dialog.contentPlaceholder")}
                  value={uploadForm.content}
                  onChange={(e) => {
                    setUploadForm({ ...uploadForm, content: e.target.value })
                    if (uploadErrors.content) {
                      setUploadErrors({ ...uploadErrors, content: undefined })
                    }
                  }}
                  className={`min-h-[150px] resize-none ${uploadErrors.content ? "border-destructive" : ""}`}
                />
                {uploadErrors.content && <p className="text-sm text-destructive">{uploadErrors.content}</p>}
              </div>
            )}

            {/* Image 类型：图片上传组件 */}
            {uploadForm.type === "Image" && (
              <div className="space-y-2">
                <Label>
                  {t("contentWriting.materials.dialog.imageLabel")} <span className="text-destructive">*</span>
                </Label>

                {/* 上传区域 */}
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{t("contentWriting.materials.dialog.uploadHint")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("contentWriting.materials.dialog.uploadFormatHint")}</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" asChild>
                          <span>
                            <UploadIcon className="w-4 h-4 mr-2" />
                            {t("contentWriting.materials.dialog.selectImageBtn")}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* 预览区域 */
                  <div className="border border-border rounded-lg p-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-contain bg-muted rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        {t("contentWriting.materials.dialog.removeImageBtn")}
                      </Button>
                    </div>
                    {uploadForm.imageFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("contentWriting.materials.dialog.fileName")} {uploadForm.imageFile.name} ({(uploadForm.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {uploadErrors.content && <p className="text-sm text-destructive">{uploadErrors.content}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleUploadCancel} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUploadSubmit} disabled={loading}>
              {loading ? <LoaderIcon className="w-4 h-4 mr-2 animate-spin" /> : <UploadIcon className="w-4 h-4 mr-2" />}
              {t("contentWriting.materials.uploadBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
