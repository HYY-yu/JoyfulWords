"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialTable } from "@/components/materials/material-table"
import { MaterialDialogs } from "@/components/materials/material-dialogs"
import { FileTextIcon, NewspaperIcon, ImageIcon } from "lucide-react"

const CATEGORY_TABS = [
  { id: "info", i18nKey: "info", icon: FileTextIcon },
  { id: "news", i18nKey: "news", icon: NewspaperIcon },
  { id: "image", i18nKey: "image", icon: ImageIcon },
] as const

export function MaterialLibraryTab() {
  const { t } = useTranslation()

  const {
    materials,
    loading,
    pagination,
    editingMaterial,
    deletingId,
    showUploadDialog,
    uploadForm,
    uploadErrors,
    imagePreview,
    setEditingMaterial,
    setDeletingId,
    setShowUploadDialog,
    setUploadForm,
    fetchMaterials,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleUploadSubmit,
    handleUploadCancel,
    handleImageChange,
    handleRemoveImage,
    updatePagination,
  } = useMaterials()

  // 当前选中的分类 tab
  const [activeCategory, setActiveCategory] = useState<string>("info")
  // 名称搜索
  const [nameFilter, setNameFilter] = useState("")

  // 分类切换或筛选变化时刷新数据
  useEffect(() => {
    fetchMaterials(nameFilter, activeCategory)
  }, [fetchMaterials, nameFilter, activeCategory])

  const onDelete = async (id: number) => {
    const success = await handleDelete(id)
    if (success) {
      await fetchMaterials(nameFilter, activeCategory)
    }
  }

  const onSaveEdit = async () => {
    const success = await handleSaveEdit()
    if (success) {
      await fetchMaterials(nameFilter, activeCategory)
    }
  }

  const onUploadSubmit = async () => {
    const success = await handleUploadSubmit()
    if (success) {
      await fetchMaterials(nameFilter, activeCategory)
    }
  }

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e, t)
  }

  // 打开上传对话框时，自动设定素材类型为当前分类
  const handleOpenUpload = () => {
    const uploadType = activeCategory === "image" ? "Image" : "Info"
    setUploadForm((prev) => ({ ...prev, type: uploadType }))
    setShowUploadDialog(true)
  }

  const handleMaterialsPageChange = (page: number) => {
    updatePagination('materials', { page })
    fetchMaterials(nameFilter, activeCategory)
  }

  const handleMaterialsPageSizeChange = (pageSize: number) => {
    updatePagination('materials', { pageSize, page: 1 })
    fetchMaterials(nameFilter, activeCategory)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 分类 Tabs */}
      <div className="shrink-0">
        <div className="flex gap-2">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id)
                  setNameFilter("")
                  updatePagination('materials', { page: 1 })
                }}
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
      </div>

      {/* 素材列表 */}
      <div className="flex-1 min-h-0">
        <MaterialTable
          materials={materials}
          loading={loading}
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
          filterType={activeCategory}
          setFilterType={setActiveCategory}
          onUpload={handleOpenUpload}
          onEdit={handleEdit}
          onDelete={(id) => setDeletingId(id)}
          pagination={pagination.materials}
          onPageChange={handleMaterialsPageChange}
          onPageSizeChange={handleMaterialsPageSizeChange}
          t={t}
          hideTypeFilter={true}
        />
      </div>

      {/* 对话框 */}
      <MaterialDialogs
        editingMaterial={editingMaterial}
        setEditingMaterial={setEditingMaterial}
        onSaveEdit={onSaveEdit}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        onDelete={onDelete}
        showUploadDialog={showUploadDialog}
        setShowUploadDialog={setShowUploadDialog}
        uploadForm={uploadForm}
        setUploadForm={setUploadForm}
        uploadErrors={uploadErrors}
        imagePreview={imagePreview}
        onUploadSubmit={onUploadSubmit}
        onUploadCancel={handleUploadCancel}
        onImageChange={onImageChange}
        onRemoveImage={handleRemoveImage}
        loading={loading}
        t={t}
      />
    </div>
  )
}
