# 素材管理接口 API 文档

素材管理系统，支持素材搜索、素材 CRUD 操作和文件上传。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

---

## 目录

1. [触发素材搜索](#1-触发素材搜索)
2. [获取搜索日志列表](#2-获取搜索日志列表)
3. [获取素材列表](#3-获取素材列表)
4. [获取预签名上传 URL](#4-获取预签名上传-url)
5. [创建素材](#5-创建素材)
6. [更新素材](#6-更新素材)
7. [删除素材](#7-删除素材)

---

## 1. 触发素材搜索

调用 n8n 工作流进行异步素材搜索。

### 接口信息

- **URL:** `/materials/search`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）
- **限流:** 是

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| material_type | string | 是 | 素材类型：info/news/image |
| search_text | string | 是 | 搜索关键词（1-500 字符） |

### 请求示例

```bash
curl -X POST http://localhost:8080/materials/search \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTYwMDcsIm5iZiI6MTc2NzYxNTEwNywiaWF0IjoxNzY3NjE1MTA3fQ.rXRv41_3kxDQSnX-T5sljhV5pIGggU6Nv9mx6T3gX3E" \
  -d '{
    "material_type": "news",
    "search_text": "量子计算机"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "result": "OK"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（素材类型无效、关键词过长） |
| 401 | 未授权（token 无效或过期） |
| 500 | 搜索任务未创建或服务器错误 |

**注意:**
- 搜索由 n8n 工作流异步执行
- 搜索进度和结果可通过"获取搜索日志列表"接口查看
- 搜索完成后，素材会自动保存到 materials 表

---

## 2. 获取搜索日志列表

查看用户的素材搜索历史记录。

### 接口信息

- **URL:** `/materials/search-logs/list`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| type | string | 否 | 素材类型过滤：info/news/image |
| status | string | 否 | 状态过滤：doing/success/failed |

### 请求示例

```bash
curl -X GET "http://localhost:8080/materials/search-logs/list?page=1&page_size=20&type=news&status=success" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTY5MDcsIm5iZiI6MTc2NzYxNjAwNywiaWF0IjoxNzY3NjE2MDA3fQ.vpB59vEZm5Iezps2gWrhbExp4gBBmfpq4q8IfzHQX6Q"
```

### 响应

**成功 (200 OK)**

```json
{
  "total": 100,
  "list": [
    {
      "id": 1,
      "user_id": 123,
      "material_type": "news",
      "status": "success", 
       "query": "xxx",
      "remark": "搜索完成，找到 15 条素材",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:05:00Z"
    }
  ]
}
```

| 字段            | 类型 | 说明                                     |
|---------------|------|----------------------------------------|
| id            | number | 搜索日志 ID                                |
| user_id       | number | 用户 ID                                  |
| material_type | string | 素材类型                                   |
| status        | string | 搜索状态：doing(进行中)/success(成功)/failed(失败) |
| remark        | string | n8n 标注的执行信息                            |
| query         | string | 查询的字符串                                 |
| created_at    | string | 创建时间（ISO 8601 格式）                      |
| updated_at    | string | 更新时间（ISO 8601 格式）                      |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |

---

## 3. 获取素材列表

查看用户的素材列表，支持分页、标题搜索和类型过滤。

### 接口信息

- **URL:** `/materials/list`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |
| name | string | 否 | 标题筛选（模糊搜索） |
| type | string | 否 | 素材类型过滤：info/news/image |

### 请求示例

```bash
curl -X GET "http://localhost:8080/materials/list?page=1&page_size=20&type=news" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTc4MDcsIm5iZiI6MTc2NzYxNjkwNywiaWF0IjoxNzY3NjE2OTA3fQ.iLSPga9i6xSDQel1ZHihXdkopmLI_axdicAT0cvjPuQ"
```

### 响应

**成功 (200 OK)**

```json
{
  "total": 50,
  "list": [
    {
      "id": 1,
      "user_id": 123,
      "material_logs_id": 5,
      "title": "AI 技术发展新闻",
      "material_type": "news",
      "source_url": "https://example.com/article1",
      "content": "这是素材的详细内容...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 素材 ID |
| user_id | number | 用户 ID |
| material_logs_id | number | 搜索日志 ID（用户上传的素材为 0） |
| title | string | 素材标题 |
| material_type | string | 素材类型 |
| source_url | string | 素材原链接 |
| content | string | 素材内容（文本或图片 URL） |
| created_at | string | 创建时间（ISO 8601 格式） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |

---

## 4. 获取预签名上传 URL

获取 Cloudflare R2 的预签名上传 URL，用于上传图片等文件。

### 接口信息

- **URL:** `/materials/presigned-url`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名（如：example.jpg） |
| content_type | string | 是 | 文件 MIME 类型（如：image/jpeg） |

### 请求示例

```bash
curl -X POST http://localhost:8080/materials/presigned-url \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTg3MDcsIm5iZiI6MTc2NzYxNzgwNywiaWF0IjoxNzY3NjE3ODA3fQ.HbWriifJkF7dVJos_5_bNV1SV_aTdqIaTeonYEHYORA" \
  -d '{
    "filename": "my-photo.jpg",
    "content_type": "image/jpeg"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "upload_url": "https://example.r2.cloudflarestorage.com/...",
  "file_url": "https://example.r2.cloudflarestorage.com/materials/user123/abc123.jpg",
  "expires_at": "2024-01-01T01:00:00Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| upload_url | string | 预签名上传 URL（用于 PUT 请求上传文件） |
| file_url | string | 文件最终访问 URL（上传完成后使用） |
| expires_at | string | URL 过期时间（15 分钟有效期） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 未授权 |
| 500 | 生成上传链接失败 |

**上传流程:**
1. 调用本接口获取预签名 URL
2. 使用 `upload_url` 发送 PUT 请求上传文件：
   ```bash
   curl -X PUT "UPLOAD_URL" \
     -H "Content-Type: image/jpeg" \
     --data-binary @my-photo.jpg
   ```
3. 上传成功后，使用 `file_url` 作为素材内容创建素材记录

---

## 5. 创建素材

创建新的素材记录。

### 接口信息

- **URL:** `/materials`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 素材标题（1-200 字符） |
| material_type | string | 是 | 素材类型：info/news/image |
| content | string | 是 | 素材内容（info/news 为文本，image 为图片 URL） |

### 请求示例

**文本素材：**

```bash
curl -X POST http://localhost:8080/materials \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTg3MDcsIm5iZiI6MTc2NzYxNzgwNywiaWF0IjoxNzY3NjE3ODA3fQ.HbWriifJkF7dVJos_5_bNV1SV_aTdqIaTeonYEHYORA" \
  -d '{
    "title": "AI 技术资料",
    "material_type": "info",
    "content": "这是关于 AI 技术的详细资料..."
  }'
```

**图片素材：**

```bash
curl -X POST http://localhost:8080/materials \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTg3MDcsIm5iZiI6MTc2NzYxNzgwNywiaWF0IjoxNzY3NjE3ODA3fQ.HbWriifJkF7dVJos_5_bNV1SV_aTdqIaTeonYEHYORA" \
  -d '{
    "title": "产品图片",
    "material_type": "image",
    "content": "https://example.r2.cloudflarestorage.com/materials/user123/abc123.jpg"
  }'
```

### 响应

**成功 (201 Created)**

```json
{
  "id": 123,
  "message": "素材创建成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（标题过长、类型无效） |
| 401 | 未授权 |
| 500 | 创建失败 |

**注意:**
- 用户手动上传的素材，`material_logs_id` 会自动设置为 0
- `source_url` 会自动设置为空字符串
- 图片素材请先使用"获取预签名上传 URL"接口上传图片

---

## 6. 更新素材

更新已有素材的信息，支持部分更新。

### 接口信息

- **URL:** `/materials/:id`
- **方法:** `PUT`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 素材 ID |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 素材标题（1-200 字符） |
| source_url | string | 否 | 素材原链接（有效 URL，最多 500 字符） |
| content | string | 否 | 素材内容 |

**至少提供一个参数。**

### 请求示例

```bash
curl -X PUT http://localhost:8080/materials/20 \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTg3MDcsIm5iZiI6MTc2NzYxNzgwNywiaWF0IjoxNzY3NjE3ODA3fQ.HbWriifJkF7dVJos_5_bNV1SV_aTdqIaTeonYEHYORA" \
  -d '{
    "title": "更新后的标题",
    "source_url": "https://example.com/new-source"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "素材更新成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 未授权 |
| 403 | 无权访问此素材 |
| 404 | 素材不存在 |
| 500 | 更新失败 |

**注意:**
- 只更新提供的非空字段（部分更新）
- 只能更新自己创建的素材

---

## 7. 删除素材

删除指定的素材。

### 接口信息

- **URL:** `/materials/:id`
- **方法:** `DELETE`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 素材 ID |

### 请求示例

```bash
curl -X DELETE http://localhost:8080/materials/20 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njc2MTg3MDcsIm5iZiI6MTc2NzYxNzgwNywiaWF0IjoxNzY3NjE3ODA3fQ.HbWriifJkF7dVJos_5_bNV1SV_aTdqIaTeonYEHYORA"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "素材删除成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 403 | 无权访问此素材 |
| 404 | 素材不存在 |
| 400 | 该素材已被使用，无法删除 |
| 500 | 删除失败 |

**注意:**
- 如果素材已被 `article_materials` 表引用，则无法删除
- 只能删除自己创建的素材
- 删除操作会检查引用关系，确保数据完整性

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X GET http://localhost:8080/materials/list \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

支持的语言：
- `en` (English)
- `zh-CN` (简体中文)

---

## 业务流程

### 素材搜索流程

```
1. POST /materials/search → 触发 n8n 搜索任务
2. GET /materials/search-logs/list → 查看搜索进度（status: doing）
3. 等待 n8n 完成搜索
4. GET /materials/search-logs/list → 查看搜索结果（status: success/failed）
5. GET /materials/list → 查看搜索到的素材列表
```

### 用户上传素材流程

**文本素材：**
```
POST /materials → 直接创建（content 为文本内容）
```

**图片素材：**
```
1. POST /materials/presigned-url → 获取上传 URL
2. PUT {upload_url} → 上传图片文件
3. POST /materials → 创建素材记录（content 为 file_url）
```

### 素材管理流程

```
1. GET /materials/list → 查看素材列表
2. GET /materials/list?name=关键词 → 搜索素材
3. PUT /materials/:id → 更新素材信息
4. DELETE /materials/:id → 删除未使用的素材
```

---

## 素材类型说明

| 类型 | 值 | 说明 | Content 格式 |
|------|------|------|-------------|
| 资料 | info | 文本资料、文档等 | 纯文本 |
| 新闻 | news | 新闻文章 | 纯文本 |
| 图片 | image | 图片文件 | 图片 URL |

---

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": "错误消息描述"
}
```

---

## 注意事项

### 1. 认证要求
- 所有接口都需要有效的 JWT access_token
- Token 应放在 Authorization header 中：`Bearer YOUR_ACCESS_TOKEN`
- Token 过期后使用 `/auth/token/refresh` 刷新

### 2. 用户权限
- 用户只能查看和操作自己创建的素材
- 所有查询自动基于 user_id 过滤
- 更新和删除操作会验证资源所有权

### 3. 文件上传限制
- 预签名 URL 有效期为 15 分钟
- 文件名会随机化，防止覆盖和路径遍历
- 建议上传前验证文件类型和大小

### 4. 素材删除限制
- 已被文章使用的素材无法删除（article_materials 引用检查）
- 删除前请确认素材未被引用

### 5. n8n 搜索
- 搜索由 n8n 工作流异步执行
- 搜索可能需要较长时间，建议轮询查询状态
- 搜索失败会在 remark 字段说明原因

### 6. 分页参数
- `page` 从 1 开始，不是 0
- `page_size` 最大值为 100
- 建议使用合理的分页大小提高性能

### 7. 时间格式
- 所有时间使用 ISO 8601 格式（UTC）
- 示例：`2024-01-01T00:00:00Z`

### 8. 输入验证
- `title`: 1-200 字符
- `search_text`: 1-500 字符
- `source_url`: 有效 URL，最多 500 字符
- `material_type`: 必须是 info/news/image 之一

---

## 安全说明

1. **认证**: 所有接口都需要 JWT token 认证
2. **授权**: 用户只能访问自己的素材
3. **输入验证**: 所有输入参数都经过验证
4. **文件隔离**: 用户上传的文件使用随机文件名，防止冲突
5. **引用完整性**: 删除素材前检查是否被文章使用

---

**文档版本:** 1.0
**最后更新:** 2026-01-05
**作者:** joyful-words development team
