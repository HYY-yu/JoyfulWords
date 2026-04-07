# 信息图接口 API 文档

信息图模块支持将用户输入文本结构化为知识卡片，并异步生成信息图图片。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

---

## 目录

1. [创建信息图任务](#1-创建信息图任务)
2. [获取信息图日志详情](#2-获取信息图日志详情)
3. [将信息图复制到素材表](#3-将信息图复制到素材表)

---

## 1. 创建信息图任务

提交文本并创建一条异步信息图生成任务。

### 接口信息

- **URL:** `/infographics/generate`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 原始文本内容，不能为空 |
| article_id | number | 否 | 关联文章 ID，不传默认为 `0` |
| card_style | string | 是 | 卡片风格枚举，见下方说明 |
| screen_orientation | string | 是 | 画面方向枚举，见下方说明 |
| language | string | 是 | 语言枚举，见下方说明 |
| decoration_level | string | 是 | 装饰密度枚举，见下方说明 |
| user_custom | string | 否 | 用户自定义要求，会注入最终图像提示词 |
| model_name | string | 否 | 指定生图模型名；为空时默认使用 `bytedance/seedream-v4.5` |

### 枚举说明

#### `card_style`

| 值 | 说明 |
|----|------|
| professional | 专业、规整、可信、干净 |
| rustic | 古朴、沉静、雅致 |
| academic | 严谨、清楚、带学术图解感 |
| handdrawn | 手绘学习笔记风格 |
| magazine | 杂志专题页风格 |
| minimal | 极简、克制、高级 |
| fresh | 清新、轻松、亲和 |

#### `screen_orientation`

| 值 | 说明 |
|----|------|
| landscape | 横向布局，当前映射尺寸 `1536x1024` |
| portrait | 竖向布局，当前映射尺寸 `1024x1536` |
| square | 方形布局，当前映射尺寸 `1024x1024` |

#### `language`

| 值 | 说明 |
|----|------|
| zh | 中文 |
| en | 英文 |

#### `decoration_level`

| 值 | 说明 |
|----|------|
| simple | 简洁，装饰元素最少 |
| moderate | 适中，少量图标/底纹/辅助标记 |
| rich | 丰富，更多纹样、角标、插图式点缀 |

### 请求示例

```bash
curl -X POST http://localhost:8080/infographics/generate \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "text": "React Server Components 是一种允许组件在服务端执行并流式传输结果的机制，适合减少客户端 JavaScript 体积，但会增加边界管理复杂度。",
    "article_id": 1,
    "card_style": "professional",
    "screen_orientation": "landscape",
    "language": "zh",
    "decoration_level": "moderate",
    "user_custom": "强调对比关系和关键词",
    "model_name": "bytedance/seedream-v4.5"
  }'
```

### 响应

**成功 (202 Accepted)**

```json
{
  "log_id": 1,
  "status": "pending",
  "poll_url": "/infographics/logs/1",
  "estimated_eta": 60
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| log_id | number | 信息图日志 ID |
| status | string | 当前状态：`pending` |
| poll_url | string | 查询任务详情的轮询地址 |
| estimated_eta | number | 预计完成时间，单位秒 |

### 错误响应

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 400 | invalid_request | 请求体格式错误 |
| 400 | infographic_empty_text | 文本内容为空 |
| 400 | infographic_invalid_language | `language` 不合法 |
| 400 | infographic_invalid_card_style | `card_style` 不合法 |
| 400 | infographic_invalid_screen_orientation | `screen_orientation` 不合法 |
| 400 | infographic_invalid_decoration_level | `decoration_level` 不合法 |
| 400 | infographic_invalid_llm_response | LLM 返回的结构化 JSON 不合法 |
| 401 | not_authenticated | 未认证或 token 无效 |
| 500 | infographic_llm_unavailable | LLM 客户端不可用 |
| 500 | infographic_generate_failed | 创建信息图任务失败 |

### 处理流程说明

- 服务端先调用 `llm_info_to_html` 将文本结构化为单张卡片 JSON
- 结构化结果会写入 `infographic_logs`
- 随后异步提交生图任务
- 后台通过 `infographic_polling` 定时任务轮询 provider 状态
- 成功后图片会上传到 S3，并将 URL 回写到日志表

### 注意

- 当前要求 `cards` 数量必须为 `1`
- 允许中文旧枚举值兼容输入，但 API 契约以英文枚举为准，前端应尽快全部切换到英文
- `card_style` 会实际映射到对应 style prompt 文件，并参与最终图像提示词拼装

---

## 2. 获取信息图日志详情

根据日志 ID 查询当前用户的一条信息图任务详情。

### 接口信息

- **URL:** `/infographics/logs/:id`
- **方法:** `GET`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 信息图日志 ID |

### 请求示例

```bash
curl -X GET http://localhost:8080/infographics/logs/1 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer <access_token>"
```

### 响应

**成功 (200 OK)**

```json
{
  "id": 1,
  "article_id": 1,
  "source_text": "React Server Components 是一种允许组件在服务端执行并流式传输结果的机制。",
  "structured_content": "{\"cards\":[{\"name\":\"React Server Components\",\"type\":\"COMPARE\",\"html_content\":\"<h2>...</h2>\"}]}",
  "card_name": "React Server Components",
  "card_type": "COMPARE",
  "html_content": "<h2>...</h2>",
  "card_style": "professional",
  "screen_orientation": "landscape",
  "language": "zh",
  "decoration_level": "moderate",
  "user_custom": "强调对比关系和关键词",
  "img_prompt": "完整的图像提示词...",
  "provider_name": "fal",
  "model_name": "bytedance/seedream-v4.5",
  "model_reference_id": "provider-task-id",
  "image_urls": "[\"https://cdn.example.com/infographic/1.png\"]",
  "status": "success",
  "error_message": "",
  "created_at": "2026-04-07T08:00:00Z",
  "updated_at": "2026-04-07T08:01:00Z",
  "completed_at": "2026-04-07T08:01:10Z"
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 日志 ID |
| article_id | number | 关联文章 ID |
| source_text | string | 原始输入文本 |
| structured_content | string | LLM 结构化后的完整 JSON 字符串 |
| card_name | string | 卡片标题 |
| card_type | string | 卡片类型：`CONCEPT / COMPARE / EVOLUTION / STRUCTURE / PROCESS / CHECKLIST` |
| html_content | string | 结构化后的 HTML 内容 |
| card_style | string | 卡片风格枚举值 |
| screen_orientation | string | 画面方向枚举值 |
| language | string | 语言枚举值 |
| decoration_level | string | 装饰密度枚举值 |
| user_custom | string | 用户自定义要求 |
| img_prompt | string | 最终提交给生图 provider 的完整提示词 |
| provider_name | string | 生图 provider 名称 |
| model_name | string | 生图模型名 |
| model_reference_id | string | provider 侧任务 ID |
| image_urls | string | 生成结果图片 URL 的 JSON 数组字符串 |
| status | string | 状态：`pending / processing / success / failed` |
| error_message | string | 失败原因；成功时通常为空字符串 |
| created_at | string | 创建时间，UTC ISO 8601 |
| updated_at | string | 更新时间，UTC ISO 8601 |
| completed_at | string | 完成时间，任务未完成时为空 |

### 错误响应

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 400 | invalid_request | `id` 参数无效 |
| 401 | not_authenticated | 未认证或 token 无效 |
| 404 | infographic_log_not_found | 日志不存在，或不属于当前用户 |
| 500 | server_error | 查询失败 |

### 状态说明

| 状态 | 含义 |
|------|------|
| pending | 已完成结构化，等待异步提交生图任务 |
| processing | 已提交 provider，等待轮询完成 |
| success | 生成成功，`image_urls` 可用 |
| failed | 生成失败，查看 `error_message` |

### 注意

- `image_urls` 当前返回的是 JSON 数组字符串，前端需要自行反序列化
- `structured_content` 也是字符串形式的 JSON，便于直接展示和调试
- 若任务尚未完成，`completed_at` 为空，`image_urls` 可能为空字符串或空数组字符串

---

## 3. 将信息图复制到素材表

将一条已生成成功的信息图记录中的图片复制到 `materials` 表，便于后续在文章素材系统中复用。

### 接口信息

- **URL:** `/infographics/logs/:id/copy-to-materials`
- **方法:** `POST`
- **需要认证:** 是（需要有效的 access_token）

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 信息图日志 ID |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_id | number | 否 | 复制到素材表时覆盖使用的文章 ID；不传则默认使用信息图日志中的 `article_id` |

### 请求示例

```bash
curl -X POST http://localhost:8080/infographics/logs/1/copy-to-materials \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "article_id": 2
  }'
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "信息图已成功复制到素材",
  "count": 1,
  "material_ids": [101]
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| message | string | 本地化成功消息 |
| count | number | 成功创建的素材数量 |
| material_ids | array | 新建素材记录 ID 列表 |

### 复制规则

- 仅允许复制当前用户自己的信息图记录
- 仅允许复制状态为 `success` 的信息图
- 会读取 `image_urls` 中的所有图片 URL，并逐条写入 `materials`
- 新建素材的字段规则：
  - `material_logs_id = 0`
  - `material_type = "image"`
  - `source_url = ""`
  - `content = 图片 URL`
  - `title = from-infographic-{card_type}-{UTC时间}`

### 错误响应

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 400 | invalid_request | 请求格式错误或 `id/article_id` 不合法 |
| 400 | infographic_not_completed | 信息图尚未生成成功 |
| 400 | infographic_no_images | 信息图没有可复制的图片 |
| 401 | not_authenticated | 未认证或 token 无效 |
| 404 | infographic_log_not_found | 日志不存在，或不属于当前用户 |
| 500 | server_error | 查询日志、解析图片地址或创建素材失败 |

### 注意

- 当前 `image_urls` 存的是 JSON 数组字符串，接口内部会先解析再落库
- 如果一条信息图结果中有多张图片，会创建多条素材记录
- `article_id` 为空时，默认继承信息图日志中的 `article_id`
