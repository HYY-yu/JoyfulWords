import { useState, useEffect, useCallback } from "react"
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
import { UI_TAB_TO_API_TYPE } from "@/lib/api/materials/enums"

// Re-export types for use in other modules
export type { Material, MaterialLog, MaterialType, MaterialStatus } from "@/lib/api/materials/types"

export interface UploadForm {
  name: string
  type: "Info" | "Image"
  content: string
  imageFile: File | null
  imageUrl: string
}

export interface UploadErrors {
  name?: string
  content?: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface MaterialsState {
  materials: Material[]
  materialLogs: MaterialLog[]
  materialsPagination: PaginationState
  logsPagination: PaginationState
}

export function useMaterials() {
  const { toast } = useToast()

  // ==================== 状态管理 ====================

  const [materials, setMaterials] = useState<Material[]>([])
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [, setHasActivePolling] = useState(false)
  const [pagination, setPagination] = useState<{
    materials: { page: number; pageSize: number; total: number }
    logs: { page: number; pageSize: number; total: number }
  }>({
    materials: { page: 1, pageSize: 10, total: 0 },
    logs: { page: 1, pageSize: 10, total: 0 },
  })

  // 更新分页的辅助函数
  const updatePagination = useCallback(
    (type: 'materials' | 'logs', updates: Partial<{ page: number; pageSize: number }>) => {
      setPagination((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
      }))
    },
    []
  )

