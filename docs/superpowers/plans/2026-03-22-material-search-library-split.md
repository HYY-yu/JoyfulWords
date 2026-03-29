# 素材搜索拆分为搜索和素材库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有的"素材搜索"主 tab 拆分为"搜索"和"素材库"两个独立主 tab。

**Architecture:** 从现有 `MaterialSearch` 组件中提取逻辑，分别创建 `MaterialSearchTab`（搜索 + 生成记录）和 `MaterialLibraryTab`（分类素材库 + 上传），两个组件各自实例化 `useMaterials` hook。修改 `ContentWriting` 主组件的 tab 配置。

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Shadcn/ui, i18n

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/materials/material-search-tab.tsx` | 搜索 tab：搜索栏 + 生成记录列表 |
| Create | `components/materials/material-library-tab.tsx` | 素材库 tab：分类 tab 切换 + 素材列表 + 上传 |
| Modify | `components/content-writing.tsx` | 主 tab 配置：替换 material-search 为 search + material-library |
| Modify | `lib/i18n/locales/zh.ts` | 新增 tab 翻译键 |
| Modify | `lib/i18n/locales/en.ts` | 新增 tab 翻译键 |
| Delete | `components/materials/material-search.tsx` | 功能已拆分，删除旧组件 |

---

### Task 1: 添加 i18n 翻译键

**Files:**
- Modify: `lib/i18n/locales/zh.ts:68-73`
- Modify: `lib/i18n/locales/en.ts:68-73`

- [ ] **Step 1: 在 zh.ts 中添加新 tab 键值**

在 `contentWriting.tabs` 对象中添加 `search` 和 `materialLibrary`，删除 `materialSearch`：

```typescript
tabs: {
    search: "搜索",
    materialLibrary: "素材库",
    competitorTracking: "竞品跟踪",
    articleWriting: "文章撰写",
    articleManager: "文章管理",
},
```

- [ ] **Step 2: 在 en.ts 中同步修改**

```typescript
tabs: {
    search: "Search",
    materialLibrary: "Material Library",
    competitorTracking: "Competitor Tracking",
    articleWriting: "Article Writing",
    articleManager: "Article Manager",
},
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/locales/zh.ts lib/i18n/locales/en.ts
git commit -m "feat: 添加搜索和素材库 tab 的 i18n 翻译键"
```

---

### Task 2: 创建搜索 Tab 组件

**Files:**
- Create: `components/materials/material-search-tab.tsx`

从 `material-search.tsx` 提取搜索 + 生成记录逻辑。该组件只包含搜索栏和生成记录表格，不包含素材库。

- [ ] **Step 1: 创建 MaterialSearchTab 组件**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialSearchBar } from "@/components/materials/material-search-bar"
import { MaterialLogTable } from "@/components/materials/material-log-table"

export function MaterialSearchTab() {
  const { t } = useTranslation()

  const {
    materialLogs,
    searching,
    pagination,
    fetchSearchLogs,
    handleSearch,
    updatePagination,
  } = useMaterials()

  // 搜索栏状态
  const [activeSearchTab, setActiveSearchTab] = useState("Info")
  const [searchQuery, setSearchQuery] = useState("")

  // 日志筛选状态
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all")
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all")

  // 初始加载搜索日志
  useEffect(() => {
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }, [fetchSearchLogs, logTypeFilter, logStatusFilter])

  const onSearch = async () => {
    const success = await handleSearch(searchQuery, activeSearchTab)
    if (success) {
      setSearchQuery("")
    }
  }

  const handleLogsPageChange = (page: number) => {
    updatePagination('logs', { page })
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }

  const handleLogsPageSizeChange = (pageSize: number) => {
    updatePagination('logs', { pageSize, page: 1 })
    fetchSearchLogs(logTypeFilter, logStatusFilter)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 搜索栏 */}
      <div className="shrink-0">
        <MaterialSearchBar
          activeSearchTab={activeSearchTab}
          setActiveSearchTab={setActiveSearchTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searching={searching}
          onSearch={onSearch}
          t={t}
        />
      </div>

      {/* 生成记录 */}
      <div className="flex-1 min-h-0">
        <MaterialLogTable
          materialLogs={materialLogs}
          logTypeFilter={logTypeFilter}
          setLogTypeFilter={setLogTypeFilter}
          logStatusFilter={logStatusFilter}
          setLogStatusFilter={setLogStatusFilter}
          pagination={pagination.logs}
          onPageChange={handleLogsPageChange}
          onPageSizeChange={handleLogsPageSizeChange}
          t={t}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/materials/material-search-tab.tsx
git commit -m "feat: 创建独立的搜索 Tab 组件"
```

