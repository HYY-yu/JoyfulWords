# Material Search API Integration Plan

> **目标**: 将 `material-search.tsx` 从 Mock 数据完全迁移到真实 API 集成
> **状态**: 规划中 📋
> **优先级**: 高 🔴
> **预计工作量**: 中等
>
> **历史说明**: 本计划记录最初的 `/materials/search` 自动导入实现。该前端流程已于
> 2026-07-30 删除；当前实现以 `docs/materials/MATERIAL_API_GUIDE.md` 和
> `components/article/editor-material-panel.tsx` 的 `/materials/search-v2` 调用链为准。

---

## 📑 目录

1. [现状分析](#现状分析)
2. [API 端点概览](#api-端点概览)
3. [类型系统设计](#类型系统设计)
4. [API Client 实现](#api-client-实现)
5. [组件集成策略](#组件集成策略)
6. [数据流程设计](#数据流程设计)
7. [错误处理机制](#错误处理机制)
8. [实施清单](#实施清单)

---

## 📊 现状分析

### 当前实现 (material-search.tsx)

**✅ 已完成:**
- 完整的 UI 组件和交互逻辑
- Tab 切换功能 (素材列表 / 搜索日志)
- 搜索功能 UI (Info/News/Image 三种类型)
- 筛选功能 (按名称、类型、状态)
- 素材 CRUD 操作 UI (编辑、删除)
- 上传对话框 (文本/图片上传)
- 表单验证
- 国际化支持 (i18n)

**❌ 待完成:**
- 所有数据都是 Mock 数据
- 没有真实的 API 调用
- 枚举值硬编码，未使用 API 定义的枚举
- 缺少加载状态管理
- 缺少错误处理
- 图片上传逻辑不完整

### API 现有基础设施

**✅ 可用资源:**
- `lib/api/client.ts` - 已有 API 客户端框架
- `lib/api/types.ts` - 已有基础类型定义
- `lib/auth/auth-context.tsx` - 已有认证上下文和 token 管理
- OpenTelemetry 集成 - 分布式追踪支持
- Toast 通知系统 - 错误提示

**📦 需要新增:**
- Material 相关的 API 类型定义
- Material API 客户端方法
- 图片上传流程实现

---

## 🔌 API 端点概览

### 需要集成的 API 端点

| 端点 | 方法 | 功能 | 优先级 |
|------|------|------|--------|
| `/materials/search` | POST | 触发 n8n 搜索任务 | 🔴 高 |
| `/materials/search-logs/list` | GET | 获取搜索日志列表 | 🔴 高 |
| `/materials/list` | GET | 获取素材列表（支持筛选） | 🔴 高 |
| `/materials/presigned-url` | POST | 获取图片上传预签名 URL | 🟡 中 |
| `/materials` | POST | 创建素材（用户上传） | 🟡 中 |
| `/materials/:id` | PUT | 更新素材 | 🟢 低 |
| `/materials/:id` | DELETE | 删除素材 | 🟢 低 |

### API 枚举值

**Material Types (素材类型)**
```typescript
type MaterialType = 'info' | 'news' | 'image'
```

**Material Status (搜索状态)**
```typescript
type MaterialStatus = 'doing' | 'success' | 'failed'
```

---

## 🏗️ 类型系统设计

### 文件结构
```
lib/api/materials/
├── types.ts        # Material 相关类型定义
├── enums.ts        # 枚举常量定义
└── client.ts       # Material API 客户端
```

### 1. types.ts

```typescript
/**
 * 素材类型枚举（来自 API 定义）
 */
export type MaterialType = 'info' | 'news' | 'image'

/**
 * 搜索状态枚举（来自 API 定义）
 */
export type MaterialStatus = 'doing' | 'success' | 'failed'

/**
 * 素材实体
 */
export interface Material {
  id: number
  user_id: number
  material_logs_id: number  // 搜索日志 ID，用户上传的素材为 0
  title: string              // 素材标题 (1-200 字符)
  material_type: MaterialType
  source_url: string         // 素材原链接
  content: string            // 素材内容（文本或图片 URL）
  created_at: string         // ISO 8601 格式时间
}

/**
 * 搜索日志实体
 */
export interface MaterialLog {
  id: number
  user_id: number
  material_type: MaterialType
  status: MaterialStatus
  remark: string             // n8n 标注的执行信息
  created_at: string         // ISO 8601 格式时间
  updated_at: string         // ISO 8601 格式时间
}

// ==================== Request Types ====================

/**
 * 触发素材搜索请求
 */
export interface SearchMaterialsRequest {
  material_type: MaterialType
  search_text: string        // 1-500 字符
}

/**
 * 获取素材列表请求参数
 */
export interface GetMaterialsRequest {
  page?: number              // 页码，从 1 开始，默认 1
  page_size?: number         // 每页数量，默认 20，最大 100
  name?: string              // 标题筛选（模糊搜索）
  type?: MaterialType        // 素材类型过滤
}

/**
 * 获取搜索日志请求参数
 */
export interface GetSearchLogsRequest {
  page?: number              // 页码，从 1 开始，默认 1
  page_size?: number         // 每页数量，默认 20，最大 100
  type?: MaterialType        // 素材类型过滤
  status?: MaterialStatus    // 状态过滤
}

/**
 * 创建素材请求
 */
export interface CreateMaterialRequest {
  title: string              // 素材标题 (1-200 字符)
  material_type: MaterialType
  content: string            // 素材内容（info/news 为文本，image 为图片 URL）
}

/**
 * 更新素材请求
 */
export interface UpdateMaterialRequest {
  title?: string             // 素材标题 (1-200 字符)
  source_url?: string        // 素材原链接（有效 URL，最多 500 字符）
  content?: string           // 素材内容
}

/**
 * 获取预签名上传 URL 请求
 */
export interface GetPresignedUrlRequest {
  filename: string           // 文件名
  content_type: string       // 文件 MIME 类型
}

// ==================== Response Types ====================

/**
 * 素材列表响应
 */
export interface MaterialListResponse {
  total: number
  list: Material[]
}

/**
 * 搜索日志列表响应
 */
export interface MaterialLogListResponse {
  total: number
  list: MaterialLog[]
}

/**
 * 创建素材响应
 */
export interface CreateMaterialResponse {
  id: number
  message: string
}

/**
 * 预签名 URL 响应
 */
export interface PresignedUrlResponse {
  upload_url: string         // 用于 PUT 请求上传文件
  file_url: string           // 文件最终访问 URL
  expires_at: string         // URL 过期时间（15 分钟有效期）
}

/**
 * 通用消息响应
 */
export interface MessageResponse {
  message: string
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string
}
```

### 2. enums.ts

```typescript
/**
 * Material API 枚举常量
 * 所有枚举值来自 API 文档定义
 */

// ==================== Material Types ====================

export const MATERIAL_TYPES = {
  INFO: 'info',
  NEWS: 'news',
  IMAGE: 'image',
} as const

export type MaterialTypeValue = typeof MATERIAL_TYPES[keyof typeof MATERIAL_TYPES]

// ==================== Material Status ====================

export const MATERIAL_STATUS = {
  DOING: 'doing',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const

export type MaterialStatusValue = typeof MATERIAL_STATUS[keyof typeof MATERIAL_STATUS]

// ==================== UI Options ====================

/**
 * 素材类型筛选选项（包含"全部"选项）
 */
export const MATERIAL_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: MATERIAL_TYPES.INFO, label: '资料' },
  { value: MATERIAL_TYPES.NEWS, label: '新闻' },
  { value: MATERIAL_TYPES.IMAGE, label: '图片' },
] as const

/**
 * 搜索状态筛选选项（包含"全部"选项）
 */
export const MATERIAL_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: MATERIAL_STATUS.DOING, label: '进行中' },
  { value: MATERIAL_STATUS.SUCCESS, label: '成功' },
  { value: MATERIAL_STATUS.FAILED, label: '失败' },
] as const

/**
 * 搜索 Tab 选项（UI 使用）
 * 映射 UI 标签到 API 枚举值
 */
export const SEARCH_TAB_OPTIONS = [
  {
    uiLabel: 'Info',      // UI 组件使用的标签
    apiValue: 'info',     // API 调用使用的值
    i18nKey: 'info',      // 国际化 key
  },
  {
    uiLabel: 'News',
    apiValue: 'news',
    i18nKey: 'news',
  },
  {
    uiLabel: 'Image',
    apiValue: 'image',
    i18nKey: 'image',
  },
] as const

/**
 * UI Tab 标签到 API 枚举值的映射
 */
export const UI_TAB_TO_API_TYPE: Record<string, MaterialTypeValue> = {
  'Info': 'info',
  'News': 'news',
  'Image': 'image',
}

/**
 * API 枚举值到 UI Tab 标签的映射
 */
export const API_TYPE_TO_UI_TAB: Record<MaterialTypeValue, string> = {
  'info': 'Info',
  'news': 'News',
  'image': 'Image',
}

/**
 * 搜索状态颜色配置
 */
export const STATUS_COLOR_CONFIG: Record<MaterialStatusValue, { bg: string; text: string }> = {
  doing: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  success: { bg: 'bg-green-500/10', text: 'text-green-600' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-600' },
}
```

---

## 🔧 API Client 实现

### 3. client.ts

```typescript
import { apiRequest } from '@/lib/api/client'
import type {
  SearchMaterialsRequest,
  GetMaterialsRequest,
  GetSearchLogsRequest,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  GetPresignedUrlRequest,
  MaterialListResponse,
  MaterialLogListResponse,
  CreateMaterialResponse,
  PresignedUrlResponse,
  MessageResponse,
  ErrorResponse,
} from './types'

/**
 * Material API Client
 * 提供素材管理相关的所有 API 调用方法
 */
export const materialsClient = {
  /**
   * 1. 触发素材搜索
   * POST /materials/search
   *
   * 调用 n8n 工作流进行异步素材搜索
   *
   * @param materialType - 素材类型 (info/news/image)
   * @param searchText - 搜索关键词 (1-500 字符)
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.search('news', 'AI技术')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   console.log(result.message) // "OK"
   * }
   */
  async search(
    materialType: SearchMaterialsRequest['material_type'],
    searchText: SearchMaterialsRequest['search_text']
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>('/materials/search', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        material_type: materialType,
        search_text: searchText,
      } as SearchMaterialsRequest),
    })
  },

  /**
   * 2. 获取搜索日志列表
   * GET /materials/search-logs/list
   *
   * 查看用户的素材搜索历史记录
   *
   * @param params - 查询参数
   * @returns Promise<MaterialLogListResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getSearchLogs({
   *   page: 1,
   *   page_size: 20,
   *   type: 'news',
   *   status: 'success'
   * })
   */
  async getSearchLogs(
    params?: GetSearchLogsRequest
  ): Promise<MaterialLogListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.type) searchParams.append('type', params.type)
    if (params?.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `/materials/search-logs/list?${queryString}` : '/materials/search-logs/list'

    return apiRequest<MaterialLogListResponse>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 3. 获取素材列表
   * GET /materials/list
   *
   * 查看用户的素材列表，支持分页、标题搜索和类型过滤
   *
   * @param params - 查询参数
   * @returns Promise<MaterialListResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getMaterials({
   *   page: 1,
   *   page_size: 20,
   *   name: 'AI',
   *   type: 'info'
   * })
   */
  async getMaterials(
    params?: GetMaterialsRequest
  ): Promise<MaterialListResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    // 构建 URL 查询参数
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.page_size) searchParams.append('page_size', String(params.page_size))
    if (params?.name) searchParams.append('name', params.name)
    if (params?.type) searchParams.append('type', params.type)

    const queryString = searchParams.toString()
    const url = queryString ? `/materials/list?${queryString}` : '/materials/list'

    return apiRequest<MaterialListResponse>(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },

  /**
   * 4. 获取预签名上传 URL
   * POST /materials/presigned-url
   *
   * 获取 Cloudflare R2 的预签名上传 URL，用于上传图片等文件
   *
   * @param filename - 文件名
   * @param contentType - 文件 MIME 类型
   * @returns Promise<PresignedUrlResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.getPresignedUrl('photo.jpg', 'image/jpeg')
   * if ('error' in result) {
   *   console.error(result.error)
   * } else {
   *   // 使用 result.upload_url 上传文件
   *   await fetch(result.upload_url, { method: 'PUT', body: file })
   *   // 上传成功后使用 result.file_url 作为素材内容
   * }
   */
  async getPresignedUrl(
    filename: GetPresignedUrlRequest['filename'],
    contentType: GetPresignedUrlRequest['content_type']
  ): Promise<PresignedUrlResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<PresignedUrlResponse>('/materials/presigned-url', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        filename,
        content_type: contentType,
      } as GetPresignedUrlRequest),
    })
  },

  /**
   * 5. 创建素材
   * POST /materials
   *
   * 创建新的素材记录
   *
   * @param data - 素材数据
   * @returns Promise<CreateMaterialResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.createMaterial({
   *   title: 'AI 技术资料',
   *   material_type: 'info',
   *   content: '这是关于 AI 技术的详细资料...'
   * })
   */
  async createMaterial(
    data: CreateMaterialRequest
  ): Promise<CreateMaterialResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<CreateMaterialResponse>('/materials', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 6. 更新素材
   * PUT /materials/:id
   *
   * 更新已有素材的信息，支持部分更新
   *
   * @param id - 素材 ID
   * @param data - 更新数据（至少提供一个字段）
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.updateMaterial(123, {
   *   title: '更新后的标题',
   *   source_url: 'https://example.com/new-source'
   * })
   */
  async updateMaterial(
    id: number,
    data: UpdateMaterialRequest
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/materials/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    })
  },

  /**
   * 7. 删除素材
   * DELETE /materials/:id
   *
   * 删除指定的素材
   * 注意：如果素材已被文章使用，则无法删除
   *
   * @param id - 素材 ID
   * @returns Promise<MessageResponse | ErrorResponse>
   *
   * @example
   * const result = await materialsClient.deleteMaterial(123)
   * if ('error' in result) {
   *   console.error(result.error) // 可能是 "该素材已被使用，无法删除"
   * }
   */
  async deleteMaterial(
    id: number
  ): Promise<MessageResponse | ErrorResponse> {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse>(`/materials/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  },
}

/**
 * 辅助函数：上传文件到预签名 URL
 *
 * @param uploadUrl - 预签名上传 URL
 * @param file - 要上传的文件
 * @param contentType - 文件 MIME 类型
 * @returns Promise<boolean> - 上传是否成功
 *
 * @example
 * const success = await uploadFileToPresignedUrl(
 *   presignedResult.upload_url,
 *   imageFile,
 *   'image/jpeg'
 * )
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Failed to upload file to presigned URL:', error)
    return false
  }
}
```

---

## 🎨 组件集成策略

### 状态管理重构

**当前状态（需要移除）：**
```typescript
// ❌ Mock 数据
const [materials, setMaterials] = useState<Material[]>(mockMaterials)
const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>(mockMaterialLogs)
```

**新状态设计：**
```typescript
// ✅ API 集成状态
const [materials, setMaterials] = useState<Material[]>([])
const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>([])
const [loading, setLoading] = useState(false)
const [searching, setSearching] = useState(false)

// 分页状态
const [pagination, setPagination] = useState({
  materials: { page: 1, pageSize: 20, total: 0 },
  logs: { page: 1, pageSize: 20, total: 0 },
})

// 错误状态
const [error, setError] = useState<string | null>(null)
```

### 核心功能实现

#### 1. 数据获取 (Data Fetching)

```typescript
/**
 * 获取素材列表
 * 支持按名称和类型筛选
 */
const fetchMaterials = async () => {
  setLoading(true)
  setError(null)

  const result = await materialsClient.getMaterials({
    page: pagination.materials.page,
    page_size: pagination.materials.pageSize,
    name: nameFilter || undefined,
    type: filterType !== 'all' ? filterType as MaterialType : undefined,
  })

  setLoading(false)

  if ('error' in result) {
    setError(result.error)
    toast({
      variant: 'destructive',
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
```

#### 2. 搜索功能 (Search)

```typescript
/**
 * 触发素材搜索
 * 1. 调用 API 触发搜索
 * 2. 开始轮询搜索状态
 * 3. 搜索完成后刷新素材列表
 */
const handleSearch = async () => {
  if (!searchQuery.trim()) return

  setSearching(true)
  setError(null)

  // 映射 UI Tab 到 API 枚举值
  const materialType = UI_TAB_TO_API_TYPE[activeSearchTab]

  const result = await materialsClient.search(materialType, searchQuery)

  if ('error' in result) {
    setError(result.error)
    toast({
      variant: 'destructive',
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
```

#### 3. 素材创建 (Create)

```typescript
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
```

#### 4. 素材更新 (Update)

```typescript
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
```

#### 5. 素材删除 (Delete)

```typescript
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
```

### UI 组件更新

#### 1. 类型筛选下拉框

**之前（硬编码）：**
```typescript
// ❌ 硬编码的选项
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
```

**之后（API 枚举）：**
```typescript
// ✅ 使用 API 定义的枚举
import { MATERIAL_TYPE_FILTER_OPTIONS } from '@/lib/api/materials/enums'

<Select value={filterType} onValueChange={setFilterType}>
  <SelectTrigger className="w-[140px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {MATERIAL_TYPE_FILTER_OPTIONS.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 2. 素材类型显示

**之前：**
```typescript
// ❌ 需要手动映射
{t(`contentWriting.materials.types.${searchTabs.find(st => st.id === material.type)?.key || 'info'}`)}
```

**之后：**
```typescript
// ✅ 直接使用 API 枚举值
import { API_TYPE_TO_UI_TAB } from '@/lib/api/materials/enums'

const getMaterialTypeLabel = (type: MaterialType) => {
  const i18nKey = type
  return t(`contentWriting.materials.types.${i18nKey}`)
}

// 使用
<span>{getMaterialTypeLabel(material.material_type)}</span>
```

#### 3. 搜索状态颜色

```typescript
// ✅ 使用配置化的颜色
import { STATUS_COLOR_CONFIG } from '@/lib/api/materials/enums'

<span
  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    STATUS_COLOR_CONFIG[log.status].bg
  } ${STATUS_COLOR_CONFIG[log.status].text}`}
>
  {t(`contentWriting.materials.logs.status.${log.status}`)}
</span>
```

---

## 🔄 数据流程设计

### 1. 搜索流程

```
用户输入搜索关键词
    ↓
点击搜索按钮
    ↓
调用 POST /materials/search
    ↓
显示"搜索中"状态
    ↓
开始轮询 GET /materials/search-logs/list?status=doing
    ↓
[每3秒轮询一次]
    ↓
检查是否有 status='doing' 的日志
    ├─ 有 → 继续轮询
    └─ 无 → 搜索完成
         ↓
    刷新素材列表
    刷新搜索日志
    切换到"素材列表" tab
    停止轮询
```

### 2. 图片上传流程

```
用户选择图片文件
    ↓
客户端验证文件类型和大小
    ↓
调用 POST /materials/presigned-url
    ├─ 失败 → 显示错误提示
    └─ 成功 → 获取 upload_url 和 file_url
         ↓
    PUT {upload_url} 上传文件
         ├─ 失败 → 显示错误提示
         └─ 成功
              ↓
         调用 POST /materials 创建素材记录
              ├─ 失败 → 显示错误提示
              └─ 成功
                   ↓
              刷新素材列表
              关闭上传对话框
```

### 3. 数据同步策略

| 操作 | 需要刷新的数据 | 刷新时机 |
|------|----------------|----------|
| 触发搜索 | 搜索日志 | 立即（轮询） |
| 搜索完成 | 素材列表、搜索日志 | 轮询完成时 |
| 创建素材 | 素材列表 | 创建成功后 |
| 更新素材 | 素材列表 | 更新成功后 |
| 删除素材 | 素材列表 | 删除成功后 |
| 切换筛选条件 | 素材列表或搜索日志 | 筛选条件改变时 |

---

## ⚠️ 错误处理机制

### 1. 网络错误处理

```typescript
/**
 * 统一错误处理
 */
const handleApiError = (error: unknown, context: string) => {
  let errorMessage = '操作失败，请稍后重试'

  if (typeof error === 'string') {
    errorMessage = error
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (error && typeof error === 'object' && 'error' in error) {
    errorMessage = (error as { error: string }).error
  }

  console.error(`[${context}] Error:`, error)

  toast({
    variant: 'destructive',
    title: `${context}失败`,
    description: errorMessage,
  })

  return errorMessage
}
```

### 2. 认证错误处理

```typescript
/**
 * 检查认证错误
 * 401 或 403 响应时触发 token 刷新或重定向
 */
const isAuthError = (error: { error?: string }): boolean => {
  const errorMessage = error.error?.toLowerCase() || ''
  return (
    errorMessage.includes('未授权') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('token') ||
    errorMessage.includes('认证')
  )
}

// 使用示例
const result = await materialsClient.getMaterials()

if ('error' in result) {
  if (isAuthError(result)) {
    // 触发 token 刷新或重定向到登录页
    toast({
      variant: 'destructive',
      title: '登录已过期',
      description: '请重新登录',
    })

    // 重定向到登录页
    window.location.href = '/auth/login'
    return
  }

  handleApiError(result, '获取素材列表')
}
```

### 3. 表单验证错误

```typescript
/**
 * 表单字段验证
 */
const validateUploadForm = (): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  // 验证标题
  if (!uploadForm.name.trim()) {
    errors.name = t('contentWriting.materials.errors.nameRequired')
  } else if (uploadForm.name.length > 200) {
    errors.name = '标题不能超过 200 个字符'
  }

  // 验证内容
  if (uploadForm.type === 'Info' && !uploadForm.content.trim()) {
    errors.content = t('contentWriting.materials.errors.contentRequired')
  }

  if (uploadForm.type === 'Image' && !uploadForm.imageFile) {
    errors.content = t('contentWriting.materials.errors.imageRequired')
  }

  // 验证图片文件
  if (uploadForm.imageFile) {
    // 验证文件类型
    if (!uploadForm.imageFile.type.startsWith('image/')) {
      errors.content = t('contentWriting.materials.errors.invalidImageType')
    }

    // 验证文件大小（5MB 限制）
    const maxSize = 5 * 1024 * 1024
    if (uploadForm.imageFile.size > maxSize) {
      errors.content = t('contentWriting.materials.errors.imageTooLarge')
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
```

### 4. 文件上传错误处理

```typescript
/**
 * 处理图片上传错误
 */
const handleImageUploadError = (
  stage: 'presigned' | 'upload',
  error: unknown
) => {
  let errorMessage = ''

  if (stage === 'presigned') {
    errorMessage = '获取上传链接失败，请检查网络连接'
  } else {
    errorMessage = '图片上传失败，请重试'
  }

  handleApiError(errorMessage, '图片上传')
}

// 使用示例
const presignedResult = await materialsClient.getPresignedUrl(
  uploadForm.imageFile.name,
  uploadForm.imageFile.type
)

if ('error' in presignedResult) {
  handleImageUploadError('presigned', presignedResult.error)
  return
}

const uploadSuccess = await uploadFileToPresignedUrl(
  presignedResult.upload_url,
  uploadForm.imageFile,
  uploadForm.imageFile.type
)

if (!uploadSuccess) {
  handleImageUploadError('upload', null)
  return
}
```

---

## ✅ 实施清单

### 阶段 1：基础设施搭建 🏗️ ✅ **已完成**

**目标**: 搭建 API 集成的基础设施

- [x] 创建 `lib/api/materials/types.ts`
  - [x] 定义 MaterialType, MaterialStatus 等枚举类型
  - [x] 定义 Material, MaterialLog 实体类型
  - [x] 定义所有 Request 类型
  - [x] 定义所有 Response 类型

- [x] 创建 `lib/api/materials/enums.ts`
  - [x] 导出 MATERIAL_TYPES 常量
  - [x] 导出 MATERIAL_STATUS 常量
  - [x] 导出 UI 选项（MATERIAL_TYPE_FILTER_OPTIONS 等）
  - [x] 导出映射函数（UI_TAB_TO_API_TYPE 等）
  - [x] 导出颜色配置（STATUS_COLOR_CONFIG）

- [x] 创建 `lib/api/materials/client.ts`
  - [x] 实现 materialsClient.search()
  - [x] 实现 materialsClient.getSearchLogs()
  - [x] 实现 materialsClient.getMaterials()
  - [x] 实现 materialsClient.getPresignedUrl()
  - [x] 实现 materialsClient.createMaterial()
  - [x] 实现 materialsClient.updateMaterial()
  - [x] 实现 materialsClient.deleteMaterial()
  - [x] 实现 uploadFileToPresignedUrl() 辅助函数

### 阶段 2：组件状态重构 🔧 ✅ **已完成**

**目标**: 更新组件状态管理，移除 Mock 数据

- [x] 更新 `components/material-search.tsx`
  - [x] 移除 mockMaterials 和 mockMaterialLogs 常量
  - [x] 更新 Material 和 MaterialLog 类型定义（使用 API 类型）
  - [x] 更新 materials 和 materialLogs 状态（初始值为空数组）
  - [x] 添加 loading 状态
  - [x] 添加 error 状态
  - [x] 添加 pagination 状态
  - [x] 移除 searchTabs 等本地常量（使用 enums.ts）

### 阶段 3：核心功能实现 💡 ✅ **已完成**

**目标**: 实现 API 调用和数据处理逻辑

- [x] 实现数据获取功能
  - [x] 实现 fetchMaterials() 函数
  - [x] 实现 fetchSearchLogs() 函数
  - [x] 实现 useEffect 监听筛选条件变化

- [x] 实现搜索功能
  - [x] 实现 handleSearch() 函数
  - [x] 实现 startSearchPolling() 函数
  - [x] 实现 checkSearchStatus() 函数
  - [x] 实现 stopSearchPolling() 函数
  - [x] 添加搜索状态 UI 指示器

- [x] 实现素材创建功能
  - [x] 实现 handleUploadSubmit() 函数
  - [x] 实现图片上传流程（presigned URL + PUT）
  - [x] 实现 Info 类型素材创建流程
  - [x] 实现 Image 类型素材创建流程
  - [x] 添加表单验证逻辑

- [x] 实现素材更新功能
  - [x] 实现 handleSaveEdit() 函数
  - [x] 调用 materialsClient.updateMaterial()

- [x] 实现素材删除功能
  - [x] 实现 handleDelete() 函数
  - [x] 调用 materialsClient.deleteMaterial()

### 阶段 4：UI 组件更新 🎨 ✅ **已完成**

**目标**: 更新 UI 组件以使用 API 枚举和数据

- [x] 更新筛选下拉框
  - [x] Materials 类型筛选（使用 API 枚举值）
  - [x] Logs 类型筛选（使用 API 枚举值）
  - [x] Logs 状态筛选（使用 API 枚举值）

- [x] 更新素材类型显示
  - [x] 使用 API 枚举值直接显示
  - [x] 移除 searchTabs 映射逻辑

- [x] 更新搜索状态显示
  - [x] 使用 STATUS_COLOR_CONFIG 配置颜色
  - [x] 使用 API 枚举值显示文本

- [x] 添加加载状态 UI
  - [x] Loader 加载指示器
  - [x] Button loading 状态
  - [x] 禁用交互元素（加载时）

### 阶段 5：错误处理完善 ⚠️ ✅ **已完成**

**目标**: 完善错误处理和用户提示

- [x] 实现统一错误处理
  - [x] 使用 Toast 通知显示错误
  - [x] API 错误响应处理
  - [x] 网络错误处理

- [x] 添加表单验证
  - [x] 客户端实时验证（标题、内容、图片）
  - [x] 错误提示显示
  - [x] 图片类型和大小验证

- [x] 添加网络错误处理
  - [x] API 调用错误捕获
  - [x] 用户友好的错误提示
  - [x] Toast 通知集成

### 阶段 6：测试和优化 🧪 ⏳ **待测试**

**目标**: 测试功能并优化用户体验

> **注意**: 此阶段需要启动开发服务器进行实际测试

- [ ] 功能测试
  - [ ] 测试搜索功能（Info/News/Image）
  - [ ] 测试素材列表获取和筛选
  - [ ] 测试搜索日志获取和筛选
  - [ ] 测试 Info 类型素材上传
  - [ ] 测试 Image 类型素材上传
  - [ ] 测试素材编辑
  - [ ] 测试素材删除

- [ ] 边界情况测试
  - [ ] 空列表显示
  - [ ] 网络错误处理
  - [ ] 认证过期处理
  - [ ] 大文件上传
  - [ ] 并发操作

- [ ] 性能优化
  - [ ] 防抖搜索输入（待评估）
  - [ ] 优化轮询间隔（当前 3 秒）
  - [ ] 添加请求缓存（可选）
  - [ ] 优化大量数据渲染

- [ ] 用户体验优化
  - [ ] 添加更详细的加载动画
  - [ ] 优化错误提示文案
  - [ ] 添加操作成功反馈
  - [ ] 优化空状态提示

### 阶段 7：文档和收尾 📚 ⏳ **进行中**

**目标**: 完善文档和代码清理

- [x] 代码清理
  - [x] 移除所有 Mock 数据
  - [x] 移除未使用的代码
  - [x] 统一代码风格
  - [x] 添加代码注释

- [ ] 文档更新
  - [ ] 更新 CLAUDE.md（添加 Material API 说明）
  - [ ] 创建 Material API 使用指南
  - [ ] 更新组件文档

- [ ] OpenTelemetry 追踪（可选）
  - [ ] 为 Material API 添加自定义 span
  - [ ] 添加性能监控
  - [ ] 添加错误追踪

---

## 📦 已交付文件

### 新增文件

1. **`lib/api/materials/types.ts`** (245 行)
   - 完整的 Material API 类型定义
   - Material 和 MaterialLog 实体类型
   - 所有 Request 和 Response 类型

2. **`lib/api/materials/enums.ts`** (108 行)
   - Material 类型枚举常量
   - 筛选选项配置
   - UI 映射函数
   - 状态颜色配置

3. **`lib/api/materials/client.ts`** (315 行)
   - 完整的 Material API 客户端实现
   - 7 个核心 API 方法
   - 图片上传辅助函数
   - 完整的 JSDoc 注释

### 修改文件

1. **`components/material-search.tsx`** (1088 行，完全重写)
   - 集成真实 API 调用
   - 移除所有 Mock 数据
   - 完整的错误处理
   - 加载状态管理
   - 图片上传功能
   - 搜索轮询机制

---

## 🧪 测试指南

### 启动测试

```bash
# 启动开发服务器
pnpm dev

# 访问 Material Search 页面
# 路径: /content-writing/material-search
```

### 测试清单

#### 1. 数据获取测试
- [ ] 页面加载时自动获取素材列表
- [ ] 切换到"搜索日志" tab 能正确显示日志
- [ ] 筛选功能正常工作（按名称、类型、状态）

#### 2. 搜索功能测试
- [ ] 输入搜索关键词，点击搜索按钮
- [ ] 搜索中状态正确显示
- [ ] 搜索完成后自动切换到素材列表
- [ ] Toast 通知正确显示

#### 3. 素材创建测试
- [ ] Info 类型：输入标题和文本内容，能成功创建
- [ ] Image 类型：选择图片文件，能成功上传并创建
- [ ] 表单验证：缺少必填字段时显示错误提示
- [ ] 图片验证：非图片文件被拒绝
- [ ] 大小验证：超过 5MB 的图片被拒绝

#### 4. 素材编辑测试
- [ ] 点击编辑按钮，对话框正确显示素材信息
- [ ] 修改标题、链接或内容，能成功保存
- [ ] Toast 通知显示成功消息

#### 5. 素材删除测试
- [ ] 点击删除按钮，显示确认对话框
- [ ] 确认删除后，素材从列表移除
- [ ] Toast 通知显示成功消息

#### 6. 错误处理测试
- [ ] 网络错误时显示友好的错误提示
- [ ] 认证错误时（401/403）正确处理
- [ ] API 错误响应通过 Toast 显示

---

## 🔧 后续优化建议

### 短期优化（可选）

1. **性能优化**
   - 为搜索输入添加防抖（debounce）
   - 添加请求缓存机制
   - 优化大量数据列表渲染

2. **用户体验**
   - 添加骨架屏（Skeleton）加载效果
   - 优化错误提示文案（更详细的错误信息）
   - 添加操作撤销功能

3. **功能增强**
   - 支持批量删除素材
   - 支持素材标签分类
   - 添加素材导出功能

### 长期优化（未来考虑）

1. **架构升级**
   - 使用 React Query 管理服务器状态
   - 添加乐观更新（Optimistic Updates）
   - 实现自动重试机制

2. **搜索优化**
   - 基于统一自适应轮询器优化退避和恢复策略
   - 添加搜索进度显示
   - 支持取消搜索任务

3. **文件上传优化**
   - 支持批量上传
   - 添加上传进度条
   - 支持拖拽上传
   - 图片压缩和裁剪

---

## 📚 API 文档参考

- Material API 完整文档: `/docs/materials/MATERIAL_API.md`
- Auth API 文档: `/docs/materials/AUTH_API.md`
- 项目架构说明: `/CLAUDE.md`

---

**文档版本**: 2.0
**创建时间**: 2026-01-05
**最后更新**: 2026-01-05
**状态**: ✅ 阶段 1-5 已完成，阶段 6 待测试，阶段 7 进行中
**作者**: Joyful Words Development Team

---

## 📝 注意事项

### 开发建议

1. **渐进式实施**: 按阶段逐步实施，每完成一个阶段进行测试
2. **保持 UI 不变**: 只替换数据层，UI 交互保持不变
3. **错误提示友好**: 使用清晰的中文错误提示，帮助用户理解问题
4. **加载状态明确**: 所有异步操作都要有明确的加载状态提示
5. **保持类型安全**: 充分利用 TypeScript 类型检查，避免运行时错误

### 测试建议

1. **API Mock**: 在开发环境使用 MSW (Mock Service Worker) 模拟 API 响应
2. **边界测试**: 测试空列表、网络错误、认证错误等边界情况
3. **集成测试**: 测试完整的数据流程（搜索 → 轮询 → 显示结果）
4. **性能测试**: 测试大量数据的渲染性能

### 已知限制

1. **轮询机制**: 使用统一自适应轮询器检查搜索状态
2. **无取消功能**: 搜索任务启动后无法取消，需要后端支持
3. **图片大小**: 客户端限制 5MB，需要与后端保持一致
4. **并发上传**: 暂不支持批量上传，一次只能上传一个素材

---

## 📚 参考资源

- [Material API 文档](../MATERIAL_API.md)
- [Auth API 文档](../AUTH_API.md)
- [OpenTelemetry 集成](../opentelemetry-setup.md)
- [项目结构说明](../../CLAUDE.md)

---

**文档版本**: 1.0
**创建时间**: 2026-01-05
**最后更新**: 2026-01-05
**作者**: Joyful Words Development Team
