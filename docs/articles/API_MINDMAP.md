# 文章思维导图接口 API 文档

文章思维导图系统，支持基于文章内容生成、读取和更新思维导图。

**基础地址:** `http://localhost:8080`

**认证方式:** Bearer Token (JWT) - 所有接口都需要认证

---

## 目录

1. [生成文章思维导图](#1-生成文章思维导图)
2. [获取文章思维导图](#2-获取文章思维导图)
3. [更新文章思维导图](#3-更新文章思维导图)

---

## 1. 生成文章思维导图

- **URL:** `/article/:id/mindmap/generate`
- **方法:** `POST`
- **需要认证:** 是

根据文章内容调用 LLM 生成思维导图，并覆盖保存到本地表中。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

### 请求示例

```bash
curl -X POST http://localhost:8080/article/123/mindmap/generate \
  -H "Authorization: Bearer <access_token>" \
  -H "Accept-Language: zh-CN"
```

### 成功响应

```json
{
  "article_id": 123,
  "title": "AI 文章主题",
  "root": {
    "id": "7bdb86af-b7d8-4567-82ad-47dd7615401a",
    "text": "AI 文章主题",
    "children": [
      {
        "id": "aa149b79-e56c-43c6-9f65-c931be7ffb18",
        "text": "问题",
        "children": [],
        "meta": {
          "color": "#2563EB",
          "note": "这一分支对应原文中的关键问题",
          "side": "left"
        }
      }
    ]
  },
  "source": {
    "mode": "full_article",
    "text_snapshot": "文章纯文本快照",
    "generated_at": "2026-04-06T20:00:00Z"
  },
  "revision": 0,
  "updated_at": "2026-04-06T20:00:00Z",
  "created_at": "2026-04-06T20:00:00Z"
}
```

### 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 文章内容为空 |
| 401 | 未认证 |
| 404 | 文章不存在或无权访问 |
| 500 | LLM 生成失败或落库失败 |

### 行为说明

- 读取 `articles.content` 作为生成源文本
- 服务端会去除 HTML 标签后再发送给 LLM
- 若该文章已存在思维导图，则覆盖原记录
- `revision` 每次成功生成后递增
- 一级分支 `meta.side` 与 `meta.color` 由后端统一补齐

---

## 2. 获取文章思维导图

- **URL:** `/article/:id/mindmap`
- **方法:** `GET`
- **需要认证:** 是

根据文章 ID 获取已保存的唯一思维导图。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

### 请求示例

```bash
curl http://localhost:8080/article/123/mindmap \
  -H "Authorization: Bearer <access_token>" \
  -H "Accept-Language: zh-CN"
```

### 成功响应

当思维导图存在时：

```json
{
  "exists": true,
  "data": {
    "article_id": 123,
    "title": "AI 文章主题",
    "root": {
      "id": "7bdb86af-b7d8-4567-82ad-47dd7615401a",
      "text": "AI 文章主题",
      "children": []
    },
    "source": {
      "mode": "full_article",
      "text_snapshot": "文章纯文本快照",
      "generated_at": "2026-04-06T20:00:00Z"
    },
    "revision": 1,
    "updated_at": "2026-04-06T20:10:00Z",
    "created_at": "2026-04-06T20:00:00Z"
  }
}
```

当文章存在但思维导图不存在时：

```json
{
  "exists": false,
  "message": "文章思维导图不存在"
}
```

### 错误响应

| 状态码 | 说明 |
|--------|------|
| 401 | 未认证 |
| 404 | 文章不存在或无权访问 |
| 500 | 读取失败 |

---

## 3. 更新文章思维导图

- **URL:** `/article/:id/mindmap`
- **方法:** `PUT`
- **需要认证:** 是

只允许前端提交核心可编辑字段：`title` 与 `root`。系统字段由后端维护。

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 文章 ID |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 思维导图标题 |
| root | object | 是 | 根节点及完整子树 |

### 请求示例

```json
{
  "title": "AI 文章主题",
  "root": {
    "id": "7bdb86af-b7d8-4567-82ad-47dd7615401a",
    "text": "AI 文章主题",
    "children": [
      {
        "id": "aa149b79-e56c-43c6-9f65-c931be7ffb18",
        "text": "问题",
        "children": [],
        "meta": {
          "note": "这一分支对应原文中的关键问题"
        }
      }
    ]
  }
}
```

### 更新规则

- 只能更新已有思维导图，不存在时返回 `404`
- 节点层级最大 3 层
- 总节点数最大 30
- 不允许空字符串节点
- 若节点未传 `id`，后端会自动补齐
- 一级分支 `meta.side` 与 `meta.color` 由后端统一覆盖
- `revision` 每次成功更新后递增
- `source`、`created_at`、`updated_at`、`article_id` 由后端维护

### 错误响应

| 状态码 | 说明 |
|--------|------|
| 400 | 思维导图结构非法 |
| 401 | 未认证 |
| 404 | 文章不存在或思维导图不存在 |
| 500 | 更新失败 |

---

## 安全说明

1. 所有接口都需要 JWT token 认证
2. 用户只能访问自己的文章及对应思维导图
3. 服务端会统一校验节点层级、数量与文本合法性
4. 客户端不能直接修改系统字段

---

**文档版本:** 1.0
**最后更新:** 2026-04-06
**作者:** joyful-words development team
**更新日志:**
- v1.0 (2026-04-06): 初始版本，包含思维导图生成、读取、更新接口
