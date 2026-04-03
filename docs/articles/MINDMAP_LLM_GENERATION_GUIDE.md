# MindMap LLM 生成数据指南

## 目标

本文档说明如何让 LLM 根据文章正文生成可落地的思维导图数据，并尽量降低以下问题：

- 输出不是合法 JSON
- 节点层级失控，导致导图过深或过碎
- 生成内容像摘要列表，不像脑图
- 输出直接绑定前端图库结构，后期难维护

当前项目的建议是：

1. LLM 只负责生成“导图内容树”
2. 服务端负责补齐业务字段
3. 前端再通过适配层转换成 `mind-elixir` 数据

不要让 LLM 直接生成前端库的运行时结构，也不要让它决定 `revision`、`created_at` 这类系统字段。

## 推荐的数据责任边界

### 1. LLM 负责输出

- `title`
- `root`
- `root.children[*].text`
- `root.children[*].children`
- 可选的 `meta.note`

### 2. 服务端负责补齐

- `article_id`
- `source.mode`
- `source.text_snapshot`
- `source.generated_at`
- `revision`
- `created_at`
- `updated_at`
- 缺失节点的 `id`
- 根节点分支方向与颜色

## 当前项目中的业务结构

对应类型定义见 [types.ts](/Volumes/GW/codes/frontendProject/JoyfulWords/lib/api/articles/types.ts)。

```ts
interface MindMapNode {
  id: string
  text: string
  children: MindMapNode[]
  collapsed?: boolean
  meta?: {
    color?: string
    note?: string
    side?: "left" | "right"
  }
}

interface MindMapDocument {
  article_id: number
  title: string
  root: MindMapNode
  source: {
    mode: "full_article"
    text_snapshot: string
    generated_at: string
  }
  revision: number
  updated_at: string
  created_at: string
}
```

## 推荐的 LLM 输出协议

为了减少模型出错，建议不要直接让模型输出完整 `MindMapDocument`，而是先输出一个更小的中间结构。

### 推荐中间结构

```json
{
  "title": "文章主题",
  "root": {
    "text": "文章主题",
    "children": [
      {
        "text": "一级分支",
        "note": "这一分支对应原文中的一段核心信息",
        "children": [
          {
            "text": "二级分支",
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 为什么推荐中间结构

- 模型少输出一批系统字段，稳定性更高
- `id` 由系统生成，避免重复或非法
- `source` 由系统填充，避免模型胡写
- 后续切换前端图库或后端协议时，LLM prompt 不必大改

## 生成规则

建议在 prompt 中强约束以下规则。

### 结构规则

1. 根节点只能有一个。
2. 一级分支建议 4 到 8 个。
3. 二级分支建议每个一级分支下 0 到 4 个。
4. 总节点数建议不超过 30 个。
5. 层级最多 3 层。
6. 只保留对理解文章结构有帮助的节点，不要把原文逐句拆开。

### 文案规则

1. 节点文本必须短，建议 4 到 16 个字。
2. 节点文本要是“概念”或“主题”，不要是长句。
3. `note` 用于保存该节点对应的原文解释，可选。
4. 避免出现“第一点/第二点/总结如下”这类低信息密度文本。

### 内容规则

1. 导图应体现文章的主题拆解，而不是简单摘要。
2. 优先抽取：
   - 主论点
   - 关键原因
   - 支撑论据
   - 风险和限制
   - 行动建议
3. 如果文章本身结构很弱，允许模型按“主题 / 问题 / 方案 / 执行”重组。

## 推荐 Prompt

下面这个 prompt 可以直接作为后端生成导图的基础版本。

```text
你是一个擅长结构化信息整理的编辑助手。

任务：
根据我提供的文章正文，输出一个适合思维导图展示的 JSON。

目标：
- 把文章整理成“中心主题 -> 一级分支 -> 二级分支”的结构
- 保留核心信息，不要把文章逐句抄写成节点
- 输出要适合脑图，不要写成长段摘要

输出要求：
- 只输出 JSON
- 不要输出 Markdown 代码块
- 不要输出解释说明
- 字段必须严格符合下面结构