---

### Task 3: 创建素材库 Tab 组件

**Files:**
- Create: `components/materials/material-library-tab.tsx`

新组件包含三个分类 tab（资料/新闻/图片），每个分类下展示对应类型的素材列表。上传按钮自动绑定当前分类。

- [ ] **Step 1: 创建 MaterialLibraryTab 组件**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialTable } from "@/components/materials/material-table"
import { MaterialDialogs } from "@/components/materials/material-dialogs"
import { SEARCH_TAB_OPTIONS } from "@/lib/api/materials/enums"
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
    // 将 activeCategory ("info"/"image") 映射为 UploadForm 的 type ("Info"/"Image")
    // 注意：news 类型在上传中不支持，回退到 Info
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
```

- [ ] **Step 2: 修改 MaterialTable 添加 hideTypeFilter prop**

在 `components/materials/material-table.tsx` 的 `MaterialTableProps` 接口中添加可选的 `hideTypeFilter?: boolean` 属性，当为 `true` 时隐藏类型筛选下拉框（因为素材库已经通过顶部 tab 切换分类了）。

在 `MaterialTableProps` 接口添加：
```typescript
hideTypeFilter?: boolean
```

在组件参数解构中添加 `hideTypeFilter`。

在 filterBar 的 JSX 中，用条件渲染包裹类型筛选的 `<div>`：
```typescript
{!hideTypeFilter && (
  <div className="flex items-center gap-2">
    {/* 类型筛选 Select 保持不变 */}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/materials/material-library-tab.tsx components/materials/material-table.tsx
git commit -m "feat: 创建素材库 Tab 组件，支持分类切换和自动类型绑定"
```

---

### Task 4: 修改主 Tab 配置

**Files:**
- Modify: `components/content-writing.tsx`

- [ ] **Step 1: 更新 import 和 tab 配置**

替换 `MaterialSearch` import 为两个新组件：

```typescript
// 删除这行
import { MaterialSearch } from "./materials/material-search"

// 添加这两行
import { MaterialSearchTab } from "./materials/material-search-tab"
import { MaterialLibraryTab } from "./materials/material-library-tab"
```

添加 `DatabaseIcon` 到 lucide-react import（用作素材库图标）:
```typescript
import { SearchIcon, TrendingUpIcon, PenToolIcon, NotebookTabs, FileTextIcon, DatabaseIcon } from "lucide-react"
```

修改 `tabs` 数组，将 `material-search` 替换为 `search` 和 `material-library`：

```typescript
const tabs = [
  { id: "article-writing", label: t("contentWriting.tabs.articleWriting"), icon: PenToolIcon },
  { id: "article-manager", label: t("contentWriting.tabs.articleManager"), icon: NotebookTabs },
  { id: "search", label: t("contentWriting.tabs.search"), icon: SearchIcon },
  { id: "material-library", label: t("contentWriting.tabs.materialLibrary"), icon: DatabaseIcon },
  { id: "competitor-tracking", label: t("contentWriting.tabs.competitorTracking"), icon: TrendingUpIcon },
]
```

- [ ] **Step 2: 更新 tab 内容渲染**

替换 tab content 区域的条件渲染：

```typescript
{activeTab === "search" ? (
  <MaterialSearchTab />
) : activeTab === "material-library" ? (
  <MaterialLibraryTab />
) : activeTab === "competitor-tracking" ? (
  <CompetitorTracking />
) : activeTab === "article-writing" ? (
  <ArticleWriting key={currentArticleId || 'new'} articleId={currentArticleId} />
) : activeTab === "article-manager" ? (
  <ArticleManager onNavigateToWriting={handleNavigateToWriting} />
) : (
  /* fallback placeholder 保持不变 */
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/content-writing.tsx
git commit -m "feat: 主 tab 配置拆分素材搜索为搜索和素材库"
```

---

### Task 5: 删除旧组件并验证

**Files:**
- Delete: `components/materials/material-search.tsx`

- [ ] **Step 1: 确认没有其他文件引用 MaterialSearch**

```bash
grep -r "material-search" --include="*.tsx" --include="*.ts" components/ lib/ app/ | grep -v "material-search-bar" | grep -v "material-search-tab"
```

如果只有 `material-search.tsx` 自身，安全删除。

- [ ] **Step 2: 删除旧文件**

```bash
rm components/materials/material-search.tsx
```

- [ ] **Step 3: 运行构建验证**

```bash
pnpm build
```

确保没有编译错误。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: 删除已拆分的 MaterialSearch 旧组件"
```
