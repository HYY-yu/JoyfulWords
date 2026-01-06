"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialSearchBar } from "@/components/materials/material-search-bar"
import { MaterialTable } from "@/components/materials/material-table"
import { MaterialLogTable } from "@/components/materials/material-log-table"
import { MaterialDialogs } from "@/components/materials/material-dialogs"

export function MaterialSearch() {
  const { t } = useTranslation()

  // 使用自定义 hook 管理所有状态和业务逻辑
  const {
    materials,
    materialLogs,
    loading,
    searching,
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
    fetchSearchLogs,
    handleSearch,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleUploadSubmit,
    handleUploadCancel,
    handleImageChange,
    handleRemoveImage,
  } = useMaterials()

  // Tab 状态
  const [activeDataTab, setActiveDataTab] = useState<"materials" | "logs">("materials")
  const [activeSearchTab, setActiveSearchTab] = useState("Info")

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all")
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all")

  // ==================== 数据获取 ====================

  // 组件初始加载时获取数据
  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  // 监听筛选条件变化，自动刷新数据
  useEffect(() => {
    if (activeDataTab === "materials") {
      fetchMaterials(nameFilter, filterType)
    } else {
      fetchSearchLogs(logTypeFilter, logStatusFilter)
    }
  }, [filterType, nameFilter, logTypeFilter, logStatusFilter, activeDataTab, fetchMaterials, fetchSearchLogs])

  // ==================== 事件处理 ====================

  const onSearch = async () => {
    const success = await handleSearch(searchQuery, activeSearchTab)
    if (success) {
      setSearchQuery("")
      // 自动切换到 logs tab，让用户看到搜索进度
      setActiveDataTab("logs")
    }
  }

  const onDelete = async (id: number) => {
    const success = await handleDelete(id)
    if (success) {
      await fetchMaterials(nameFilter, filterType)
    }
  }

  const onSaveEdit = async () => {
    const success = await handleSaveEdit()
    if (success) {
      await fetchMaterials(nameFilter, filterType)
    }
  }

  const onUploadSubmit = async () => {
    const success = await handleUploadSubmit()
    if (success) {
      await fetchMaterials(nameFilter, filterType)
    }
  }

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e, t)
  }

  const onUploadCancel = () => {
    handleUploadCancel()
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-6">
      {/* Search Bar with Tabs */}
      <MaterialSearchBar
        activeSearchTab={activeSearchTab}
        setActiveSearchTab={setActiveSearchTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searching={searching}
        onSearch={onSearch}
        t={t}
      />

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
          <MaterialTable
            materials={materials}
            loading={loading}
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            filterType={filterType}
            setFilterType={setFilterType}
            onUpload={() => setShowUploadDialog(true)}
            onEdit={handleEdit}
            onDelete={(id) => setDeletingId(id)}
            t={t}
          />
        )}

        {/* MaterialsLog Table Section */}
        {activeDataTab === "logs" && (
          <MaterialLogTable
            materialLogs={materialLogs}
            logTypeFilter={logTypeFilter}
            setLogTypeFilter={setLogTypeFilter}
            logStatusFilter={logStatusFilter}
            setLogStatusFilter={setLogStatusFilter}
            t={t}
          />
        )}
      </div>

      {/* Dialogs */}
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
        onUploadCancel={onUploadCancel}
        onImageChange={onImageChange}
        onRemoveImage={handleRemoveImage}
        loading={loading}
        t={t}
      />
    </div>
  )
}
