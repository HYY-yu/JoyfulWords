"use client"

import type React from "react"

import { useState } from "react"
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

type MaterialType = "Info" | "News" | "Image"

type Material = {
  id: string
  name: string
  type: MaterialType
  link: string
  content: string
  createdAt: string
}

type MaterialLogType = "info" | "news" | "image"

type MaterialLogStatus = "doing" | "success" | "failed"

type MaterialLog = {
  id: string
  type: MaterialLogType
  status: MaterialLogStatus
  createdAt: string
  updatedAt: string
}

const searchTabs: { id: MaterialType; key: string; icon: any }[] = [
  { id: "Info", key: "info", icon: FileTextIcon },
  { id: "News", key: "news", icon: NewspaperIcon },
  { id: "Image", key: "image", icon: ImageIcon },
]

const materialLogTypes: { id: MaterialLogType; label: string }[] = [
  { id: "info", label: "Info" },
  { id: "news", label: "News" },
  { id: "image", label: "Image" },
]

const mockMaterials: Material[] = [
  {
    id: "1",
    name: "AI技术发展报告2024",
    type: "Info",
    link: "https://example.com/ai-report-2024",
    content: "详细介绍了2024年人工智能技术的最新发展趋势和应用案例...",
    createdAt: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    name: "OpenAI发布GPT-5新闻",
    type: "News",
    link: "https://example.com/gpt5-news",
    content: "OpenAI正式发布了GPT-5模型,性能比前代提升了3倍...",
    createdAt: "2024-02-20 14:15:00",
  },
  {
    id: "3",
    name: "科技产品宣传图",
    type: "Image",
    link: "https://example.com/tech-product.jpg",
    content: "高清科技产品宣传海报,适合用于社交媒体营销",
    createdAt: "2024-03-10 09:45:00",
  },
]

const mockMaterialLogs: MaterialLog[] = [
  {
    id: "1",
    type: "info",
    status: "success",
    createdAt: "2024-01-15 10:30:00",
    updatedAt: "2024-01-15 10:35:00",
  },
  {
    id: "2",
    type: "news",
    status: "doing",
    createdAt: "2024-02-20 14:15:00",
    updatedAt: "2024-02-20 14:15:00",
  },
  {
    id: "3",
    type: "image",
    status: "failed",
    createdAt: "2024-03-10 09:45:00",
    updatedAt: "2024-03-10 09:50:00",
  },
  {
    id: "4",
    type: "info",
    status: "doing",
    createdAt: "2024-04-05 16:20:00",
    updatedAt: "2024-04-05 16:20:00",
  },
]

