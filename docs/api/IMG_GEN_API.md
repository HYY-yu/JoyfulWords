# Image Generation API

图片生成服务 API 文档。

## 基础路径

```
/image-generation
```

## 认证

除提示词转换端点外，大部分端点需要 Bearer Token 认证：

```
Authorization: Bearer <token>
```

## 端点

### 1. 获取支持的模型列表

获取当前支持的图片生成模型列表。

**端点：** `GET /image-generation/models`

**认证：** 不需要

**响应（200 OK）：**

```json
{
  "provider": "wavespeed",
  "models": [
    "qwen-image-2.0"
  ]
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `provider` | string | Provider 名称 |
| `models` | array | 支持的模型名称列表 |

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 500 | server_error | 服务器内部错误 |

**示例 cURL：**

```bash
curl http://localhost:8080/image-generation/models
```

---

### 2. 提示词转换

将 Creator 配置转换为专业图片生成提示词。

**端点：** `POST /image-generation/convert-prompt`

**认证：** Token

**请求体：**

```json
{
  "gen_mode": "creator",
  "config": {
    "version": "1.0",
    "meta": {
      "width": 1024,
      "high": 1024,
      "seed": -1
    },
    "global_style": {
      "medium": "Oil Painting",
      "style": "Renaissance",
      "color_accent": "Pastel"
    },
    "composition": {
      "camera": {
        "angle": "Low Angle",
        "focal_length": "35mm",
        "depth_of_field": "Shallow"
      },
      "lighting": {
        "type": "Volumetric Lighting",
        "source": "Top-down",
        "intensity": 0.9
      }
    },
    "layers": [
      {
        "id": "subject_1",
        "description": "A beautiful landscape",
        "reference_image": "https://example.com/ref.jpg",
        "spatial_layout": {
          "box_2d": [0.2, 0.2, 0.6, 0.6],
          "z_index": 1
        }
      }
    ]
  },
  "model_name": "optional-model-name"
}
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `gen_mode` | string | 是 | 生成模式：`creator`（创作模式）或 `style`（风格模式） |
| `config` | object | 否 | Creator 配置对象 |
| `model_name` | string | 否 | 指定使用的模型名（如 qwen-image-2.0-pro） |

**响应（200 OK）：**

```json
{
  "enhanced_prompt": "Oil Painting style Renaissance with Pastel color palette. Volumetric Lighting lighting from Top-down, Low Angle camera angle, 35mm lens, Shallow depth of field. A beautiful landscape (position: 20.0%, 20.0%, size: 60.0% x 60.0%), highly detailed, professional photography, 8k resolution, sharp focus, masterpiece",
  "reference_images": [
    "https://example.com/ref.jpg"
  ]
}
```

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 400 | invalid_request | 请求格式错误 |
| 400 | invalid_creator_config | Creator 配置无效 |
| 400 | invalid_image_width | 宽度必须在 256-4096 |
| 400 | invalid_image_height | 高度必须在 256-4096 |
| 400 | no_layers_defined | 至少需要一个图层 |

---

### 3. 创建图片生成任务

创建异步图片生成任务。

**端点：** `POST /image-generation/generate`

**认证：** 需要

**请求体：**

