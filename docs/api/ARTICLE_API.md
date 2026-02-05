# 文章管理接口 API 文档

文章管理系统，支持 AI 写作、文章 CRUD 操作和状态管理。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

---

## 目录

1. [AI 写文章](#1-ai-写文章)
2. [AI 编辑文章](#2-ai-编辑文章)
3. [获取文章列表](#3-获取文章列表)
4. [新建文章](#4-新建文章)
5. [编辑文章内容](#5-编辑文章内容)
6. [编辑文章元数据](#6-编辑文章元数据)
7. [删除文章](#7-删除文章)
8. [更新文章状态](#8-更新文章状态)

---

## 1. AI 写文章

调用 n8n 工作流进行异步 AI 文章生成。

### 接口信息

- **URL:** `/article/ai-write`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数             | 类型       | 必填 | 说明                |
|----------------|----------|----|-------------------|
| req            | string   | 是  | 写作要求/主题（1-500 字符） |
| link_post      | number   | 否  | 关联的竞品文章 ID        |
| link_materials | number[] | 否  | 关联的素材 ID 列表       |

### 请求示例

```bash
curl -X POST http://localhost:8080/article/ai-write \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A" \
  -d '{
    "req": "写一篇小鹏飞行汽车的科普介绍性文章",
    "link_post": 0,
    "link_materials": [91, 89, 88]
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "id": 123
}
```

| 字段 | 类型     | 说明       |
|----|--------|----------|
| id | number | 创建的文章 ID |

**错误响应**

| 状态码 | 说明                                              |
|-----|-------------------------------------------------|
| 400 | 请求格式错误（req 过长、link_post 不存在、link_materials 不存在） |
| 401 | 未授权（token 无效或过期）                                |
| 500 | AI 写作启动失败或文章未创建                                 |

**注意:**

- 文章生成由 n8n 工作流异步执行
- 创建的文章初始状态为 `init`（AI 编写中）
- 生成完成后状态会自动更新为 `draft`
- 可通过"获取文章列表"接口查看文章状态
- 关联的素材和竞品文章会自动建立关联关系

---

## 2. AI 编辑文章

使用 AI 对文章的选中段落进行编辑和改写。

### 接口信息

- **URL:** `/article/edit`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数         | 类型     | 必填 | 说明                                   |
|------------|--------|----|--------------------------------------|
| article_id | string | 是  | 文章 id                                |
| article    | string | 是  | 完整文章内容                               |
| cut_text   | string | 是  | 用户选择的需要编辑的段落（必须是 article 的子集）        |
| type       | string | 是  | 编辑类型，可选值：`material`、`style`、`struct` |
| data       | object | 是  | 编辑数据，根据 type 不同结构不同                  |

#### type="material" - 素材扩充

根据选择的素材，改写对应段落并插入素材引用。

**data 结构:**

| 参数           | 类型       | 必填 | 说明       |
|--------------|----------|----|----------|
| material_ids | number[] | 是  | 素材 ID 列表 |

#### type="style" - 风格调整

将段落改写为指定风格。

**data 结构:**

| 参数          | 类型     | 必填 | 说明                                                                                                                              |
|-------------|--------|----|---------------------------------------------------------------------------------------------------------------------------------|
| style_type  | string | 是  | 风格类型，可选值：`Professional`（更专业）、`Concise`（更简短）、`Friendly`（更友好）、`Colloquial`（更口语化）、`Assertive`（更强势）、`Restrained`（更克制）、`Custom`（自定义） |
| custom_text | string | 否  | 当 style_type=`Custom` 时必填，自定义风格要求（最多 500 字符）                                                                                    |

#### type="struct" - 结构优化

优化段落结构，不新增事实、不删核心信息。

**data 结构:**

| 参数          | 类型     | 必填 | 说明                                                                                                                                 |
|-------------|--------|----|------------------------------------------------------------------------------------------------------------------------------------|
| struct_type | string | 是  | 结构类型，可选值：`De-Redundancy`（去冗余表达）、`Information-Layering`（信息分层）、`Point-Form`（要点化）、`Short-Sentencing`（短句化）、`Data-Highlighting`（关键数据凸显） |

### 请求示例

#### 示例 1：素材扩充

```bash
curl -X POST http://localhost:8080/article/edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "article": "人工智能正在改变世界。机器学习是AI的重要分支。",
    "cut_text": "机器学习是AI的重要分支",
    "type": "material",
    "data": {
      "material_ids": [123, 456, 789]
    }
  }'
```

#### 示例 2：风格调整

```bash
curl -X POST http://localhost:8080/article/edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "article": "人工智能正在改变世界。机器学习是AI的重要分支。",
    "cut_text": "人工智能正在改变世界",
    "type": "style",
    "data": {
      "style_type": "Professional",
      "custom_text": ""
    }
  }'
```

#### 示例 3：结构优化

```bash
curl -X POST http://localhost:8080/article/edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "article": "人工智能有很多优点。首先，它提高效率。其次，它降低成本。",
    "cut_text": "人工智能有很多优点。首先，它提高效率。其次，它降低成本。",
    "type": "struct",
    "data": {
      "struct_type": "Point-Form"
    }
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "response_text": "改写后的段落内容..."
}
```

| 字段            | 类型     | 说明          |
|---------------|--------|-------------|
| response_text | string | AI 改写后的段落内容 |

**错误响应**

| 状态码 | 说明                                                                          |
|-----|-----------------------------------------------------------------------------|
| 400 | 请求格式错误（cut_text 不是 article 的子集、material_ids 不存在、style_type/struct_type 无效等） |
| 401 | 未授权（token 无效或过期）                                                            |
| 500 | AI 编辑失败（n8n 处理失败或返回错误）                                                      |

**注意:**

- 文章编辑由 n8n 工作流同步执行
- 返回的 `response_text` 是改写后的完整段落
- 前端编辑器应使用定时保存机制将改写后的内容保存到数据库
- AI 会根据整篇文章的文风进行适配改写，只改写 `cut_text`，不影响其他内容
- 如果 n8n 返回 `response_error`，Go 服务会记录日志并返回 500 错误

---

## 3. 获取文章列表

查看用户的文章列表，包括关联的素材和竞品文章信息。

### 接口信息

- **URL:** `/article`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数        | 类型     | 必填 | 说明                                 |
|-----------|--------|----|------------------------------------|
| page      | number | 否  | 页码，从 1 开始，默认 1                     |
| page_size | number | 否  | 每页数量，默认 20，最大 100                  |
| title     | string | 否  | 标题筛选（模糊搜索）                         |
| status    | string | 否  | 状态过滤：init/draft/published/archived |

### 请求示例

```bash
curl -X GET "http://localhost:8080/article?page=1&page_size=20&status=draft" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A"
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
      "title": "量子计算机发展概述",
      "content": "量子计算机是利用量子力学原理...",
      "status": "draft",
      "category": "technology",
      "tags": "量子计算,科技,AI",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T09:00:00Z",
      "materials": [
        {
          "id": 10,
          "type": "news",
          "title": "量子计算最新突破",
          "source_url": "https://example.com/news1"
        },
        {
          "id": 20,
          "type": "image",
          "title": "量子芯片示意图",
          "content": "https://example.r2.cloudflarestorage.com/images/quantum.jpg",
          "source_url": "https://example.com/image-source"
        }
      ],
      "posts": [
        {
          "id": 5,
          "platform": "linkedin",
          "content": "量子计算的最新进展令人兴...",
          "author_name": "张三",
          "original_link": "https://linkedin.com/posts/123"
        }
      ]
    }
  ]
}
```

| 字段         | 类型     | 说明                                 |
|------------|--------|------------------------------------|
| id         | number | 文章 ID                              |
| user_id    | number | 用户 ID                              |
| title      | string | 文章标题                               |
| content    | string | 文章内容                               |
| status     | string | 文章状态：init/draft/published/archived |
| category   | string | 文章分类                               |
| tags       | string | 文章标签（逗号分隔）                         |
| updated_at | string | 更新时间（ISO 8601 格式）                  |
| created_at | string | 创建时间（ISO 8601 格式）                  |
| materials  | array  | 关联的素材列表                            |
| posts      | array  | 关联的竞品文章列表                          |

**materials 字段说明:**

| 字段         | 类型     | 说明                      |
|------------|--------|-------------------------|
| id         | number | 素材 ID                   |
| type       | string | 素材类型：info/news/image    |
| title      | string | 素材标题                    |
| content    | string | 素材内容（仅当 type=image 时返回） |
| source_url | string | 素材来源链接                  |

**posts 字段说明:**

| 字段            | 类型     | 说明                            |
|---------------|--------|-------------------------------|
| id            | number | 竞品文章 ID                       |
| platform      | string | 平台：linkedin/x/facebook/reddit |
| content       | string | 文章内容（前 10 个字符）                |
| author_name   | string | 作者名称                          |
| original_link | string | 原始链接                          |

**错误响应**

| 状态码 | 说明     |
|-----|--------|
| 400 | 分页参数无效 |
| 401 | 未授权    |

---

## 4. 新建文章

用户手动创建文章（非 AI 生成）。

### 接口信息

- **URL:** `/article`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数       | 类型     | 必填 | 说明                   |
|----------|--------|----|----------------------|
| title    | string | 是  | 文章标题（1-200 字符）       |
| content  | string | 是  | 文章内容                 |
| category | string | 否  | 文章分类（最多 100 字符）      |
| tags     | string | 否  | 文章标签，逗号分隔（最多 500 字符） |

### 请求示例

```bash
curl -X POST http://localhost:8080/article \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A" \
  -d '{
    "title": "人工智能的未来",
    "content": "人工智能正在改变我们的世界...",
    "category": "technology",
    "tags": "AI,科技,未来"
  }'
```

### 响应

**成功 (201 Created)**

```json
{
  "id": 123,
  "message": "文章创建成功"
}
```

| 字段      | 类型     | 说明       |
|---------|--------|----------|
| id      | number | 创建的文章 ID |
| message | string | 成功消息     |

**错误响应**

| 状态码 | 说明                  |
|-----|---------------------|
| 400 | 请求格式错误（标题过长、缺少必填字段） |
| 401 | 未授权                 |
| 500 | 文章创建失败              |

**注意:**

- 手动创建的文章默认状态为 `draft`
- `category` 和 `tags` 不提供时默认为空字符串
- 创建后可通过其他接口添加素材和竞品文章关联

---

## 5. 编辑文章内容

更新文章的内容字段（独立接口，性能优化）。

### 接口信息

- **URL:** `/article/:id/content`
- **方法:** `PUT`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型     | 必填 | 说明    |
|----|--------|----|-------|
| id | number | 是  | 文章 ID |

### 请求参数

| 参数      | 类型     | 必填 | 说明     |
|---------|--------|----|--------|
| content | string | 是  | 新的文章内容 |

### 请求示例

```bash
curl -X PUT http://localhost:8080/article/2/content \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A" \
  -d '{
    "content": "更新后的文章内容..."
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "文章内容更新成功"
}
```

**错误响应**

| 状态码 | 说明                 |
|-----|--------------------|
| 400 | 请求格式错误（content 为空） |
| 401 | 未授权                |
| 403 | 无权访问此文章            |
| 404 | 文章不存在              |
| 500 | 更新失败               |

**注意:**

- 此接口仅更新 `content` 字段
- 文章内容可能很长，独立接口避免传输不必要的数据
- 只能更新自己创建的文章

---

## 6. 编辑文章元数据

更新文章的标题、分类、标签等元数据，支持部分更新。

### 接口信息

- **URL:** `/article/:id`
- **方法:** `PUT`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型     | 必填 | 说明    |
|----|--------|----|-------|
| id | number | 是  | 文章 ID |

### 请求参数

| 参数       | 类型     | 必填 | 说明                   |
|----------|--------|----|----------------------|
| title    | string | 否  | 文章标题（1-200 字符）       |
| category | string | 否  | 文章分类（最多 100 字符）      |
| tags     | string | 否  | 文章标签，逗号分隔（最多 500 字符） |

**至少提供一个参数。**

### 请求示例

```bash
# 只更新标题
curl -X PUT http://localhost:8080/article/2 \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A" \
  -d '{
    "title": "更新后的标题"
  }'

# 更新多个字段
curl -X PUT http://localhost:8080/article/123 \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "更新后的标题",
    "category": "AI技术",
    "tags": "机器学习,深度学习,神经网络"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "文章更新成功"
}
```

**错误响应**

| 状态码 | 说明           |
|-----|--------------|
| 400 | 请求格式错误（标题过长） |
| 401 | 未授权          |
| 403 | 无权访问此文章      |
| 404 | 文章不存在        |
| 500 | 更新失败         |

**注意:**

- 只更新提供的非空字段（部分更新）
- 不提供的字段保持不变
- 只能更新自己创建的文章

---

## 7. 删除文章

删除指定的文章，同时级联删除关联的素材和竞品文章引用。

### 接口信息

- **URL:** `/article/:id`
- **方法:** `DELETE`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型     | 必填 | 说明    |
|----|--------|----|-------|
| id | number | 是  | 文章 ID |

### 请求示例

```bash
curl -X DELETE http://localhost:8080/article/2 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "文章删除成功"
}
```

**错误响应**

| 状态码 | 说明      |
|-----|---------|
| 401 | 未授权     |
| 403 | 无权访问此文章 |
| 404 | 文章不存在   |
| 500 | 删除失败    |

**注意:**

- 删除操作会级联删除 `article_materials` 和 `article_posts` 表中的关联记录
- 不会删除实际的素材（materials）或竞品文章（posts），只删除关联关系
- 使用事务确保删除操作的原子性
- 只能删除自己创建的文章

---

## 8. 更新文章状态

更新文章的状态，支持特定的状态转换。

### 接口信息

- **URL:** `/article/:id/status`
- **方法:** `PUT`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型     | 必填 | 说明    |
|----|--------|----|-------|
| id | number | 是  | 文章 ID |

### 请求参数

| 参数     | 类型     | 必填 | 说明                            |
|--------|--------|----|-------------------------------|
| status | string | 是  | 目标状态：draft/published/archived |

### 请求示例

```bash
# 将草稿发布
curl -X PUT http://localhost:8080/article/1/status \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImZlbmdAZXhhbXBsZS5jb20iLCJleHAiOjE3Njg1NTc1ODUsIm5iZiI6MTc2ODU1NjY4NSwiaWF0IjoxNzY4NTU2Njg1fQ.C9voHngegiusq_CSZnArBM03JUnADWI-BTjeMkuNF-A" \
  -d '{
    "status": "published"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "文章状态更新成功"
}
```

**错误响应**

| 状态码 | 说明                    |
|-----|-----------------------|
| 400 | 请求格式错误（状态值无效或状态转换不允许） |
| 401 | 未授权                   |
| 403 | 无权访问此文章               |
| 404 | 文章不存在                 |
| 500 | 更新失败                  |

**状态转换规则:**

| 当前状态      | 可转换到的状态   | 说明             |
|-----------|-----------|----------------|
| init      | draft     | AI 写作完成，进入编辑状态 |
| draft     | published | 发布文章           |
| draft     | archived  | 直接存档草稿         |
| published | archived  | 存档已发布文章        |

**不允许的转换:**

- `published` → `draft`: 已发布不能退回草稿
- `archived` → 任何状态: 已存档不能恢复
- `init` → `published`: AI 完成后需先进入草稿状态

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X GET http://localhost:8080/article \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

支持的语言：

- `en` (English)
- `zh-CN` (简体中文)

---

## 业务流程

### AI 写作流程

```
1. POST /article/ai-write → 触发 n8n AI 写作任务
2. GET /article → 查看文章状态（status: init）
3. 等待 n8n 完成生成
4. GET /article → 查看生成结果（status: draft）
5. PUT /article/:id/content → 编辑内容
6. PUT /article/:id/status → 发布文章（status: published）
```

### 手动创建文章流程

```
1. POST /article → 创建文章（status: draft）
2. PUT /article/:id/content → 编辑内容
3. PUT /article/:id → 更新元数据
4. PUT /article/:id/status → 发布文章
```

### 文章管理流程

```
1. GET /article → 查看文章列表
2. GET /article?status=draft → 筛选草稿文章
3. PUT /article/:id → 更新文章信息
4. PUT /article/:id/status → 管理文章状态
5. DELETE /article/:id → 删除不需要的文章
```

---

## 文章状态说明

| 状态  | 值         | 说明        | 可执行操作    |
|-----|-----------|-----------|----------|
| 编写中 | init      | AI 正在生成文章 | 等待生成完成   |
| 草稿  | draft     | 用户编辑中     | 编辑、发布、存档 |
| 已发布 | published | 文章已发布     | 存档       |
| 已存档 | archived  | 文章已存档     | 只读       |

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

- 用户只能查看和操作自己创建的文章
- 所有查询自动基于 user_id 过滤
- 更新和删除操作会验证资源所有权

### 3. AI 写作

- AI 写作由 n8n 工作流异步执行
- 生成可能需要较长时间，建议轮询查询状态
- 初始状态为 `init`，完成后变为 `draft`
- 可同时关联素材和竞品文章作为参考

### 4. 内容编辑

- 文章内容可能很长，建议使用专门的 `/article/:id/content` 接口更新
- 元数据更新使用 `/article/:id` 接口
- 两个接口可以配合使用，提高性能

### 5. 文章删除

- 删除操作会级联删除关联关系（article_materials、article_posts）
- 不会删除实际的素材和竞品文章
- 使用事务确保删除操作的原子性
- 删除前请确认不再需要该文章

### 6. 状态管理

- 状态转换有严格规则，不允许随意转换
- `published` 状态不能退回到 `draft`
- `archived` 状态是最终状态，不能恢复
- 建议在发布前仔细检查文章内容

### 7. 分页参数

- `page` 从 1 开始，不是 0
- `page_size` 最大值为 100
- 建议使用合理的分页大小提高性能

### 8. 时间格式

- 所有时间使用 ISO 8601 格式（UTC）
- 示例：`2024-01-15T10:30:00Z`

### 9. 输入验证

- `title`: 1-200 字符
- `req`: 1-500 字符
- `content`: 必填字段
- `category`: 最多 100 字符
- `tags`: 最多 500 字符，逗号分隔
- `status`: 必须是 draft/published/archived 之一

### 10. 关联关系

- AI 写作时可同时关联素材和竞品文章
- 关联关系通过 `article_materials` 和 `article_posts` 表维护
- 删除文章时自动删除关联关系

---

## 安全说明

1. **认证**: 所有接口都需要 JWT token 认证
2. **授权**: 用户只能访问自己的文章
3. **输入验证**: 所有输入参数都经过验证
4. **状态转换**: 严格验证状态转换规则，防止非法操作
5. **级联删除**: 使用事务确保删除操作的数据一致性
6. **内容隔离**: 用户数据完全隔离，防止越权访问

---

**文档版本:** 1.0
**最后更新:** 2026-01-16
**作者:** joyful-words development team