export function MaterialSearch() {
  const { t } = useTranslation()
  const [activeDataTab, setActiveDataTab] = useState<"materials" | "logs">("materials")
  const [activeSearchTab, setActiveSearchTab] = useState<MaterialType>("Info")
  const [materials, setMaterials] = useState<Material[]>(mockMaterials)
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>(mockMaterialLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all")
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all")
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "Info" as "Info" | "Image",
    content: "",
    imageFile: null as File | null,
    imageUrl: "",
  })
  const [uploadErrors, setUploadErrors] = useState<{ name?: string; content?: string }>({})
  const [imagePreview, setImagePreview] = useState<string>("")

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(nameFilter.toLowerCase())
    const matchesType = filterType === "all" || material.type === filterType
    return matchesSearch && matchesType
  })

  const filteredMaterialLogs = materialLogs.filter((log) => {
    const matchesType = logTypeFilter === "all" || log.type === logTypeFilter
    const matchesStatus = logStatusFilter === "all" || log.status === logStatusFilter
    return matchesType && matchesStatus
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Simulate API call - replace with actual search API later
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock search results
    const searchResults: Material[] = [
      {
        id: Date.now().toString(),
        name: `${searchQuery} - 搜索结果1`,
        type: activeSearchTab,
        link: `https://example.com/search/${encodeURIComponent(searchQuery)}-1`,
        content: `关于"${searchQuery}"的详细内容和分析，包含最新的研究成果和数据...`,
        createdAt: new Date().toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      },
      {
        id: (Date.now() + 1).toString(),
        name: `${searchQuery} - 搜索结果2`,
        type: activeSearchTab,
        link: `https://example.com/search/${encodeURIComponent(searchQuery)}-2`,
        content: `更多关于"${searchQuery}"的相关信息，提供了全面的视角和深入的见解...`,
        createdAt: new Date().toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      },
    ]

    setMaterials([...searchResults, ...materials])
    setIsSearching(false)
    setSearchQuery("")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleDelete = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id))
    setDeletingId(null)
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
  }

  const handleSaveEdit = () => {
    if (editingMaterial) {
      setMaterials(materials.map((m) => (m.id === editingMaterial.id ? editingMaterial : m)))
      setEditingMaterial(null)
    }
  }

  const handleUploadSubmit = () => {
    const errors: { name?: string; content?: string } = {}
    if (!uploadForm.name.trim()) {
      errors.name = t("contentWriting.materials.errors.nameRequired")
    }

    // 验证内容字段
    if (uploadForm.type === "Info" && !uploadForm.content.trim()) {
      errors.content = t("contentWriting.materials.errors.contentRequired")
    }
    if (uploadForm.type === "Image" && !uploadForm.imageFile) {
      errors.content = t("contentWriting.materials.errors.imageRequired")
    }

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      return
    }

    // 处理图片上传
    let imageUrl = ""
    let content = uploadForm.content

    if (uploadForm.type === "Image" && uploadForm.imageFile) {
      // 在实际应用中，这里应该上传到服务器并获取 URL
      // 现在我们使用 createObjectURL 作为演示
      imageUrl = URL.createObjectURL(uploadForm.imageFile)
      content = `[Image: ${uploadForm.imageFile.name}]`
    }

    const newMaterial: Material = {
      id: Date.now().toString(),
      name: uploadForm.name,
      type: uploadForm.type,
      link: imageUrl || "",
      content: content,
      createdAt: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    }

    setMaterials([newMaterial, ...materials])
    setShowUploadDialog(false)
    setUploadForm({
      name: "",
      type: "Info",
      content: "",
      imageFile: null,
      imageUrl: "",
    })
    setUploadErrors({})
    setImagePreview("")
  }

  const handleUploadCancel = () => {
    setShowUploadDialog(false)
    setUploadForm({
      name: "",
      type: "Info",
      content: "",
      imageFile: null,
      imageUrl: "",
    })
    setUploadErrors({})
    setImagePreview("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        setUploadErrors({ content: t("contentWriting.materials.errors.invalidImageType") })
        return
      }
      // 验证文件大小 (例如限制为 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setUploadErrors({ content: t("contentWriting.materials.errors.imageTooLarge") })
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
    setUploadForm({ ...uploadForm, imageFile: null, imageUrl: "" })
    setImagePreview("")
    setUploadErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Search Bar with Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="space-y-4">
          {/* Search Tabs */}
          <div className="flex gap-2">
            {searchTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeSearchTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSearchTab(tab.id)}
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
                  {t(`contentWriting.materials.types.${tab.key}`)}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t("contentWriting.materials.searchPlaceholder").replace("{type}", t(`contentWriting.materials.types.${searchTabs.find(st => st.id === activeSearchTab)?.key || 'info'}`))}
                className="pl-10 pr-24 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9"
              >
                {isSearching ? (
                  <>
                    <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    {t("contentWriting.materials.searchingBtn")}
                  </>
                ) : (
                  t("contentWriting.materials.searchBtn")
                )}
              </Button>
            </div>

            {isSearching && (
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
                      <SelectItem value="Info">{t("contentWriting.materials.types.info")}</SelectItem>
                      <SelectItem value="News">{t("contentWriting.materials.types.news")}</SelectItem>
                      <SelectItem value="Image">{t("contentWriting.materials.types.image")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">{t("contentWriting.materials.totalCount").replace("{count}", filteredMaterials.length.toString())}</div>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
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
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t("contentWriting.materials.table.noData")}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium">{material.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {t(`contentWriting.materials.types.${searchTabs.find(st => st.id === material.type)?.key || 'info'}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <a
                      href={material.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate block max-w-[200px]"
                    >
                      {material.link}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-md">
                    <div className="line-clamp-2">{material.content}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{material.createdAt}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(material)} className="h-8 w-8 p-0">
                        <PencilIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(material.id)}
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
                    {materialLogTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {t(`contentWriting.materials.logs.types.${type.id}`)}
                      </SelectItem>
                    ))}
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
                {t("contentWriting.materials.logs.totalCount").replace("{count}", filteredMaterialLogs.length.toString())}
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
                  {filteredMaterialLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        {t("contentWriting.materials.logs.table.noData")}
                      </td>
                    </tr>
                  ) : (
                    filteredMaterialLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm font-medium">{log.id}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {t(`contentWriting.materials.logs.types.${log.type}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.status === "success"
                                ? "bg-green-500/10 text-green-600"
                                : log.status === "doing"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {t(`contentWriting.materials.logs.status.${log.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{log.createdAt}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{log.updatedAt}</td>
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
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("contentWriting.materials.dialog.typeLabel")}</label>
                <Select
                  value={editingMaterial.type}
                  onValueChange={(value) => setEditingMaterial({ ...editingMaterial, type: value as MaterialType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Info">{t("contentWriting.materials.types.info")}</SelectItem>
                    <SelectItem value="News">{t("contentWriting.materials.types.news")}</SelectItem>
                    <SelectItem value="Image">{t("contentWriting.materials.types.image")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("contentWriting.materials.dialog.linkLabel")}</label>
                <Input
                  value={editingMaterial.link}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, link: e.target.value })}
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
            <Button variant="outline" onClick={() => setEditingMaterial(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("contentWriting.materials.dialog.saveBtn")}</Button>
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
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
            <Button variant="outline" onClick={handleUploadCancel}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUploadSubmit}>
              <UploadIcon className="w-4 h-4 mr-2" />
              {t("contentWriting.materials.uploadBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