JSON 结构：
{
  "title": "string",
  "root": {
    "text": "string",
    "children": [
      {
        "text": "string",
        "note": "string, optional",
        "children": [
          {
            "text": "string",
            "children": []
          }
        ]
      }
    ]
  }
}

生成规则：
1. 根节点只能有一个。
2. 一级分支控制在 4 到 8 个。
3. 总层级不超过 3 层。
4. 节点文本尽量短，优先用短语，不要用完整长句。
5. 如果某段原文值得保留解释，放到 note 中，不要塞进 text。
6. 不要生成空字符串节点。
7. 不要生成重复语义节点。
8. 如果文章结构不清晰，请按“主题、问题、原因、方案、行动”方式重组。

文章正文如下：
{{article_text}}
```

## 服务端后处理建议

LLM 输出后，不要直接入库，建议做一次标准化。

### 1. JSON 解析

- 先尝试直接解析
- 如果模型返回了代码块，先去掉 ```json 包裹
- 如果解析失败，记录原始响应并返回可观测错误

### 2. 结构校验

至少校验：

- `title` 是非空字符串
- `root.text` 是非空字符串
- `children` 一定是数组
- 最大层级不超过 3
- 节点数不超过系统阈值

### 3. 自动修正

建议自动补齐：

- `id = crypto.randomUUID()`
- `meta.note`
- 一级分支的 `meta.side`
- 一级分支的 `meta.color`
- 空数组 `children: []`

### 4. 系统字段补齐

```ts
const document: MindMapDocument = {
  article_id,
  title: llm.title,
  root: normalizedRoot,
  source: {
    mode: "full_article",
    text_snapshot: articleText,
    generated_at: now,
  },
  revision: 0,
  created_at: now,
  updated_at: now,
}
```

## 推荐的校验与兜底策略

### LLM 输出质量不足时

如果出现以下情况，建议回退到模板导图：

- 一级分支少于 2 个
- 总节点数为 1
- 多数节点文本过长
- 出现明显重复节点
- JSON 结构不合法且无法修复

### 模板兜底示例

```json
{
  "title": "文章主题",
  "root": {
    "text": "文章主题",
    "children": [
      { "text": "核心观点", "children": [] },
      { "text": "关键论据", "children": [] },
      { "text": "问题与风险", "children": [] },
      { "text": "行动建议", "children": [] }
    ]
  }
}
```

## 可观测性建议

按照项目规范，建议至少打这些日志：

### Debug

- LLM 原始输出长度
- JSON 清洗前后差异
- 节点总数、最大层级、一级分支数

### Info

- 生成开始
- 生成成功
- 使用模板兜底

### Warn

- LLM 输出结构不合法但被修复
- 节点数超限被裁剪
- 一级分支过少，触发兜底

### Error

- LLM 调用失败
- JSON 完全不可解析
- 标准化后仍不满足最小结构

## 不推荐的做法

1. 让 LLM 直接输出 `mind-elixir` 的运行时结构。
2. 让 LLM 直接生成 `id`、`revision`、`created_at`。
3. 不限制节点数量和层级，直接信任模型输出。
4. 把长段原文直接塞到 `text`。
5. 生成逻辑和 UI 库强绑定。

## 当前项目的落地建议

如果后面接真实 LLM，推荐把当前 mock 的 `buildMindMapDoc()` 替换成下面的流程：

1. 输入全文 `article_text`
2. 调用 LLM，拿到中间结构
3. 服务端做 JSON 解析与结构校验
4. 服务端补齐节点 `id` 和业务字段
5. 输出 `MindMapDocument`
6. 前端通过 [mind-elixir-adapter.ts](/Volumes/GW/codes/frontendProject/JoyfulWords/lib/mindmap/mind-elixir-adapter.ts) 转成画布数据

## 后续可增强项

1. 增加 Zod schema，对 LLM 输出做严格校验。
2. 支持“文章类型”提示，比如教程、观点文、复盘文，帮助模型生成更稳定的一级分支。
3. 支持二次整理：先生成导图，再让 LLM 对节点做“去重/合并/压缩”。
4. 把 `note` 作为原文摘要字段，在节点 hover 或详情里展示。
