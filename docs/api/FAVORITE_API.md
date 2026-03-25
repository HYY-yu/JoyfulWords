# 素材收藏接口 API 文档

素材收藏功能，支持收藏素材、置顶收藏、取消置顶、分页查询收藏列表和删除收藏。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

---

## 目录

1. [新增收藏](#1-新增收藏)
2. [置顶收藏](#2-置顶收藏)
3. [取消置顶](#3-取消置顶)
4. [收藏列表](#4-收藏列表)
5. [删除收藏](#5-删除收藏)

---

## 1. 新增收藏

将一个属于当前用户的素材加入收藏表。

### 接口信息

- **URL:** `/materials/favorites`
- **方法:** `POST`
- **需要认证:** 是

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| material_id | number | 是 | 素材 ID，且必须属于当前用户 |

### 请求示例

```bash
curl -X POST http://localhost:8080/materials/favorites \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "material_id": 123
  }'
```

### 响应

**成功 (201 Created)**

```json
{
  "id": 10,
  "message": "收藏成功"
}
```

**重复收藏 (200 OK)**

```json
{
  "id": 10,
  "message": "收藏成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求格式错误 |
| 401 | 未认证 |
| 404 | 素材不存在或不属于当前用户 |
| 500 | 收藏失败 |

---

## 2. 置顶收藏

将指定收藏记录标记为置顶。

### 接口信息

- **URL:** `/materials/favorites/:id/pin`
- **方法:** `PUT`
- **需要认证:** 是

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 收藏 ID |

### 请求示例

```bash
curl -X PUT http://localhost:8080/materials/favorites/10/pin \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "收藏置顶成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 收藏 ID 非法 |
| 401 | 未认证 |
| 404 | 收藏不存在或不属于当前用户 |
| 500 | 置顶失败 |

---

## 3. 取消置顶

取消指定收藏记录的置顶状态。

### 接口信息

- **URL:** `/materials/favorites/:id/unpin`
- **方法:** `PUT`
- **需要认证:** 是

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 收藏 ID |

### 请求示例

```bash
curl -X PUT http://localhost:8080/materials/favorites/10/unpin \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "取消置顶成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 收藏 ID 非法 |
| 401 | 未认证 |
| 404 | 收藏不存在或不属于当前用户 |
| 500 | 取消置顶失败 |

---

## 4. 收藏列表

分页获取当前用户的收藏列表。返回顺序为：

- 先返回 `is_pinned=true` 的收藏
- 再按 `pinned_at DESC, created_at DESC` 排序

返回结果会附带素材内容，字段风格与素材列表保持接近。

### 接口信息

- **URL:** `/materials/favorites/list`
- **方法:** `GET`
- **需要认证:** 是

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 100 |

### 请求示例

```bash
curl -X GET "http://localhost:8080/materials/favorites/list?page=1&page_size=20" \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "total": 2,
  "list": [
    {
      "id": 10,
      "user_id": 1,
      "material_id": 123,
      "is_pinned": true,
      "pinned_at": "2026-03-25T08:30:00Z",
      "created_at": "2026-03-25T08:00:00Z",
      "updated_at": "2026-03-25T08:30:00Z",
      "material_user_id": 1,
      "article_id": 88,
      "material_logs_id": 456,
      "title": "AI 技术发展新闻",
      "material_type": "news",
      "source_url": "https://example.com/article1",
      "content": "这是素材内容"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 收藏 ID |
| user_id | number | 收藏所属用户 ID |
| material_id | number | 素材 ID |
| is_pinned | boolean | 是否置顶 |
| pinned_at | string | 置顶时间，未置顶时为空字符串 |
| created_at | string | 收藏创建时间 |
| updated_at | string | 收藏更新时间 |
| material_user_id | number | 素材所属用户 ID |
| article_id | number | 素材归属文章 ID |
| material_logs_id | number | 素材来源搜索日志 ID |
| title | string | 素材标题 |
| material_type | string | 素材类型 |
| source_url | string | 素材原始链接 |
| content | string | 素材内容 |

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 401 | 未认证 |
| 500 | 获取收藏列表失败 |

---

## 5. 删除收藏

根据收藏 ID 硬删除记录。

### 接口信息

- **URL:** `/materials/favorites/:id`
- **方法:** `DELETE`
- **需要认证:** 是

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 收藏 ID |

### 请求示例

```bash
curl -X DELETE http://localhost:8080/materials/favorites/10 \
  -H "Accept-Language: zh-CN" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 响应

**成功 (200 OK)**

```json
{
  "message": "收藏删除成功"
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| 400 | 收藏 ID 非法 |
| 401 | 未认证 |
| 404 | 收藏不存在或不属于当前用户 |
| 500 | 删除收藏失败 |