```json
{
  "gen_mode": "creator",
  "config": { /* Creator 配置（可选）*/ },
  "prompt": "A beautiful landscape with mountains",
  "model_name": "mock-model-v1",
  "material_ids": [1, 2, 3],
  "reference_images": ["https://example.com/ref1.jpg"]
}
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `gen_mode` | string | 是 | 生成模式：`creator`（创作模式）或 `style`（风格模式） |
| `config` | object | 否 | Creator 配置对象 |
| `prompt` | string | 否 | 直接使用的提示词 |
| `model_name` | string | 否 | 指定使用的模型名（如 qwen-image-2.0-pro） |
| `material_ids` | array | 否 | 关联的素材 ID 列表 |
| `reference_images` | array | 否 | 额外的参考图片 URL 列表 |

**注意：** `config` 和 `prompt` 至少需要提供一个。

**响应（202 Accepted）：**

```json
{
  "task_id": "img_abc123def456...",
  "status": "pending",
  "poll_url": "/image-generation/tasks/img_abc123def456...",
  "estimated_eta": 60
}
```

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 401 | not_authenticated | 未认证 |
| 400 | invalid_request | 请求格式错误 |
| 400 | prompt_or_config_required | 需要提供提示词或配置 |
| 400 | invalid_creator_config | Creator 配置无效 |
| 500 | generation_failed | 图片生成失败 |

---

### 4. 获取任务结果

轮询获取图片生成任务结果。

**端点：** `GET /image-generation/tasks/:task_id`

**认证：** 需要

**路径参数：**

- `task_id`: 任务 ID

**响应（200 OK）- 处理中：**

```json
{
  "task_id": "img_abc123def456...",
  "status": "processing",
  "prompt_used": "A beautiful landscape with mountains",
  "model_name": "mock-model-v1",
  "width": 1024,
  "height": 1024,
  "created_at": "2026-03-05T10:00:00Z"
}
```

**响应（200 OK）- 完成：**

```json
{
  "task_id": "img_abc123def456...",
  "status": "success",
  "image_url": "https://r2.example.com/generated-images/img_abc123....png",
  "prompt_used": "A beautiful landscape with mountains",
  "model_name": "mock-model-v1",
  "width": 1024,
  "height": 1024,
  "created_at": "2026-03-05T10:00:00Z",
  "completed_at": "2026-03-05T10:01:30Z"
}
```

**响应（200 OK）- 失败：**

```json
{
  "task_id": "img_abc123def456...",
  "status": "failed",
  "error_message": "图片生成失败",
  "created_at": "2026-03-05T10:00:00Z"
}
```

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 401 | not_authenticated | 未认证 |
| 404 | task_not_found | 任务不存在或无权访问 |
| 500 | server_error | 服务器内部错误 |

---

### 5. 查询图片生成日志列表

查询用户的图片生成历史记录，支持分页和过滤。

**端点：** `GET /image-generation/logs`

**认证：** 需要

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | int | 否 | 1 | 页码（从 1 开始） |
| `page_size` | int | 否 | 20 | 每页数量（1-100） |
| `status` | string | 否 | - | 状态过滤：pending、processing、success、failed |
| `gen_mode` | string | 否 | - | 生成模式过滤：creator、style |
| `model_name` | string | 否 | - | 模型名称模糊匹配 |

**响应（200 OK）：**

```json
{
  "total": 45,
  "list": [
    {
      "id": 123,
      "user_id": 1,
      "gen_mode": "creator",
      "config": "{\"version\":\"1.0\",...}",
      "prompt": "A beautiful landscape",
      "referenced_material_ids": [1, 2, 3],
      "referenced_materials": [
        {
          "id": 1,
          "title": "素材标题",
          "material_type": "news"
        },
        {
          "id": 2,
          "title": "另一个素材",
          "material_type": "image"
        }
      ],
      "reference_image_urls": "[]",
      "status": "success",
      "image_urls": "[\"https://r2.example.com/image.png\"]",
      "model_name": "qwen-image-2.0-pro",
      "model_reference_id": "ref_abc123",
      "created_at": "2026-03-09T10:00:00Z",
      "completed_at": "2026-03-09T10:01:30Z"
    }
  ]
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | int64 | 总记录数 |
| `list` | array | 日志列表 |
| `list[].referenced_material_ids` | array | 引用的素材 ID 数组 |
| `list[].referenced_materials` | array | 引用的素材详情（仅包含 ID、Title、MaterialType） |

**注意：**
- 不返回内部字段 `IsSettle` 和 `Cost`
- `referenced_material_ids` 从逗号分隔字符串解析为数组
- `referenced_materials` 包含关联素材的基础信息
- 时间格式为 RFC3339 (UTC)

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 401 | not_authenticated | 未认证 |
| 400 | invalid_request | 请求参数错误 |
| 500 | img_gen_list_logs_failed | 查询失败 |

**示例 cURL：**

```bash
curl "http://localhost:8080/image-generation/logs?page=1&page_size=20&status=success" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 任务状态

| 状态 | 说明 |
|------|------|
| `pending` | 任务已创建，等待提交到 Provider |
| `processing` | 已提交到 Provider，等待图片生成完成（定时任务轮询中） |
| `success` | 图片生成完成，图片已上传到 S3 |
| `failed` | 图片生成失败 |

---

## 轮询策略

**注意**：当前实现中，任务会停留在 `processing` 状态，直到后台定时任务完成轮询。
定时任务每分钟执行一次，查询 Provider 状态并更新任务结果。

客户端应该使用指数退避策略轮询任务结果：

1. 首次请求：10秒后
2. 后续请求：2秒, 4秒, 8秒, ... 最大间隔 30 秒
3. 超时：建议最长轮询 5 分钟

**示例轮询逻辑：**

```javascript
async function pollTaskResult(taskId) {
  const maxAttempts = 20; // 5 minutes (30s max interval)
  let delay = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/image-generation/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.status === 'success') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(result.error_message);
    }

    await sleep(delay);
    delay = Math.min(delay * 2, 30000);
  }

  throw new Error('Task timeout');
}
```

---

## 示例 cURL 命令

### 提示词转换

```bash
curl -X POST http://localhost:8080/image-generation/convert-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "gen_mode": "creator",
    "config": {
      "version": "1.0",
      "meta": {"width": 1024, "high": 1024, "seed": -1},
      "global_style": {
        "medium": "Oil Painting",
        "style": "Renaissance",
        "color_accent": "Pastel"
      },
      "composition": {
        "camera": {
          "angle": "Low Angle",
          "focal_length": "35mm",
          "depth_of_field": "Shallow"
        },
        "lighting": {
          "type": "Volumetric Lighting",
          "source": "Top-down",
          "intensity": 0.9
        }
      },
      "layers": [
        {
          "id": "subject_1",
          "description": "A beautiful landscape",
          "spatial_layout": {"z_index": 1}
        }
      ]
    }
  }'
