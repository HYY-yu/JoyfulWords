# 社交媒体抓取接口 API 文档

社交媒体内容抓取系统，支持从 Facebook、LinkedIn、X (Twitter)、Reddit 等平台抓取用户主页和单篇帖子内容。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

**集成服务:** Bright Data Scraping Browser API

---

## 目录

1. [触发内容抓取](#1-触发内容抓取)
2. [获取定时任务列表](#2-获取定时任务列表)
3. [获取抓取结果列表](#3-获取抓取结果列表)
4. [更新任务状态](#4-更新任务状态)
5. [删除任务](#5-删除任务)
6. [获取CrawLogs日志列表](#6-获取crowlogs日志列表)

---

## 1. 触发内容抓取

触发社交媒体内容抓取任务，支持立即抓取和定时抓取两种模式。

### 接口信息

- **URL:** `/social/fetch`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | string | 是 | 社交媒体平台：Facebook/LinkedIn/X/Reddit |
| url | string | 是 | 抓取的 URL（有效 URL） |
| url_type | string | 是 | URL 类型：profile（个人主页）/ post（单篇帖子） |
| num_of_posts | number | 是 | 抓取的帖子数量（1-3） |
| is_scheduled | boolean | 否 | 是否定时抓取，默认 false |
| cron_interval | string | 条件必填 | 定时抓取的 cron 表达式（is_scheduled=true 时必填） |

**限制条件:**
- 定时抓取只能选择 `url_type=profile`（个人主页）
- 定时抓取必须提供 `cron_interval`（5 字段 cron 表达式：分 时 日 月 周）
- 单次抓取最多获取 3 篇帖子

### Cron 表达式格式

使用 5 字段标准 cron 表达式（分 时 日 月 周）：

| 表达式 | 说明 |
|--------|------|
| `* * * * *` | 每分钟执行 |
| `0 * * * *` | 每小时执行（整点） |
| `0 0 * * *` | 每天执行（午夜） |
| `0 0 * * 0` | 每周日执行（午夜） |
| `0 0 1 * *` | 每月 1 号执行（午夜） |
| `*/5 * * * *` | 每 5 分钟执行 |
| `0 */2 * * *` | 每 2 小时执行 |
| `0 9 * * *` | 每天上午 9 点执行 |

### 请求示例

**立即抓取个人主页：**

```bash
curl -X POST http://localhost:8080/social/fetch \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "platform": "Facebook",
    "url": "https://www.facebook.com/username",
    "url_type": "profile",
    "num_of_posts": 3,
    "is_scheduled": false
  }'
```

**定时抓取（每天执行）：**

```bash
curl -X POST http://localhost:8080/social/fetch \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "platform": "LinkedIn",
    "url": "https://www.linkedin.com/in/username",
    "url_type": "profile",
    "num_of_posts": 3,
    "is_scheduled": true,
    "cron_interval": "0 9 * * *"
  }'
```

**抓取单篇帖子：**

```bash
curl -X POST http://localhost:8080/social/fetch \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "platform": "X",
    "url": "https://x.com/user/status/1234567890",
    "url_type": "post",
    "num_of_posts": 1,
    "is_scheduled": false
  }'
```

### 响应

**立即抓取 (200 OK)**

```json
{
  "message": "异步抓取中",
  "is_scheduled": false
}
```

**定时任务创建成功 (200 OK)**

```json
{
  "task_id": 123,
  "message": "定时任务创建成功",
  "is_scheduled": true
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（平台不支持、URL 无效、定时抓取只能选择个人主页） |
| 401 | 未授权（token 无效或过期） |
| 500 | 创建任务失败或抓取失败 |

**注意:**
- 立即抓取是异步操作，由后台轮询线程处理
- 定时任务会按照 cron 表达式周期性执行
- 抓取结果会保存到 `posts` 表，可通过"获取抓取结果列表"接口查看

---

## 2. 获取定时任务列表

查看用户创建的所有定时抓取任务。

### 接口信息

- **URL:** `/social/tasks/list`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 10，最大 100 |

### 请求示例

```bash
curl -X GET "http://localhost:8080/social/tasks/list?page=1&page_size=10" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "tasks": [
    {
      "id": 123,
      "platform": "Facebook",
      "url": "https://www.facebook.com/username",
      "url_type": "profile",
      "cron_interval": "0 9 * * *",
      "interval_desc": "每天 9:00",
      "last_run_at": "2026-01-14T09:09:52Z",
      "next_run_at": "2026-01-14T09:09:52Z",
      "status": "running",
      "created_at": "2026-01-14T09:09:52Z"
    }
  ],
  "total": 5
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 任务 ID |
| platform | string | 社交媒体平台 |
| url | string | 抓取的 URL |
| url_type | string | URL 类型（profile/post） |
| cron_interval | string | Cron 表达式 |
| interval_desc | string | 执行间隔的中文描述 |
| last_run_at | string | 上次执行时间（格式：YYYY-MM-DD HH:mm:ss） |
| next_run_at | string | 下次执行时间（格式：YYYY-MM-DD HH:mm:ss） |
| status | string | 任务状态：running（运行中）/ paused（已暂停） |
| created_at | string | 任务创建时间（格式：YYYY-MM-DD HH:mm:ss） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |

---

## 3. 获取抓取结果列表

查看用户所有已抓取的社交媒体帖子。

### 接口信息

- **URL:** `/social/results/list`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 10，最大 100 |

### 请求示例

```bash
curl -X GET "http://localhost:8080/social/results/list?page=1&page_size=10" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "posts": [
    {
      "id": "456",
      "user_id": "username",
      "content": "这是帖子的内容...",
      "url": "https://facebook.com/posts/123",
      "platform": "Facebook",
      "like_count": 0,
      "comment_count": 0,
      "share_count": 0,
      "posted_at": "2024-01-01T12:00:00Z",
      "created_at": "2024-01-01T12:05:00Z"
    }
  ],
  "total": 50
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 帖子 ID |
| user_id | string | 作者用户名 |
| content | string | 帖子内容 |
| url | string | 帖子原始链接 |
| platform | string | 社交媒体平台 |
| like_count | number | 点赞数 |
| comment_count | number | 评论数 |
| share_count | number | 分享数 |
| posted_at | string | 帖子发布时间（ISO 8601 格式） |
| created_at | string | 抓取时间（ISO 8601 格式） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |

**注意:**
- 结果按照创建时间倒序排列（最新的在前）
- 数据来自 `posts` 表，自动基于 user_id 过滤
- 互动数据（点赞、评论、分享）取决于平台和抓取时机

---

## 4. 更新任务状态

暂停或恢复定时任务的执行。

### 接口信息

- **URL:** `/social/tasks/:id/status`
- **方法:** `PUT`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 任务 ID |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 目标状态：running（运行）/ paused（暂停） |

### 请求示例

**暂停任务：**

```bash
curl -X PUT http://localhost:8080/social/tasks/123/status \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "paused"
  }'
```

**恢复任务：**

```bash
curl -X PUT http://localhost:8080/social/tasks/123/status \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "running"
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "任务状态更新成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误（状态值无效） |
| 401 | 未授权 |
| 404 | 任务不存在或无权访问 |
| 500 | 更新失败或重启任务失败 |

**注意:**
- 只能操作自己创建的任务
- 暂停的任务不会执行，但会保留在数据库中
- 从暂停恢复为运行时会重启任务

---

## 5. 删除任务

删除指定的定时抓取任务。

### 接口信息

- **URL:** `/social/tasks/:id`
- **方法:** `DELETE`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 任务 ID |

### 请求示例

```bash
curl -X DELETE http://localhost:8080/social/tasks/123 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "任务删除成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 任务 ID 无效 |
| 401 | 未授权 |
| 404 | 任务不存在或无权访问 |
| 500 | 删除失败 |

**注意:**
- 只能删除自己创建的任务
- 删除任务会停止其执行并从数据库中移除
- 已抓取的内容不会被删除

---

## 6. 获取CrawLogs日志列表

查看用户所有抓取任务的快照日志记录。

### 接口信息

- **URL:** `/social/craw-logs`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 10，最大 100 |

### 请求示例

```bash
curl -X GET "http://localhost:8080/social/craw-logs?page=1&page_size=10" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "logs": [
    {
      "id": 1,
      "state": 3,
      "snapshot_id": "gd_lkaxegm826bjpoo9m5_20240119120000",
      "created_at": "2026-01-14T09:09:52Z",
      "updated_at": "2026-01-14T09:09:52Z"
    },
    {
      "id": 2,
      "state": 2,
      "snapshot_id": "gd_lkaxegm826bjpoo9m5_20240119110000",
      "created_at": "2026-01-14T09:09:52Z",
      "updated_at": "2026-01-14T09:09:52Z"
    }
  ],
  "total": 15
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 快照记录 ID |
| state | number | 快照状态：1-等待处理，2-处理中，3-已完成，4-失败 |
| snapshot_id | string | Bright Data 快照 ID |
| created_at | string | 创建时间（格式：2006-01-02T15:04:05Z，UTC） |
| updated_at | string | 更新时间（格式：2006-01-02T15:04:05Z，UTC） |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 分页参数无效 |
| 401 | 未授权 |
| 500 | 查询失败 |

**注意:**
- 结果按照创建时间倒序排列（最新的在前）
- 数据来自 `crow_snapshot` 表，自动基于 user_id 过滤
- state 字段的值：1=等待处理，2=处理中，3=已完成，4=失败
- 时间使用 UTC 时区

---

## 国际化支持

所有接口支持通过 `Accept-Language` 请求头设置语言：

```bash
curl -X GET http://localhost:8080/social/tasks/list \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

支持的语言：
- `en` (English)
- `zh-CN` (简体中文)

---

## 业务流程

### 立即抓取流程

```
1. POST /social/fetch (is_scheduled=false) → 触发抓取任务
2. 系统创建 CrowSnapshot 记录（状态：pending）
3. 后台轮询线程每分钟检查待处理的 snapshot
4. 调用 Bright Data API 获取数据
5. 解析数据并保存到 posts 表
6. GET /social/results/list → 查看抓取结果
```

### 定时抓取流程

```
1. POST /social/fetch (is_scheduled=true) → 创建定时任务
2. 系统按照 cron 表达式周期性执行任务
3. 每次执行时创建新的 CrowSnapshot 记录
4. 后台轮询线程处理并保存结果
5. GET /social/tasks/list → 查看任务列表
6. GET /social/results/list → 查看所有抓取结果
```

### 任务管理流程

```
1. GET /social/tasks/list → 查看所有任务
2. PUT /social/tasks/:id/status → 暂停/恢复任务
3. DELETE /social/tasks/:id → 删除不需要的任务
```

---

## 支持的社交媒体平台

| 平台 | Platform 值 | 数据集 ID（Profile） | 数据集 ID（Post） |
|------|-------------|---------------------|-------------------|
| Facebook | Facebook | gd_lkaxegm826bjpoo9m5 | gd_lyclm1571iy3mv57zw |
| LinkedIn | LinkedIn | gd_lyy3tktm25m4avu764 | gd_lyy3tktm25m4avu764 |
| X (Twitter) | X | gd_lwxmeb2u1cniijd7t4 | gd_lwxkxvnf1cynvib9co |
| Reddit | Reddit | gd_mgnh0p8w16o65lmhp | gd_lvz8ah06191smkebj4 |

**平台特性:**
- **Facebook**: 支持个人主页和单篇帖子抓取
- **LinkedIn**: 支持个人主页和帖子抓取
- **X**: 支持用户主页和推文抓取
- **Reddit**: 支持用户主页和帖子抓取

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

### 4. 异步处理
- 立即抓取是异步操作，不会立即返回结果
- 后台线程每分钟检查并处理待处理的 snapshot
- 抓取完成后可通过"获取抓取结果列表"查看

### 5. 定时任务
- 使用 5 字段 cron 表达式（分 时 日 月 周）
- 任务暂停后不会执行，但保留在数据库中
- 删除任务不会删除已抓取的内容

### 6. 分页参数
- `page` 从 1 开始，不是 0
- `page_size` 最大值为 100
- 建议使用合理的分页大小提高性能

### 7. 时间格式
- API 响应中的时间使用 ISO 8601 格式（UTC）：`2024-01-01T12:00:00Z`

### 8. 平台差异
- 不同平台的数据字段可能不同
- 互动数据（点赞、评论、分享）取决于平台和抓取时机
- 某些平台可能不支持某些字段（如视频 URL）

### 10. 数据持久化
- 抓取结果永久保存在数据库中
- 删除任务不会删除已抓取的内容
- 如需清理数据，需手动操作数据库

---

**文档版本:** 1.0
**最后更新:** 2026-01-19
**作者:** joyful-words development team
