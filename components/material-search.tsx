"use client"

import type React from "react"

import { useState } from "react"
import {
  SearchIcon,
  FileTextIcon,
  NewspaperIcon,
  ImageIcon,
  DatabaseIcon,
  UploadIcon,
  PencilIcon,
  TrashIcon,
  LoaderIcon,
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

type MaterialType = "资料" | "新闻" | "图片" | "数据" | "用户"

type Material = {
  id: string
  name: string
  type: MaterialType
  link: string
  content: string
  createdAt: string
}

const searchTabs: { id: MaterialType; label: string; icon: any }[] = [
  { id: "资料", label: "资料", icon: FileTextIcon },
  { id: "新闻", label: "新闻", icon: NewspaperIcon },
  { id: "图片", label: "图片", icon: ImageIcon },
  { id: "数据", label: "数据", icon: DatabaseIcon },
]

const mockMaterials: Material[] = [
  {
    id: "1",
    name: "AI技术发展报告2024",
    type: "资料",
    link: "https://example.com/ai-report-2024",
    content: "详细介绍了2024年人工智能技术的最新发展趋势和应用案例...",
    createdAt: "2024-01-15 10:30:00",
  },
  {
    id: "2",
    name: "OpenAI发布GPT-5新闻",
    type: "新闻",
    link: "https://example.com/gpt5-news",
    content: "OpenAI正式发布了GPT-5模型,性能比前代提升了3倍...",
    createdAt: "2024-02-20 14:15:00",
  },
  {
    id: "3",
    name: "科技产品宣传图",
    type: "图片",
    link: "https://example.com/tech-product.jpg",
    content: "高清科技产品宣传海报,适合用于社交媒体营销",
    createdAt: "2024-03-10 09:45:00",
  },
  {
    id: "4",
    name: "2024年市场数据分析",
    type: "数据",
    link: "https://example.com/market-data-2024",
    content: "包含全年市场趋势、用户行为、销售数据等综合分析...",
    createdAt: "2024-04-05 16:20:00",
  },
  {
    id: "5",
    name: "用户上传的案例研究",
    type: "用户",
    link: "https://example.com/case-study",
    content: "某企业数字化转型的完整案例研究和经验总结",
    createdAt: "2024-05-12 11:00:00",
  },
]

export function MaterialSearch() {
  const [activeSearchTab, setActiveSearchTab] = useState<MaterialType>("资料")
  const [materials, setMaterials] = useState<Material[]>(mockMaterials)
  const [searchQuery, setSearchQuery] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    name: "",
    link: "",
    content: "",
  })
  const [uploadErrors, setUploadErrors] = useState<{ name?: string; content?: string }>({})

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(nameFilter.toLowerCase())
    const matchesType = filterType === "all" || material.type === filterType
    return matchesSearch && matchesType
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
      errors.name = "素材名称不能为空"
    }
    if (!uploadForm.content.trim()) {
      errors.content = "素材内容不能为空"
    }

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      return
    }

    const newMaterial: Material = {
      id: Date.now().toString(),
      name: uploadForm.name,
      type: "用户",
      link: uploadForm.link,
      content: uploadForm.content,
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
    setUploadForm({ name: "", link: "", content: "" })
    setUploadErrors({})
  }

  const handleUploadCancel = () => {
    setShowUploadDialog(false)
    setUploadForm({ name: "", link: "", content: "" })
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
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={`搜索${activeSearchTab}...`}
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
                    搜索中...
                  </>
                ) : (
                  "搜索"
                )}
              </Button>
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-md animate-in slide-in-from-top-2 fade-in duration-300">
                <LoaderIcon className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">AI 正在全力搜索，请稍候...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-border/60" />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <span className="text-sm text-muted-foreground whitespace-nowrap">素材名称：</span>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索素材名称..."
                className="pl-8 h-9"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">素材类型：</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="资料">资料</SelectItem>
                <SelectItem value="新闻">新闻</SelectItem>
                <SelectItem value="图片">图片</SelectItem>
                <SelectItem value="数据">数据</SelectItem>
                <SelectItem value="用户">用户</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">共 {filteredMaterials.length} 条素材</div>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
          <UploadIcon className="w-4 h-4" />
          上传素材
        </Button>
      </div>

      {/* Materials Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">素材名称</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">素材类型</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">素材链接</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">素材内容</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">创建时间</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  暂无素材数据
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium">{material.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {material.type}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑素材</DialogTitle>
            <DialogDescription>修改素材的详细信息</DialogDescription>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">素材名称</label>
                <Input
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">素材类型</label>
                <Select
                  value={editingMaterial.type}
                  onValueChange={(value) => setEditingMaterial({ ...editingMaterial, type: value as MaterialType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="资料">资料</SelectItem>
                    <SelectItem value="新闻">新闻</SelectItem>
                    <SelectItem value="图片">图片</SelectItem>
                    <SelectItem value="数据">数据</SelectItem>
                    <SelectItem value="用户">用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">素材链接</label>
                <Input
                  value={editingMaterial.link}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, link: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">素材内容</label>
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
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。确定要删除这条素材吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>上传素材</DialogTitle>
            <DialogDescription>添加新的素材到您的素材库</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-name">
                素材名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-name"
                placeholder="请输入素材名称"
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
              <Label htmlFor="upload-type">素材类型</Label>
              <Input id="upload-type" value="用户" disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">用户上传的素材类型自动设置为&quot;用户&quot;</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-link">素材链接（可选）</Label>
              <Input
                id="upload-link"
                placeholder="https://example.com/resource"
                value={uploadForm.link}
                onChange={(e) => setUploadForm({ ...uploadForm, link: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-content">
                素材内容 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="upload-content"
                placeholder="请输入素材内容描述..."
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleUploadCancel}>
              取消
            </Button>
            <Button onClick={handleUploadSubmit}>
              <UploadIcon className="w-4 h-4 mr-2" />
              上传素材
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