  // 编辑和删除状态
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 上传状态
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    name: "",
    type: "Info",
    content: "",
    imageFile: null,
    imageUrl: "",
  })
  const [uploadErrors, setUploadErrors] = useState<UploadErrors>({})
  const [imagePreview, setImagePreview] = useState<string>("")

  // 搜索轮询
  let pollingInterval: NodeJS.Timeout | null = null

  // ==================== 数据获取 ====================

  const fetchMaterials = useCallback(
    async (nameFilter?: string, filterType?: string) => {
      setLoading(true)

      const result = await materialsClient.getMaterials({
        page: pagination.materials.page,
        page_size: pagination.materials.pageSize,
        name: nameFilter || undefined,
        type: filterType && filterType !== "all" ? (filterType as MaterialType) : undefined,
      })

      setLoading(false)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "获取素材列表失败",
          description: result.error,
        })
        return false
      } else {
        setMaterials(result.list)
        setPagination((prev) => ({
          ...prev,
          materials: { ...prev.materials, total: result.total },
        }))
        return true
      }
    },
    [pagination.materials.page, pagination.materials.pageSize, toast]
  )

  const fetchSearchLogs = useCallback(
    async (logTypeFilter?: string, logStatusFilter?: string) => {
      const result = await materialsClient.getSearchLogs({
        page: pagination.logs.page,
        page_size: pagination.logs.pageSize,
        type: logTypeFilter && logTypeFilter !== "all" ? (logTypeFilter as MaterialType) : undefined,
        status:
          logStatusFilter && logStatusFilter !== "all"
            ? (logStatusFilter as MaterialStatus)
            : undefined,
      })

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "获取搜索日志失败",
          description: result.error,
        })
        return false
      } else {
        setMaterialLogs(result.list)
        setPagination((prev) => ({
          ...prev,
          logs: { ...prev.logs, total: result.total },
        }))
        return true
      }
    },
    [pagination.logs.page, pagination.logs.pageSize, toast]
  )

  // ==================== 搜索功能 ====================

  const startSearchPolling = useCallback(() => {
    // 清除之前的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // 设置轮询状态
    setHasActivePolling(true)

    // 立即执行一次
    checkSearchStatus()

    // 设置轮询
    pollingInterval = setInterval(async () => {
      const completed = await checkSearchStatus()

      if (completed) {
        stopSearchPolling()
      }
    }, 3000) // 每 3 秒轮询一次
  }, [])

  const stopSearchPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    setHasActivePolling(false)
    setSearching(false)
  }, [])

  const checkSearchStatus = useCallback(async (): Promise<boolean> => {
    const result = await materialsClient.getSearchLogs({
      page: 1,
      page_size: 10,
      status: "doing", // 只查询进行中的搜索
    })

    if ("error" in result) {
      console.error("Failed to check search status:", result.error)
      return false
    }

    // 每次轮询都刷新搜索日志列表（让用户看到最新状态）
    await fetchSearchLogs()

    // 如果没有进行中的搜索，说明搜索已完成
    const allCompleted = result.list.length === 0

    if (allCompleted) {
      // 刷新素材列表
      await fetchMaterials()

      toast({
        title: "搜索完成",
        description: "素材搜索已完成，已自动加载到列表中",
      })
    }

    return allCompleted
  }, [fetchMaterials, fetchSearchLogs, toast])

  const handleSearch = useCallback(
    async (searchQuery: string, activeSearchTab: string) => {
      if (!searchQuery.trim()) return

      setSearching(true)

      // 映射 UI Tab 到 API 枚举值
      const materialType = UI_TAB_TO_API_TYPE[activeSearchTab]

      const result = await materialsClient.search(materialType, searchQuery)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "搜索启动失败",
          description: result.error,
        })
        setSearching(false)
        return false
      }

      // 搜索任务创建成功，立即解锁搜索 bar（允许用户继续输入）
      setSearching(false)

      // 显示提示并开始后台轮询
      toast({
        title: "搜索已启动",
        description: "AI 正在搜索相关素材，请稍候...",
      })

      startSearchPolling()
      return true
    },
    [startSearchPolling, toast]
  )

  // ==================== CRUD 操作 ====================

  const handleDelete = useCallback(async (id: number) => {
    setLoading(true)

    const result = await materialsClient.deleteMaterial(id)

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "删除素材失败",
        description: result.error,
      })
      return false
    }

    toast({
      title: "素材删除成功",
    })

    // 从列表中移除
    setMaterials((prev) => prev.filter((m) => m.id !== id))

    // 关闭删除确认对话框
    setDeletingId(null)

    return true
  }, [toast])

  const handleEdit = useCallback((material: Material) => {
    setEditingMaterial(material)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingMaterial) return false

    setLoading(true)

    const result = await materialsClient.updateMaterial(editingMaterial.id, {
      title: editingMaterial.title,
      source_url: editingMaterial.source_url,
      content: editingMaterial.content,
    })

    setLoading(false)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "更新素材失败",
        description: result.error,
      })
      return false
    }

    toast({
      title: "素材更新成功",
    })

    // 关闭编辑对话框
    setEditingMaterial(null)

    return true
  }, [editingMaterial, toast])

  // ==================== 上传功能 ====================

  const handleUploadSubmit = useCallback(async () => {
    // 表单验证
    const errors: UploadErrors = {}

    if (!uploadForm.name.trim()) {
      errors.name = "请输入素材名称"
    }

    if (uploadForm.type === "Info" && !uploadForm.content.trim()) {
      errors.content = "请输入素材内容"
    }

    if (uploadForm.type === "Image" && !uploadForm.imageFile) {
      errors.content = "请选择图片文件"
    }

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      return false
    }

    setLoading(true)
    setUploadErrors({})

    try {
      let content = uploadForm.content
      const materialType = uploadForm.type.toLowerCase() as MaterialType

      // 如果是图片类型，先上传图片到 R2
      if (materialType === "image" && uploadForm.imageFile) {
        const presignedResult = await materialsClient.getPresignedUrl(
          uploadForm.imageFile.name,
          uploadForm.imageFile.type
        )

        if ("error" in presignedResult) {
          throw new Error(presignedResult.error)
        }

        // 上传文件到 R2
        const uploadSuccess = await uploadFileToPresignedUrl(
          presignedResult.upload_url,
          uploadForm.imageFile,
          uploadForm.imageFile.type
        )

        if (!uploadSuccess) {
          throw new Error("图片上传失败")
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

      if ("error" in createResult) {
        throw new Error(createResult.error)
      }

      // 成功
      toast({
        title: "素材创建成功",
        description: `素材 "${uploadForm.name}" 已成功添加到列表`,
      })

      // 关闭对话框并重置表单
      setShowUploadDialog(false)
      setUploadForm({
        name: "",
        type: "Info",
        content: "",
        imageFile: null,
        imageUrl: "",
      })
      setImagePreview("")

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "创建素材失败"

      toast({
        variant: "destructive",
        title: "创建素材失败",
        description: errorMessage,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [uploadForm, toast])

  const handleUploadCancel = useCallback(() => {
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
  }, [])

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, t: (key: string) => string) => {
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

        setUploadForm((prev) => ({ ...prev, imageFile: file }))
        setUploadErrors({})

        // 创建预览
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    []
  )

  const handleRemoveImage = useCallback(() => {
    setUploadForm((prev) => ({ ...prev, imageFile: null, imageUrl: "" }))
    setImagePreview("")
    setUploadErrors({})
  }, [])

  // 清理轮询
  useEffect(() => {
    return () => {
      stopSearchPolling()
    }
  }, [stopSearchPolling])

  return {
    // 状态
    materials,
    materialLogs,
    loading,
    searching,
    pagination,
    editingMaterial,
    deletingId,
    showUploadDialog,
    uploadForm,
    uploadErrors,
    imagePreview,

    // Setters
    setEditingMaterial,
    setDeletingId,
    setShowUploadDialog,
    setUploadForm,
    setUploadErrors,
    setImagePreview,

    // 数据获取
    fetchMaterials,
    fetchSearchLogs,

    // 搜索
    handleSearch,

    // CRUD
    handleDelete,
    handleEdit,
    handleSaveEdit,

    // 上传
    handleUploadSubmit,
    handleUploadCancel,
    handleImageChange,
    handleRemoveImage,

    // 分页
    updatePagination,
  }
}