```

### 创建生成任务

```bash
curl -X POST http://localhost:8080/image-generation/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gen_mode": "creator",
    "prompt": "A beautiful landscape with mountains at sunset"
  }'
```

### 获取任务结果

```bash
curl http://localhost:8080/image-generation/tasks/img_abc123... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 查询图片生成日志列表

```bash
curl "http://localhost:8080/image-generation/logs?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 带过滤条件
curl "http://localhost:8080/image-generation/logs?page=1&page_size=20&status=success&gen_mode=creator" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. 复制图片到素材

将指定图片生成记录中的图片复制到素材表。

**端点：** `POST /image-generation/logs/:id/copy-to-materials`

**认证：** 需要

**路径参数：**

- `id`: 图片生成记录 ID

**响应（200 OK）：**

```json
{
  "message": "已成功复制到素材",
  "count": 2,
  "material_ids": [101, 102]
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 成功消息 |
| `count` | int | 创建的素材数量 |
| `material_ids` | array | 新创建的素材 ID 列表 |

**错误响应：**

| 状态码 | MessageID | 说明 |
|--------|-----------|------|
| 401 | not_authenticated | 未认证 |
| 400 | invalid_request | 请求参数错误 |
| 404 | img_gen_log_not_found | 记录不存在 |
| 400 | img_gen_not_completed | 图片生成尚未完成 |
| 400 | img_gen_no_images | 没有可复制的图片 |
| 500 | server_error | 服务器内部错误 |

**注意：**
- 只能复制状态为 `success` 的记录
- 会为每个生成的图片创建一个素材记录
- 素材的 `Title` 使用 prompt 的前 50 个字符
- 素材的 `Content` 字段存储图片 URL
- `MaterialType` 固定为 `image`

**示例 cURL：**

```bash
curl -X POST http://localhost:8080/image-generation/logs/123/copy-to-materials \
  -H "Authorization: Bearer YOUR_TOKEN"
```
