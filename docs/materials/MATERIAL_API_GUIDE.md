# Material API 使用指南

> **目标**: 为开发者提供 Material API 的集成指南和最佳实践
> **状态**: 已完成 ✅
> **创建时间**: 2026-01-05

---

## 📚 目录

1. [快速开始](#快速开始)
2. [组件架构](#组件架构)
3. [API 客户端使用](#api-客户端使用)
4. [类型系统](#类型系统)
5. [枚举常量](#枚举常量)
6. [完整示例](#完整示例)
7. [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 1. 导入依赖

```typescript
// 导入 API 客户端
import { materialsClient, uploadFileToPresignedUrl } from '@/lib/api/materials/client'

// 导入类型
import type {
  Material,
  MaterialLog,
  MaterialType,
  MaterialStatus,
} from '@/lib/api/materials/types'

// 导入枚举
import {
  MATERIAL_TYPES,
  MATERIAL_STATUS,
  UI_TAB_TO_API_TYPE,
  STATUS_COLOR_CONFIG,
} from '@/lib/api/materials/enums'
```

### 2. 基础使用

```typescript
// 获取素材列表
const result = await materialsClient.getMaterials({
  page: 1,
  page_size: 20,
})

if ('error' in result) {
  console.error('获取失败:', result.error)
} else {
  console.log('素材列表:', result.list)
  console.log('总数:', result.total)
}
```

---

## 🏗️ 组件架构

Material Search 功能已重构为模块化架构，提高了代码可维护性和可复用性。

### 文件结构

```
JoyfulWords/
├── lib/
│   └── hooks/
│       └── use-materials.ts           # 自定义 Hook - 管理所有状态和业务逻辑
├── components/
│   ├── material-search.tsx             # 主组件 - 组合所有子组件（200+ 行）
│   └── materials/
│       ├── material-search-bar.tsx     # 搜索栏组件
│       ├── material-table.tsx          # 素材表格组件
│       ├── material-log-table.tsx      # 日志表格组件
│       └── material-dialogs.tsx        # 所有对话框组件
└── lib/api/materials/
    ├── client.ts                       # API 客户端
    ├── types.ts                        # TypeScript 类型定义
    └── enums.ts                        # 枚举常量
```

### 核心组件说明

#### 1. `useMaterials` Hook (lib/hooks/use-materials.ts)

**职责**: 管理所有状态和业务逻辑

**导出的状态和函数**:
```typescript
const {
  // 状态
  materials,              // 素材列表
  materialLogs,           // 日志列表
  loading,                // 加载状态
  searching,              // 搜索状态
  pagination,             // 分页信息
  editingMaterial,        // 正在编辑的素材
  deletingId,             // 正在删除的素材 ID
  showUploadDialog,       // 上传对话框显示状态
  uploadForm,             // 上传表单数据
  uploadErrors,           // 上传表单错误
  imagePreview,           // 图片预览 URL

  // Setters
  setEditingMaterial,
  setDeletingId,
  setShowUploadDialog,
  setUploadForm,
  setUploadErrors,
  setImagePreview,

  // 数据获取
  fetchMaterials(nameFilter?, filterType?),      // 获取素材列表
  fetchSearchLogs(logTypeFilter?, logStatusFilter?), // 获取日志列表

  // 搜索功能
  handleSearch(searchQuery, activeSearchTab),    // 触发搜索

  // CRUD 操作
  handleDelete(id),                              // 删除素材
  handleEdit(material),                          // 编辑素材
  handleSaveEdit(),                              // 保存编辑

  // 上传功能
  handleUploadSubmit(),                          // 提交上传
  handleUploadCancel(),                          // 取消上传
  handleImageChange(event, t),                   // 处理图片选择
  handleRemoveImage(),                           // 移除图片
} = useMaterials()
```

**特性**:
- ✅ 集中管理所有状态
- ✅ 自动处理搜索轮询
- ✅ 统一的错误处理和 Toast 提示
- ✅ 图片上传和验证
- ✅ 自动清理轮询定时器

#### 2. `MaterialSearchBar` (components/materials/material-search-bar.tsx)

**职责**: 搜索栏 UI，包括 Tab 切换和搜索输入

**Props**:
```typescript
interface MaterialSearchBarProps {
  activeSearchTab: string
  setActiveSearchTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searching: boolean
  onSearch: () => void
  t: (key: string) => string
}
```

**特性**:
- ✅ 支持三种搜索类型：Info、News、Image
- ✅ 实时搜索状态显示
- ✅ Enter 键触发搜索
- ✅ 搜索中禁用输入

#### 3. `MaterialTable` (components/materials/material-table.tsx)

**职责**: 素材列表表格，展示所有素材

**Props**:
```typescript
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
```

**特性**:
- ✅ 按名称和类型筛选
- ✅ 显示素材总数
- ✅ 支持编辑和删除操作
- ✅ 图片类型素材显示为链接
- ✅ 加载状态显示

#### 4. `MaterialLogTable` (components/materials/material-log-table.tsx)

**职责**: 搜索日志表格，展示所有搜索记录

**Props**:
```typescript
interface MaterialLogTableProps {
  materialLogs: MaterialLog[]
  logTypeFilter: string
  setLogTypeFilter: (type: string) => void
  logStatusFilter: string
  setLogStatusFilter: (status: string) => void
  t: (key: string) => string
}
```

**特性**:
- ✅ 按类型和状态筛选
- ✅ 彩色状态标签
- ✅ 显示创建和更新时间
- ✅ 空数据提示

#### 5. `MaterialDialogs` (components/materials/material-dialogs.tsx)

**职责**: 所有对话框组件，包括编辑、删除、上传

**Props**:
```typescript
interface MaterialDialogsProps {
  // Edit dialog
  editingMaterial: Material | null
  setEditingMaterial: (material: Material | null) => void
  onSaveEdit: () => void

  // Delete dialog
  deletingId: number | null
  setDeletingId: (id: number | null) => void
  onDelete: (id: number) => void

  // Upload dialog
  showUploadDialog: boolean
  setShowUploadDialog: (show: boolean) => void
  uploadForm: UploadForm
  setUploadForm: (form: UploadForm | ((prev: UploadForm) => UploadForm)) => void
  uploadErrors: UploadErrors
  imagePreview: string
  onUploadSubmit: () => void
  onUploadCancel: () => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void

  // Common
  loading: boolean
  t: (key: string) => string
}
```

**特性**:
- ✅ 编辑素材对话框
- ✅ 删除确认对话框
- ✅ 上传素材对话框（支持 Info 和 Image）
- ✅ 图片预览和移除
- ✅ 表单验证和错误提示

### 使用示例

#### 基础使用

```typescript
"use client"

import { MaterialSearch } from "@/components/material-search"

export default function Page() {
  return <MaterialSearch />
}
```

#### 自定义使用子组件

```typescript
"use client"

import { useMaterials } from "@/lib/hooks/use-materials"
import { MaterialTable } from "@/components/materials/material-table"

export function CustomMaterialPage() {
  const {
    materials,
    loading,
    fetchMaterials,
    handleEdit,
    handleDelete,
  } = useMaterials()

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  return (
    <MaterialTable
      materials={materials}
      loading={loading}
      nameFilter=""
      setNameFilter={() => {}}
      filterType="all"
      setFilterType={() => {}}
      onUpload={() => {}}
      onEdit={handleEdit}
      onDelete={(id) => handleDelete(id)}
      t={(key) => key}
    />
  )
}
```

### 重构优势

**代码量优化**:
- ✅ 主组件从 1082 行减少到 ~210 行（减少 ~80%）
- ✅ 业务逻辑和 UI 分离
- ✅ 每个子组件职责单一，易于维护

**可维护性提升**:
- ✅ 状态集中管理（useMaterials Hook）
- ✅ 组件模块化，易于测试
- ✅ 类型安全，减少错误

**可复用性增强**:
- ✅ 子组件可独立使用
- ✅ Hook 可在其他场景复用
- ✅ 清晰的 API 接口

---

## 🔌 API 客户端使用

### 搜索素材

触发 AI 搜索，返回异步搜索任务：

```typescript
const result = await materialsClient.search('news', 'AI技术')

if ('error' in result) {
  console.error('搜索失败:', result.error)
} else {
  console.log('搜索已启动:', result.message)
  // 轮询 /materials/search-logs/list?status=doing 检查进度
}
```

### 获取素材列表

支持分页和筛选：

```typescript
const result = await materialsClient.getMaterials({
  page: 1,
  page_size: 20,
  name: 'AI',           // 可选：标题模糊搜索
  type: 'info',         // 可选：类型筛选
})
```

### 获取搜索日志

```typescript
const result = await materialsClient.getSearchLogs({
  page: 1,
  page_size: 20,
  type: 'news',         // 可选：类型筛选
  status: 'success',    // 可选：状态筛选
})
```

### 创建素材

**Info 类型（文本）**:

```typescript
const result = await materialsClient.createMaterial({
  title: 'AI 技术资料',
  material_type: 'info',
  content: '这是关于 AI 技术的详细内容...',
})
```

**Image 类型（图片）**:

```typescript
// 1. 获取预签名上传 URL
const presignedResult = await materialsClient.getPresignedUrl(
  'photo.jpg',
  'image/jpeg'
)

if ('error' in presignedResult) {
  console.error('获取上传链接失败:', presignedResult.error)
  return
}

// 2. 上传文件到 R2
const uploadSuccess = await uploadFileToPresignedUrl(
  presignedResult.upload_url,
  imageFile,
  'image/jpeg'
)

if (!uploadSuccess) {
  console.error('文件上传失败')
  return
}

// 3. 创建素材记录（使用返回的 file_url）
const result = await materialsClient.createMaterial({
  title: '产品宣传图',
  material_type: 'image',
  content: presignedResult.file_url,
})
```

### 更新素材

支持部分更新：

```typescript
const result = await materialsClient.updateMaterial(123, {
  title: '更新后的标题',
  source_url: 'https://example.com/new-source',
  content: '更新后的内容',
})
```

### 删除素材

```typescript
const result = await materialsClient.deleteMaterial(123)

if ('error' in result) {
  console.error('删除失败:', result.error)
  // 可能是 "该素材已被使用，无法删除"
}
```

---

## 🏷️ 类型系统

### Material 实体

```typescript
interface Material {
  id: number
  user_id: number
  material_logs_id: number      // 搜索日志 ID，用户上传为 0
  title: string                  // 素材标题 (1-200 字符)
  material_type: MaterialType    // 'info' | 'news' | 'image'
  source_url: string             // 素材原链接
  content: string                // 文本内容或图片 URL
  created_at: string             // ISO 8601 格式时间
}
```

### MaterialLog 实体

```typescript
interface MaterialLog {
  id: number
  user_id: number
  material_type: MaterialType
  status: MaterialStatus         // 'doing' | 'success' | 'failed'
  remark: string                 // n8n 标注的执行信息
  created_at: string             // ISO 8601 格式时间
  updated_at: string             // ISO 8601 格式时间
}
```

### Request/Response 类型

所有 API 请求和响应都有完整的类型定义，详见 `lib/api/materials/types.ts`。

---

## 🎨 枚举常量

### 素材类型

```typescript
import { MATERIAL_TYPES } from '@/lib/api/materials/enums'

MATERIAL_TYPES.INFO      // 'info'
MATERIAL_TYPES.NEWS      // 'news'
MATERIAL_TYPES.IMAGE     // 'image'
```

### 搜索状态

```typescript
import { MATERIAL_STATUS } from '@/lib/api/materials/enums'

MATERIAL_STATUS.DOING     // 'doing'
MATERIAL_STATUS.SUCCESS   // 'success'
MATERIAL_STATUS.FAILED    // 'failed'
```

### UI 映射

```typescript
import { UI_TAB_TO_API_TYPE } from '@/lib/api/materials/enums'

// 将 UI Tab 标签映射到 API 枚举值
UI_TAB_TO_API_TYPE['Info']    // 'info'
UI_TAB_TO_API_TYPE['News']    // 'news'
UI_TAB_TO_API_TYPE['Image']   // 'image'
```

### 状态颜色

```typescript
import { STATUS_COLOR_CONFIG } from '@/lib/api/materials/enums'

STATUS_COLOR_CONFIG.doing    // { bg: 'bg-blue-500/10', text: 'text-blue-600' }
STATUS_COLOR_CONFIG.success  // { bg: 'bg-green-500/10', text: 'text-green-600' }
STATUS_COLOR_CONFIG.failed   // { bg: 'bg-red-500/10', text: 'text-red-600' }
```

---

## 💡 完整示例

### React 组件中使用 Material API

```typescript
"use client"

import { useState, useEffect } from 'react'
import { materialsClient } from '@/lib/api/materials/client'
import type { Material } from '@/lib/api/materials/types'
import { useToast } from '@/hooks/use-toast'

export function MaterialList() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // 获取素材列表
  const fetchMaterials = async () => {
    setLoading(true)
    const result = await materialsClient.getMaterials({
      page: 1,
      page_size: 20,
    })
    setLoading(false)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '获取失败',
        description: result.error,
      })
    } else {
      setMaterials(result.list)
    }
  }

  // 创建素材
  const createMaterial = async (title: string, content: string) => {
    const result = await materialsClient.createMaterial({
      title,
      material_type: 'info',
      content,
    })

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '创建失败',
        description: result.error,
      })
    } else {
      toast({
        title: '创建成功',
        description: `素材 "${title}" 已创建`,
      })
      // 刷新列表
      fetchMaterials()
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchMaterials()
  }, [])

  return (
    <div>
      {/* 渲染素材列表 */}
      {materials.map(material => (
        <div key={material.id}>
          <h3>{material.title}</h3>
          <p>{material.content}</p>
        </div>
      ))}
    </div>
  )
}
```

### 搜索功能实现（带轮询）

```typescript
const [searching, setSearching] = useState(false)

let pollingInterval: NodeJS.Timeout | null = null

// 触发搜索
const handleSearch = async (query: string) => {
  const result = await materialsClient.search('news', query)

  if ('error' in result) {
    toast({
      variant: 'destructive',
      title: '搜索失败',
      description: result.error,
    })
    return
  }

  // 开始轮询
  setSearching(true)
  startPolling()
}

// 轮询搜索状态
const startPolling = () => {
  pollingInterval = setInterval(async () => {
    const result = await materialsClient.getSearchLogs({
      page: 1,
      page_size: 10,
      status: 'doing',
    })

    if ('error' in result) {
      console.error('检查状态失败:', result.error)
      return
    }

    // 如果没有进行中的搜索，说明完成
    if (result.list.length === 0) {
      stopPolling()
      // 刷新素材列表
      fetchMaterials()
      toast({
        title: '搜索完成',
        description: '素材搜索已完成',
      })
    }
  }, 3000) // 每 3 秒检查一次
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
  setSearching(false)
}

// 组件卸载时清除轮询
useEffect(() => {
  return () => stopPolling()
}, [])
```

---

## ✨ 最佳实践

### 1. 错误处理

所有 API 调用都应该检查 `error` 字段：

```typescript
const result = await materialsClient.getMaterials()

if ('error' in result) {
  // 处理错误
  console.error(result.error)
  return
}

// 处理成功响应
console.log(result.list)
```

### 2. 类型安全

使用 TypeScript 类型推断：

```typescript
// ✅ 好 - 使用类型
const type: MaterialType = 'info'

// ❌ 差 - 使用字符串字面量
const type = 'info' as any
```

### 3. 枚举使用

使用枚举常量而不是硬编码字符串：

```typescript
// ✅ 好 - 使用枚举常量
import { MATERIAL_TYPES } from '@/lib/api/materials/enums'
const type = MATERIAL_TYPES.INFO

// ❌ 差 - 硬编码字符串
const type = 'info'
```

### 4. 轮询优化

搜索轮询应该：
- 设置合理的间隔（推荐 3 秒）
- 组件卸载时清除定时器
- 避免重复轮询

```typescript
useEffect(() => {
  return () => {
    // 清除轮询
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
  }
}, [])
```

### 5. 加载状态

始终显示加载状态：

```typescript
const [loading, setLoading] = useState(false)

const fetchMaterials = async () => {
  setLoading(true)
  const result = await materialsClient.getMaterials()
  setLoading(false)

  // 处理结果...
}

// UI 中使用
{loading ? <Loader /> : <MaterialList />}
```

### 6. 图片上传

图片上传应该：
- 验证文件类型和大小
- 显示上传进度
- 处理上传失败

```typescript
const handleImageUpload = async (file: File) => {
  // 验证
  if (!file.type.startsWith('image/')) {
    toast({ title: '请选择图片文件' })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast({ title: '图片大小不能超过 5MB' })
    return
  }

  // 上传
  const presignedResult = await materialsClient.getPresignedUrl(
    file.name,
    file.type
  )

  if ('error' in presignedResult) {
    toast({ title: '获取上传链接失败' })
    return
  }

  const uploadSuccess = await uploadFileToPresignedUrl(
    presignedResult.upload_url,
    file,
    file.type
  )

  if (!uploadSuccess) {
    toast({ title: '图片上传失败' })
    return
  }

  // 创建素材
  return presignedResult.file_url
}
```

---

## 📚 相关文档

- [Material API 完整文档](./MATERIAL_API.md)
- [集成计划](./integration-plan.md)
- [项目架构说明](../../CLAUDE.md)

---

**文档版本**: 1.0
**最后更新**: 2026-01-05
**作者**: Joyful Words Development Team
