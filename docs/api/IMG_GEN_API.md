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

### 1. 提示词转换

将 Creator 配置转换为专业图片生成提示词。

**端点：** `POST /image-generation/convert-prompt`

**认证：** Token

**请求体：**

```json
{
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

### 2. 创建图片生成任务

创建异步图片生成任务。

**端点：** `POST /image-generation/generate`

**认证：** 需要

**请求体：**

```json
{
  "config": { /* Creator 配置（可选）*/ },
  "prompt": "A beautiful landscape with mountains",
  "model_name": "mock-model-v1",
  "material_ids": [1, 2, 3],
  "reference_images": ["https://example.com/ref1.jpg"]
}
```

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

### 3. 获取任务结果

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
    "prompt": "A beautiful landscape with mountains at sunset"
  }'
```

### 获取任务结果

```bash
curl http://localhost:8080/image-generation/tasks/img_abc123... \
  -H "Authorization: Bearer YOUR_TOKEN"
```
