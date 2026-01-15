# Tiptap 编辑器功能设计与最佳实践

**Date**: 2026-01-15
**Status**: 方案已确定 - 实施方案 C（完整重构）
**Version**: 1.1.0
**决策记录**:
- ✅ 选择方案 C（完整重构）
- ✅ 不需要实时流式转换（一次性显示）
- ✅ 状态管理：使用 React hooks + ref（不引入 Zustand）
- ✅ Mock 数据先转为 HTML，标记 TODO

---

## 目录

1. [设计目标](#设计目标)
2. [数据格式策略](#数据格式策略)
3. [Tiptap 最佳实践](#tiptap-最佳实践)
4. [当前实现分析](#当前实现分析)
5. [问题诊断](#问题诊断)
6. [修改方案](#修改方案)
7. [实施计划](#实施计划)

---

## 设计目标

### 核心需求

我们的编辑器需要支持以下使用场景：

#### 1. AI 生成内容流程
- **输入格式**: Markdown（由 AI 生成）
- **存储格式**: HTML
- **转换时机**: 编辑器初始化时
- **导出能力**: Markdown 和 HTML

```
AI (Markdown) → 转换器 → 编辑器 (HTML) → 存储 (HTML)
                 ↑                            ↓
                 └─────── 导出 (Markdown) ──────┘
```

#### 2. 用户创建内容流程
- **输入方式**: 直接在编辑器中输入
- **存储格式**: HTML
- **导出能力**: Markdown 和 HTML

```
用户输入 → 编辑器 (HTML) → 存储 (HTML)
              ↓
         导出 (Markdown/HTML)
```

#### 3. 编辑现有文章流程
- **数据源**: 后端 API（可能是 Markdown 或 HTML）
- **编辑器格式**: HTML
- **更新方式**: 实时保存到后端

### 状态管理要求

编辑器需要处理复杂的状态：

#### CreateMode（新建模式）
- 编辑器接受用户输入
- localStorage 缓存防止数据丢失
- 缓存按用户 ID 区分
- 支持页面刷新后恢复

#### EditMode（编辑模式）
- 从文章表加载现有内容
- 内容可能是 Markdown 或 HTML
- 支持数据实时更新
- 切换文章时正确重置状态

### 功能需求清单

| 功能 | 优先级 | 状态 | 备注 |
|------|--------|------|------|
| Markdown → HTML 转换 | P0 | ❌ 待实现 | AI 生成内容需要 |
| HTML → Markdown 导出 | P0 | ❌ 待实现 | 用户导出需求 |
| 内容初始化正确显示 | P0 | ❌ 有问题 | 当前 EditMode 不显示内容 |
| CreateMode 状态管理 | P0 | ✅ 已实现 | localStorage 缓存正常 |
| EditMode 状态管理 | P0 | ⚠️ 部分实现 | 数据加载有问题 |
| 图片上传和插入 | P1 | ✅ 已实现 | 支持多种插入方式 |
| 工具栏完整功能 | P1 | ✅ 已实现 | 所有格式化按钮正常 |

---

## 数据格式策略

### 存储格式决策

#### 为什么选择 HTML 作为主要存储格式？

根据 [Tiptap 官方文档](https://tiptap.dev/docs/editor/markdown) 和社区最佳实践，我们选择 **HTML** 作为主要存储格式的原因：

**优势：**
1. **富文本保留**: HTML 完美保留格式、样式、链接、图片等
2. **性能**: HTML 解析比 Markdown 快，特别是大型文档
3. **客户端直接渲染**: HTML 可以直接传递给前端显示
4. **Tiptap 原生支持**: `editor.getHTML()` 和 `editor.setHTML()` 是核心 API

**劣势对比：**
- **JSON 格式**: 结构清晰但占用空间大，需要解析后才能显示
- **Markdown 格式**: 不适合复杂富文本（表格、图片、内联样式等）

### 数据流设计

#### 格式转换矩阵

| 来源 | 格式 | 转换方式 | 目标格式 |
|------|------|----------|----------|
| AI 生成 | Markdown | Tiptap Markdown Extension | HTML |
| 后端 API | Markdown | Tiptap Markdown Extension | HTML |
| 后端 API | HTML | 无需转换 | HTML |
| 用户输入 | N/A | Tiptap 自动生成 | HTML |
| 导出功能 | HTML | Tiptap storage.serializer | Markdown |

#### 存储结构

```typescript
// 后端 Article 对象
interface Article {
  id: string
  title: string
  content: string           // HTML 格式
  contentMarkdown?: string  // 可选：原始 Markdown（用于重新编辑）
  // ... 其他字段
}

// localStorage 草稿
interface ArticleDraft {
  article: Article | null
  isEditMode: boolean
  lastSaved: string
  content: {
    html: string           // 主要：HTML 格式
    markdown: string       // 可选：Markdown 格式
    text: string           // 纯文本（用于字数统计）
  }
  metadata: {
    wordCount: number
    hasUnsavedChanges: boolean
    version: string
  }
}
```

---

## Tiptap 最佳实践

### 1. 内容初始化

#### ✅ 推荐做法：使用 `content` 属性

```typescript
const editor = useEditor({
  content: initialHTML,  // 直接传递 HTML
  extensions: [...],
  editable: true
})
```

#### ✅ 推荐做法：使用 `setContent` 命令

```typescript
useEffect(() => {
  if (editor && newContent !== undefined) {
    editor.commands.setContent(newHTML, false)  // false = 不触发更新事件
  }
}, [newContent, editor])
```

#### ❌ 避免做法：直接比较 HTML 字符串

```typescript
// 不好：HTML 格式可能有微小差异
if (storedHTML !== editor.getHTML()) {
  editor.commands.setContent(storedHTML)
}

// 更好：使用内容哈希或版本号
if (contentVersion !== lastVersion) {
  editor.commands.setContent(newContent)
}
```

### 2. Markdown 扩展使用

#### 启用 Markdown 扩展

根据 [Tiptap Markdown 官方文档](https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage)：

```typescript
import Markdown from '@tiptap/markdown'

const editor = useEditor({
  extensions: [
    StarterKit,
    Markdown.configure({
      html: false,        // 不允许 HTML 在 Markdown 中
      transformPastedText: true  // 自动转换粘贴的文本
    })
  ]
})
```

#### Markdown → HTML 转换

```typescript
// 方式 1: 初始化时传入 Markdown
const editor = useEditor({
  content: markdownText,
  extensions: [
    Markdown
  ]
})

// 方式 2: 动态设置 Markdown 内容
useEffect(() => {
  if (editor && markdownContent) {
    // 使用 storage 的 API
    const { schema } = editor
    const parser = Markdown.getParser(schema)
    const doc = parser.parse(markdownContent)
    editor.view.dispatch(
      editor.state.tr.replaceWith(0, editor.state.doc.content.size, doc)
    )
  }
}, [markdownContent, editor])
```

#### HTML → Markdown 导出

```typescript
// 获取 Markdown 格式
const markdown = editor.storage.markdown.getHTML()

// 或使用 Tiptap 的 API
const markdown = editor.getMarkdown()  // 如果扩展提供
```

### 3. React 集成模式

根据 [StackOverflow 讨论](https://stackoverflow.com/questions/74505924/how-to-load-content-using-setcontent-in-tiptap-with-react)：

```typescript
export function MyEditor({ content, onUpdate }: Props) {
  const editor = useEditor({
    content,
    extensions: [...],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate?.(html)
    }
  })

  // 外部内容更新时同步到编辑器
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML()

      // 避免循环更新：使用深度比较或版本控制
      if (!isHTMLSimilar(content, currentHTML)) {
        editor.commands.setContent(content, false)
      }
    }
  }, [content, editor])

  return <EditorContent editor={editor} />
}
```

### 4. 性能优化

#### 防抖保存

```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedSave = useDebouncedCallback((html: string) => {
  saveToBackend(html)
}, 1000)  // 1 秒防抖

useEffect(() => {
  if (editor) {
    editor.on('update', () => {
      const html = editor.getHTML()
      debouncedSave(html)
    })
  }
}, [editor, debouncedSave])
```

#### 大型文档处理

```typescript
const editor = useEditor({
  // 减少初始渲染负担
  immediatelyRender: false,  // 不在初始化时立即渲染

  // 配置最大历史记录
  editorProps: {
    attributes: {
      class: 'prose max-w-none'
    }
  }
})
```

### 5. 状态管理模式

#### 受控组件模式

```typescript
export function ControlledEditor({ value, onChange }: Props) {
  const [isInternalUpdate, setIsInternalUpdate] = useState(false)

  const editor = useEditor({
    content: value,
    onUpdate: ({ editor }) => {
      if (!isInternalUpdate) {
        onChange(editor.getHTML())
      }
    }
  })

  // 外部 prop 变化时更新编辑器
  useEffect(() => {
    if (editor && value !== undefined) {
      setIsInternalUpdate(true)
      editor.commands.setContent(value)
      setTimeout(() => setIsInternalUpdate(false), 0)
    }
  }, [value, editor])

  return <EditorContent editor={editor} />
}
```

---

## 当前实现分析

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    ContentWriting                            │
│  (管理 Tab 切换、currentArticleId、editTrigger)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ArticleWriting                             │
│  (管理 articleContent、articleHTML、articleMarkdown)         │
│  - localStorage 草稿持久化                                   │
│  - CreateMode/EditMode 切换                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    TiptapEditor                              │
│  (Tiptap useEditor hook)                                     │
│  - StarterKit, Underline, Link, CustomImage                 │
│  - Markdown 扩展（已禁用）                                   │
└─────────────────────────────────────────────────────────────┘
```

### 关键文件分析

#### 1. `tiptap-editor.tsx`

**配置：**
```typescript
// 第 29-84 行
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link,
    CustomImage,
    // ❌ Markdown 扩展被禁用
    // Markdown.configure({
    //   html: true,
    //   transformPastedText: true,
    // }),
  ],
  content,              // 初始内容
  editable,
  immediatelyRender: true,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    const text = editor.getText()
    onChange?.(text, html, '')  // markdown 参数为空
  }
})
```

**内容同步：**
```typescript
// 第 90-103 行
useEffect(() => {
  if (editor && content !== undefined) {
    const currentHTML = editor.getHTML()
    // ⚠️ 问题：字符串比较可能不准确
    if (content !== currentHTML && !isExternalUpdate.current) {
      isExternalUpdate.current = true
      editor.commands.setContent(content)
      setTimeout(() => {
        isExternalUpdate.current = false
      }, 100)
    }
  }
}, [content, editor])
```

#### 2. `article-writing.tsx`

**状态定义：**
```typescript
// 第 44-50 行
const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
const [isEditMode, setIsEditMode] = useState(false)
const [articleContent, setArticleContent] = useState("")  // ❌ 存储格式不明确
const [articleHTML, setArticleHTML] = useState("")
const [articleMarkdown, setArticleMarkdown] = useState("")
```

**内容加载逻辑：**
```typescript
// 第 112-127 行
useEffect(() => {
  const editArticle = (window as any).__editArticle

  if (editArticle) {
    console.log("Loading edit article from window:", editArticle)
    setCurrentArticle(editArticle)
    setIsEditMode(true)
    setArticleContent(editArticle.content)  // ⚠️ 直接使用 article.content
    setArticleHTML(editArticle.content)
    setArticleMarkdown("")

    ;(window as any).__editArticle = null
    return
  }
  // ... localStorage 加载逻辑
}, [getDraftKey, toast, t, articleId])
```

**onChange 处理：**
```typescript
// 第 179-193 行
const handleEditorChange = (_content: string, html: string, markdown: string) => {
  setArticleContent(html)  // 保存 HTML
  setArticleHTML(html)
  setArticleMarkdown(markdown)  // ⚠️ 当前为空字符串
}
```

#### 3. `article-types.ts`

**Mock 数据格式：**
```typescript
// 第 40-267 行
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "AI技术在内容创作中的应用与发展趋势",
    // ❌ 问题：这是纯文本，不是 HTML
    content: "人工智能技术正在深刻改变内容创作的方式和效率。从自动化写作到智能编辑...",
    // ...
  }
]
```

---

## 问题诊断

### 问题 1: EditMode 编辑器不显示内容

**现象：**
- 从 Article Manager 点击 Edit 按钮
- 进入 Article Writing 页面
- 编辑器显示空白或只有 `<p></p>`

**根本原因分析：**

#### 原因 1.1: 数据格式不匹配

```
Mock Data: "纯文本内容..." (无 HTML 标签)
              ↓
localStorage: { html: "纯文本内容..." } (错误地标记为 html)
              ↓
Tiptap Editor: content="纯文本内容..."
              ↓
内部处理: Tiptap 自动转换为 <p>纯文本内容...</p>
              ↓
比较逻辑: "纯文本..." !== "<p>纯文本...</p>"  → 不更新
```

**证据：**
1. `article-types.ts` 第 44 行：`content` 是纯文本
2. `article-manager.tsx` 第 91 行：直接将纯文本存储为 `html`
3. `tiptap-editor.tsx` 第 92 行：比较 `content` 和 `currentHTML` 失败

#### 原因 1.2: 组件生命周期问题

```
1. ArticleWriting 组件挂载
   ↓
2. TiptapEditor 初始化 (content="")
   ↓
3. ArticleWriting useEffect 执行
   ↓
4. setArticleContent(editArticle.content)
   ↓
5. TiptapEditor useEffect 触发
   ↓
6. 但 editor 已经初始化，isExternalUpdate 可能阻止更新
```

**证据：**
1. `tiptap-editor.tsx` 第 94 行：`!isExternalUpdate.current` 检查
2. React 状态更新是异步的，可能导致时序问题

#### 原因 1.3: Markdown 扩展未启用

**问题：**
- AI 生成的是 Markdown 格式
- 编辑器没有 Markdown 扩展来解析
- 内容显示为原始 Markdown 文本或空白

**证据：**
1. `tiptap-editor.tsx` 第 62-66 行：Markdown 扩展被注释
2. `package.json` 有 `@tiptap/markdown` 但未使用

### 问题 2: 导出功能缺失 Markdown 转换

**当前实现：**
```typescript
// article-writing.tsx 第 196 行
const handleExport = (format: "markdown" | "html") => {
  if (format === "markdown") {
    // ⚠️ 问题：articleMarkdown 为空
    const blob = new Blob([articleMarkdown || articleContent], { type: "text/markdown" })
    // ...
  }
}
```

**问题：**
- `articleMarkdown` 始终为空字符串
- 没有从 HTML 转换回 Markdown 的机制

### 问题 3: 状态管理混乱

**重复状态：**
```typescript
const [articleContent, setArticleContent] = useState("")  // HTML?
const [articleHTML, setArticleHTML] = useState("")        // 重复?
const [articleMarkdown, setArticleMarkdown] = useState("")  // 未使用
```

**问题：**
- 三个状态变量存储相同数据的不同格式
- 更新逻辑分散，容易不同步
- 没有明确的数据源（source of truth）

---

## 修改方案

### 方案概述

基于以上分析，我们提出**三个方案**，从简单到完整：

| 方案 | 复杂度 | 效果 | 推荐度 |
|------|--------|------|--------|
| **方案 A**: 快速修复 | 低 | 解决当前显示问题 | ⭐⭐⭐ |
| **方案 B**: 启用 Markdown | 中 | 支持 AI Markdown 输入 | ⭐⭐⭐⭐ |
| **方案 C**: 重构状态管理 | 高 | 完整的架构优化 | ⭐⭐⭐⭐⭐ |

---

### 方案 A: 快速修复 EditMode 显示问题

**目标：** 立即解决编辑器不显示内容的问题

#### A1. 修复 Mock 数据格式

**文件：** `components/article/article-types.ts`

```typescript
// 修改前（第 44 行）
content: "人工智能技术正在深刻改变..."

// 修改后
content: "<p>人工智能技术正在深刻改变内容创作的方式和效率。从自动化写作到智能编辑，AI工具为创作者提供了强大的支持。</p><p>本文将深入探讨AI在内容创作领域的应用现状...</p>"
```

**或者：** 添加一个数据转换函数

```typescript
// 在 article-types.ts 添加
function convertTextToHTML(text: string): string {
  return text.split('\n\n').map(para => `<p>${para}</p>`).join('')
}

// 使用时
content: convertTextToHTML("人工智能技术正在...")
```

#### A2. 修复 Tiptap 内容更新逻辑

**文件：** `components/tiptap-editor.tsx`

```typescript
// 修改第 90-103 行的 useEffect
useEffect(() => {
  if (editor && content !== undefined) {
    const currentHTML = editor.getHTML()

    // ✅ 改进：使用标准化比较
    const normalizeHTML = (html: string) => html.trim()
    const normalizedContent = normalizeHTML(content)
    const normalizedCurrent = normalizeHTML(currentHTML)

    // 只有内容真正不同时才更新
    if (normalizedContent !== normalizedCurrent && !isExternalUpdate.current) {
      isExternalUpdate.current = true
      editor.commands.setContent(content, false)  // false = 不触发 onUpdate

      // 使用 requestAnimationFrame 代替 setTimeout
      requestAnimationFrame(() => {
        isExternalUpdate.current = false
      })
    }
  }
}, [content, editor])
```

#### A3. 添加内容验证日志

**文件：** `components/article/article-writing.tsx`

```typescript
// 在 useEffect 中添加调试日志
useEffect(() => {
  const editArticle = (window as any).__editArticle

  if (editArticle) {
    console.log('[ArticleWriting] Loading edit article:', {
      id: editArticle.id,
      title: editArticle.title,
      contentType: typeof editArticle.content,
      contentLength: editArticle.content?.length,
      contentPreview: editArticle.content?.substring(0, 100),
      isHTML: editArticle.content?.startsWith('<')
    })

    setCurrentArticle(editArticle)
    setIsEditMode(true)
    setArticleContent(editArticle.content)
    setArticleHTML(editArticle.content)
    setArticleMarkdown("")

    ;(window as any).__editArticle = null
    return
  }
}, [getDraftKey, toast, t, articleId])
```

**优点：**
- 改动最小，风险低
- 快速解决当前问题
- 不影响其他功能

**缺点：**
- 没有解决 Markdown 支持问题
- 没有优化状态管理
- Mock 数据仍然需要手动维护

---

### 方案 B: 启用 Markdown 扩展（推荐）

**目标：** 完整支持 Markdown 输入和 HTML 导出

#### B1. 安装和配置 Markdown 扩展

**文件：** `components/tiptap-editor.tsx`

```typescript
// 添加导入
import Markdown from '@tiptap/markdown'

// 修改 useEditor 配置
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      // ... 其他配置
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline cursor-pointer",
      },
    }),
    CustomImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg",
      },
    }),
    // ✅ 启用 Markdown 扩展
    Markdown.configure({
      html: false,           // 不允许在 Markdown 中混合 HTML
      transformPastedText: true,  // 自动转换粘贴的文本
      linkify: true,         // 自动识别链接
    }),
  ],
  content,
  editable,
  immediatelyRender: true,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    const markdown = editor.storage.markdown?.getMarkdown() || ''
    const text = editor.getText()

    // ✅ 返回 markdown
    onChange?.(text, html, markdown)
  },
})
```

#### B2. 添加 Markdown → HTML 转换工具

**文件：** `lib/tiptap-extensions.ts`（新建工具函数）

```typescript
import { Markdown } from '@tiptap/markdown'
import { Editor } from '@tiptap/react'

/**
 * 将 Markdown 转换为 HTML
 * 使用 Tiptap 的 Markdown 扩展
 */
export function markdownToHTML(markdown: string, extensions: any[] = []): string {
  // 创建临时编辑器实例
  const editor = new Editor({
    extensions: [
      ...extensions,
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
    ],
    content: markdown,
  })

  const html = editor.getHTML()
  editor.destroy()

  return html
}

/**
 * 检测内容格式
 */
export function detectContentFormat(content: string): 'markdown' | 'html' | 'text' {
  if (!content) return 'text'

  // 检测 Markdown 标记
  const markdownPatterns = [
    /^#{1,6}\s+/m,        // 标题
    /^\*{3,}$/m,           // 分隔线
    /^\[.+\]\(.+\)/m,     // 链接
    /^>\s+/m,              // 引用
    /^\*{1,2}.+\*{1,2}/m, // 粗体/斜体
    /^[-*+]\s+/m,          // 列表
    /^\d+\.\s+/m,          // 有序列表
  ]

  for (const pattern of markdownPatterns) {
    if (pattern.test(content)) {
      return 'markdown'
    }
  }

  // 检测 HTML 标签
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html'
  }

  return 'text'
}
```

#### B3. 更新 ArticleWriting 组件

**文件：** `components/article/article-writing.tsx`

```typescript
import { markdownToHTML, detectContentFormat } from '@/lib/tiptap-extensions'

// 修改内容加载逻辑
useEffect(() => {
  const editArticle = (window as any).__editArticle

  if (editArticle) {
    console.log('[ArticleWriting] Loading edit article:', editArticle)

    const content = editArticle.content
    const format = detectContentFormat(content)

    let htmlContent = content
    if (format === 'markdown') {
      // ✅ 转换 Markdown 到 HTML
      htmlContent = markdownToHTML(content)
      console.log('[ArticleWriting] Converted Markdown to HTML')
    }

    setCurrentArticle(editArticle)
    setIsEditMode(true)
    setArticleContent(htmlContent)
    setArticleHTML(htmlContent)
    setArticleMarkdown(format === 'markdown' ? content : '')

    ;(window as any).__editArticle = null
    return
  }

  // localStorage 加载逻辑（类似处理）
  // ...
}, [getDraftKey, toast, t, articleId])
```

#### B4. 修复导出功能

**文件：** `components/article/article-writing.tsx`

```typescript
const handleExport = (format: "markdown" | "html") => {
  if (format === "markdown") {
    // ✅ 使用当前存储的 markdown 或从编辑器获取
    const markdownToExport = articleMarkdown || getMarkdownFromEditor()
    const blob = new Blob([markdownToExport], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `article-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  } else if (format === "html") {
    // ... 现有 HTML 导出逻辑
  }
}

// 添加从编辑器获取 Markdown 的辅助函数
const getMarkdownFromEditor = (): string => {
  // 如果编辑器实例可用，使用其 Markdown 序列化
  const editor = (window as any).tiptapEditor
  if (editor && editor.storage.markdown) {
    return editor.storage.markdown.getMarkdown()
  }
  // 否则回退到 HTML
  return articleContent
}
```

**优点：**
- 完整支持 AI Markdown 输入
- 正确的 HTML ↔ Markdown 双向转换
- 自动格式检测
- 导出功能完善

**缺点：**
- 需要额外配置和测试
- Markdown 扩展可能有兼容性问题
- 需要更新 Mock 数据

---

### 方案 C: 重构状态管理（完整方案）✅ 已选定

**目标：** 彻底优化编辑器状态管理架构

**设计原则：**
- 不引入额外的状态管理库（保持轻量）
- 使用 React hooks + ref 实现高效的状态管理
- 单一数据源（Source of Truth）
- 清晰的数据流和更新时机

#### C1. 统一状态管理接口

**新建文件：** `lib/editor-state.ts`

```typescript
import { useRef, useCallback } from 'react'

/**
 * 编辑器状态管理 Hook
 * 使用 ref 避免不必要的重渲染，提供高性能的状态访问
 */
export interface EditorContent {
  html: string              // HTML 格式（主要）
  markdown: string | null   // Markdown 格式（可选，用于重新编辑）
  text: string              // 纯文本（字数统计）
}

export interface EditorMetadata {
  isDirty: boolean          // 是否有未保存的更改
  lastSaved: string | null  // 最后保存时间
  wordCount: number         // 字数统计
}

export interface EditorState {
  content: EditorContent
  metadata: EditorMetadata

  // 操作方法
  setContent: (content: Partial<EditorContent>) => void
  setDirty: (dirty: boolean) => void
  markSaved: () => void
  reset: () => void
  getSnapshot: () => { content: EditorContent; metadata: EditorMetadata }
}

export function useEditorState(initialHTML: string = ''): EditorState {
  // 使用 ref 存储状态，避免频繁重渲染
  const contentRef = useRef<EditorContent>({
    html: initialHTML,
    markdown: null,
    text: ''
  })

  const metadataRef = useRef<EditorMetadata>({
    isDirty: false,
    lastSaved: null,
    wordCount: 0
  })

  // 强制重渲染的 state（仅用于触发 UI 更新）
  const [, setTick] = useState(0)

  const triggerUpdate = useCallback(() => {
    setTick(tick => tick + 1)
  }, [])

  // 设置内容
  const setContent = useCallback((newContent: Partial<EditorContent>) => {
    contentRef.current = {
      ...contentRef.current,
      ...newContent
    }
    metadataRef.current = {
      ...metadataRef.current,
      isDirty: true,
      wordCount: newContent.text?.length || contentRef.current.text.length
    }
    triggerUpdate()
  }, [triggerUpdate])

  // 设置脏状态
  const setDirty = useCallback((dirty: boolean) => {
    metadataRef.current.isDirty = dirty
    triggerUpdate()
  }, [triggerUpdate])

  // 标记已保存
  const markSaved = useCallback(() => {
    metadataRef.current.isDirty = false
    metadataRef.current.lastSaved = new Date().toISOString()
    triggerUpdate()
  }, [triggerUpdate])

  // 重置状态
  const reset = useCallback(() => {
    contentRef.current = {
      html: '',
      markdown: null,
      text: ''
    }
    metadataRef.current = {
      isDirty: false,
      lastSaved: null,
      wordCount: 0
    }
    triggerUpdate()
  }, [triggerUpdate])

  // 获取快照（用于保存到 localStorage）
  const getSnapshot = useCallback(() => ({
    content: { ...contentRef.current },
    metadata: { ...metadataRef.current }
  }), [])

  return {
    content: contentRef.current as any,  // 返回当前值的引用
    metadata: metadataRef.current as any,
    setContent,
    setDirty,
    markSaved,
    reset,
    getSnapshot
  }
}
```

#### C2. 简化组件状态

**文件：** `components/article/article-writing.tsx`

```typescript
// ❌ 删除
// const [articleContent, setArticleContent] = useState("")
// const [articleHTML, setArticleHTML] = useState("")
// const [articleMarkdown, setArticleMarkdown] = useState("")

// ✅ 使用统一状态
const { html, markdown, isDirty, setHTML, markSaved, reset } = useEditorState()

// 修改 onChange 处理
const handleEditorChange = (_text: string, html: string, markdown: string) => {
  setHTML(html, markdown)
}

// 修改导出逻辑
const handleExport = (format: "markdown" | "html") => {
  const content = format === "markdown" ? (markdown || html) : html
  // ... 导出逻辑
}
```

#### C3. 优化 Tiptap 组件

**文件：** `components/tiptap-editor.tsx`

```typescript
interface TiptapEditorProps {
  content?: string
  markdown?: string  // ✅ 新增：支持 Markdown 输入
  onChange?: (text: string, html: string, markdown: string) => void
  placeholder?: string
  editable?: boolean
}

export function TiptapEditor({
  content = "",
  markdown = "",
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
}: TiptapEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // ✅ 确定初始内容格式
  const initialContent = markdown || content
  const isInitialMarkdown = !!markdown

  const editor = useEditor({
    extensions: [
      // ... 现有扩展
      Markdown.configure({
        html: false,
        transformPastedText: true,
        linkify: true,
      }),
    ],
    content: initialContent,  // 优先使用 Markdown
    editable,
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const md = editor.storage.markdown?.getMarkdown() || ''
      const text = editor.getText()

      onChange?.(text, html, md)
    },
  })

  // ✅ 简化的内容同步逻辑
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  // ✅ 支持动态 Markdown 更新
  useEffect(() => {
    if (editor && markdown && markdown !== editor.storage.markdown?.getMarkdown()) {
      const { schema } = editor
      const parser = Markdown.getParser(schema)
      const doc = parser.parse(markdown)
      editor.view.dispatch(
        editor.state.tr.replaceWith(0, editor.state.doc.content.size, doc)
      )
    }
  }, [markdown, editor])

  // ... 其余代码
}
```

**优点：**
- ✅ 不引入外部依赖，保持轻量
- ✅ 使用 ref 避免 unnecessary 重渲染
- ✅ 清晰的状态管理
- ✅ 易于测试和维护
- ✅ 更好的性能
- ✅ 完整的功能支持

**缺点：**
- ⚠️ 改动较大
- ⚠️ 需要全面测试
- ✅ 不需要额外的依赖

---

## 实施计划（基于方案 C）

**总工期：** 5-7 天
**优先级：** P0（立即开始）

### 阶段 1: 基础设施准备（第 1 天）

#### 任务 1.1: 修复 Mock 数据格式
**文件：** `components/article/article-types.ts`

```typescript
// TODO: 后端 API 实现后废弃此 Mock 数据
// 参考：https://github.com/your-org/backend-api/issues/xxx

// 添加辅助函数
function convertTextToHTML(text: string): string {
  return text
    .split('\n\n')
    .map(para => `<p>${para}</p>`)
    .join('')
}

// 更新所有 mockArticles 的 content 字段
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "AI技术在内容创作中的应用与发展趋势",
    // 修改前：纯文本
    // content: "人工智能技术正在..."

    // 修改后：HTML 格式
    content: `<p>人工智能技术正在深刻改变内容创作的方式和效率。从自动化写作到智能编辑，AI工具为创作者提供了强大的支持。</p>
    <p>本文将深入探讨AI在内容创作领域的应用现状，分析主流AI创作工具的特点，并展望未来发展趋势。我们将重点关注自然语言处理、图像生成、视频制作等领域的AI应用，以及这些技术如何帮助创作者提高工作效率、改善内容质量。</p>
    <p>同时，我们也会讨论AI创作带来的挑战和伦理问题，为内容创作者提供全面的参考。</p>`,
    // ...
  },
  // ... 其他文章
]
```

**验证：**
- [ ] 所有 Mock 数据的 content 字段都是 HTML 格式
- [ ] HTML 格式正确（段落用 `<p>` 包裹）
- [ ] 添加 TODO 注释标记后端 API 集成

---

#### 任务 1.2: 创建格式转换工具
**新建文件：** `lib/tiptap-utils.ts`

```typescript
import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Markdown from '@tiptap/markdown'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

/**
 * 检测内容格式
 */
export function detectContentFormat(content: string): 'markdown' | 'html' | 'text' {
  if (!content) return 'text'

  // 检测 Markdown 标记
  const markdownPatterns = [
    /^#{1,6}\s+/m,        // 标题 #, ##, ###
    /^\*{3,}$/m,           // 分隔线 ***
    /^\[.+\]\(.+\)/m,     // 链接 [text](url)
    /^>\s+/m,              // 引用 >
    /^\*{1,2}.+\*{1,2}/m, // 粗体/斜体 *text* or **text**
    /^[-*+]\s+/m,          // 无序列表 - * +
    /^\d+\.\s+/m,          // 有序列表 1. 2. 3.
  ]

  for (const pattern of markdownPatterns) {
    if (pattern.test(content)) {
      return 'markdown'
    }
  }

  // 检测 HTML 标签
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html'
  }

  return 'text'
}

/**
 * Markdown 转 HTML
 * 使用 Tiptap 的 Markdown 扩展进行转换
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown) return ''

  // 创建临时编辑器实例用于转换
  const editor = new Editor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        linkify: true,
      }),
    ],
    content: markdown,
  })

  const html = editor.getHTML()
  editor.destroy()

  return html
}

/**
 * HTML 转 Markdown
 * 注意：需要启用 Markdown 扩展的 storage 功能
 */
export function htmlToMarkdown(html: string): string {
  // TODO: 等待 Tiptap Markdown 扩展配置完成后实现
  // 目前先返回 HTML，后续优化
  console.warn('[htmlToMarkdown] Markdown serialization not implemented yet')
  return html
}

/**
 * 纯文本转 HTML
 */
export function textToHTML(text: string): string {
  if (!text) return ''
  return text
    .split('\n\n')
    .map(para => `<p>${para}</p>`)
    .join('')
}

/**
 * 根据格式自动转换内容为 HTML
 */
export function normalizeContentToHTML(
  content: string,
  sourceFormat?: 'markdown' | 'html' | 'text'
): string {
  if (!content) return ''

  const format = sourceFormat || detectContentFormat(content)

  switch (format) {
    case 'markdown':
      return markdownToHTML(content)
    case 'html':
      return content
    case 'text':
      return textToHTML(content)
    default:
      return content
  }
}
```

**验证：**
- [ ] `detectContentFormat` 能正确识别三种格式
- [ ] `markdownToHTML` 转换结果正确
- [ ] `normalizeContentToHTML` 自动转换逻辑正确

---

### 阶段 2: Markdown 扩展集成（第 2-3 天）

#### 任务 2.1: 启用 Tiptap Markdown 扩展
**文件：** `components/tiptap-editor.tsx`

```typescript
// 添加导入
import Markdown from '@tiptap/markdown'

// 修改 useEditor 配置
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      bold: true,
      italic: true,
      strike: true,
      code: true,
      codeBlock: true,
      blockquote: true,
      bulletList: true,
      orderedList: true,
      listItem: true,
      hardBreak: true,
      horizontalRule: true,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline cursor-pointer",
      },
    }),
    CustomImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg",
      },
    }),
    // ✅ 启用 Markdown 扩展
    Markdown.configure({
      html: false,              // 不允许在 Markdown 中混合 HTML
      transformPastedText: true, // 自动转换粘贴的文本
      linkify: true,            // 自动识别链接
    }),
  ],
  content,
  editable,
  immediatelyRender: true,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    const text = editor.getText()

    // ✅ 尝试获取 Markdown（如果扩展支持）
    let markdown = ''
    try {
      markdown = editor.storage.markdown?.getMarkdown?.() || ''
    } catch (error) {
      // Markdown 序列化失败，使用空字符串
      console.warn('[TiptapEditor] Markdown serialization failed:', error)
    }

    onChange?.(text, html, markdown)
  },
})
```

**验证：**
- [ ] 编辑器能正确初始化
- [ ] Markdown 内容能正确显示
- [ ] 编辑器操作正常（加粗、斜体、列表等）
- [ ] onUpdate 回调正确返回 markdown

---

#### 任务 2.2: 优化内容更新逻辑
**文件：** `components/tiptap-editor.tsx`

```typescript
// 添加格式检测导入
import { detectContentFormat, normalizeContentToHTML } from '@/lib/tiptap-utils'

interface TiptapEditorProps {
  content?: string           // HTML 内容（主要）
  markdown?: string          // Markdown 内容（可选）
  sourceFormat?: 'markdown' | 'html' | 'text'  // 明确指定格式
  onChange?: (text: string, html: string, markdown: string) => void
  placeholder?: string
  editable?: boolean
}

export function TiptapEditor({
  content = "",
  markdown = "",
  sourceFormat,
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
}: TiptapEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // ✅ 确定初始内容
  const getInitialContent = useCallback(() => {
    if (markdown) {
      return markdown  // 优先使用 Markdown
    }
    if (sourceFormat === 'markdown') {
      return markdownToHTML(content)
    }
    return content
  }, [markdown, content, sourceFormat])

  const editor = useEditor({
    extensions: [/* ... */],
    content: getInitialContent(),
    editable,
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const md = editor.storage.markdown?.getMarkdown?.() || ''
      onChange?.(text, html, md)
    },
  })

  // ✅ 改进的内容同步逻辑
  useEffect(() => {
    if (!editor) return

    const currentHTML = editor.getHTML()

    // 标准化 HTML（去除空格、换行等差异）
    const normalizeHTML = (html: string) => html.trim().replace(/\s+/g, ' ')

    const targetHTML = markdown
      ? markdownToHTML(markdown)
      : normalizeContentToHTML(content, sourceFormat)

    const normalizedTarget = normalizeHTML(targetHTML)
    const normalizedCurrent = normalizeHTML(currentHTML)

    // 只有内容真正不同时才更新
    if (normalizedTarget !== normalizedCurrent && !isExternalUpdate.current) {
      isExternalUpdate.current = true
      editor.commands.setContent(targetHTML, false)  // false = 不触发 onUpdate

      // 使用 requestAnimationFrame 确保更新完成
      requestAnimationFrame(() => {
        isExternalUpdate.current = false
      })
    }
  }, [content, markdown, sourceFormat, editor])

  // ... 其余代码
}
```

**验证：**
- [ ] Markdown 内容能正确加载
- [ ] HTML 内容能正确加载
- [ ] 内容切换时没有闪烁或丢失
- [ ] 没有循环更新的问题

---

### 阶段 3: 状态管理重构（第 3-4 天）

#### 任务 3.1: 实现统一状态管理 Hook
**新建文件：** `lib/editor-state.ts`（使用方案 C1 的代码）

**验证：**
- [ ] Hook 正确导出所有方法
- [ ] ref 状态正确更新
- [ ] getSnapshot 返回正确的快照

---

#### 任务 3.2: 简化 ArticleWriting 组件
**文件：** `components/article/article-writing.tsx`

```typescript
import { useEditorState } from '@/lib/editor-state'
import { normalizeContentToHTML, detectContentFormat } from '@/lib/tiptap-utils'

export function ArticleWriting({ articleId }: ArticleWritingProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()

  // ❌ 删除重复状态
  // const [articleContent, setArticleContent] = useState("")
  // const [articleHTML, setArticleHTML] = useState("")
  // const [articleMarkdown, setArticleMarkdown] = useState("")

  // ✅ 使用统一状态管理
  const editorState = useEditorState()
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [cleanConfirmOpen, setCleanConfirmOpen] = useState(false)

  // Debug: Log when component mounts with new articleId
  useEffect(() => {
    console.log('[ArticleWriting] Mounted with articleId:', articleId)
  }, [articleId])

  // 加载文章内容
  useEffect(() => {
    // 1. 优先检查 Edit 跳转
    const editArticle = (window as any).__editArticle

    if (editArticle) {
      console.log('[ArticleWriting] Loading edit article from window:', editArticle)

      const format = detectContentFormat(editArticle.content)
      const htmlContent = normalizeContentToHTML(editArticle.content, format)

      // ✅ 使用统一状态管理
      editorState.setContent({
        html: htmlContent,
        markdown: format === 'markdown' ? editArticle.content : null,
        text: editArticle.content.replace(/<[^>]*>/g, "")
      })

      setCurrentArticle(editArticle)
      setIsEditMode(true)

      // 清理 window state
      ;(window as any).__editArticle = null
      return
    }

    // 2. 从 localStorage 加载草稿
    const savedDraft = localStorage.getItem(getDraftKey())
    if (savedDraft) {
      try {
        const draft: ArticleDraft = JSON.parse(savedDraft)

        // 版本检查
        if (draft.metadata?.version !== 'v1.0.0') {
          console.warn('Draft version mismatch:', draft.metadata?.version)
          return
        }

        // 编辑模式：检查 draft 中的文章 ID 是否匹配
        if (articleId) {
          if (draft.article && draft.article.id === articleId) {
            console.log('[ArticleWriting] Loading edit article from localStorage:', draft.article)
            editorState.setContent({
              html: draft.content.html,
              markdown: draft.content.markdown || null,
              text: draft.content.text
            })
            setCurrentArticle(draft.article)
            setIsEditMode(true)
          } else {
            console.log('[ArticleWriting] Draft article ID mismatch, clearing state')
            editorState.reset()
            setCurrentArticle(null)
            setIsEditMode(false)
          }
        } else {
          // 新文章模式：恢复草稿
          editorState.setContent({
            html: draft.content.html,
            markdown: draft.content.markdown || null,
            text: draft.content.text
          })
          setCurrentArticle(draft.article)
          setIsEditMode(draft.isEditMode)

          toast({
            description: t("contentWriting.editorHeader.draftRestored")
          })
        }
      } catch (error) {
        console.error('[ArticleWriting] Failed to load draft:', error)
      }
    }
  }, [getDraftKey, toast, t, articleId, editorState])

  // 编辑器 onChange 处理
  const handleEditorChange = useCallback((_content: string, html: string, markdown: string) => {
    // ✅ 使用统一状态管理
    editorState.setContent({
      html,
      markdown: markdown || null,
      text: _content
    })

    // TODO: 实时保存到后端 API（EditMode）
    // API: PUT /api/articles/:id/draft
  }, [editorState])

  // 导出功能
  const handleExport = useCallback((format: "markdown" | "html") => {
    const { content } = editorState
    const exportContent = format === "markdown"
      ? (content.markdown || content.html)  // 优先使用 Markdown，回退到 HTML
      : content.html

    const blob = new Blob([exportContent], {
      type: format === "markdown" ? "text/markdown" : "text/html"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `article-${Date.now()}.${format === "markdown" ? "md" : "html"}`
    a.click()
    URL.revokeObjectURL(url)
  }, [editorState])

  // 清空确认
  const handleCleanConfirm = useCallback(() => {
    editorState.reset()
    localStorage.removeItem(getDraftKey())

    setCleanConfirmOpen(false)

    toast({
      description: t("contentWriting.editorHeader.cleanSuccess")
    })
  }, [editorState, getDraftKey, toast, t])

  // 自动保存到 localStorage
  useEffect(() => {
    if (!editorState.content.html) return

    const draft = buildDraft()
    debouncedSave(draft)

    return () => {
      debouncedSave.cancel?.()
    }
  }, [editorState.content.html, editorState.content.markdown, buildDraft, debouncedSave])

  // 构建 draft 对象
  const buildDraft = useCallback((): ArticleDraft => {
    const { content, metadata } = editorState

    return {
      article: currentArticle,
      isEditMode,
      lastSaved: new Date().toISOString(),
      content: {
        html: content.html,
        markdown: content.markdown || '',
        text: content.text
      },
      metadata: {
        wordCount: metadata.wordCount,
        hasUnsavedChanges: metadata.isDirty,
        version: "v1.0.0"
      }
    }
  }, [editorState, currentArticle, isEditMode])

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Editor Section */}
      <div className="flex flex-col flex-1 bg-card rounded-lg border border-border overflow-hidden">
        {/* Editor Header */}
        <div className="shrink-0">
          <ArticleEditorHeader
            article={currentArticle}
            mode={isEditMode ? "edit" : "create"}
            content={editorState.content.html}
            onSaveAsNew={() => setSaveDialogOpen(true)}
            onExport={handleExport}
            onClean={() => setCleanConfirmOpen(true)}
          />
        </div>

        {/* Tiptap Editor */}
        <div className="flex-1 overflow-auto p-6">
          <TiptapEditor
            content={editorState.content.html}
            markdown={editorState.content.markdown || undefined}
            onChange={handleEditorChange}
            placeholder={t("contentWriting.writing.editorPlaceholder")}
            editable={true}
          />
        </div>
      </div>

      {/* Save Dialog */}
      <ArticleSaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveArticle}
      />

      {/* Clean Confirm Dialog */}
      <AlertDialog open={cleanConfirmOpen} onOpenChange={setCleanConfirmOpen}>
        {/* ... */}
      </AlertDialog>
    </div>
  )
}
```

**验证：**
- [ ] CreateMode 正常工作
- [ ] EditMode 正常加载内容
- [ ] localStorage 自动保存正常
- [ ] 导出功能正常
- [ ] 清空功能正常

---

### 阶段 4: 测试与优化（第 5-6 天）

#### 任务 4.1: 功能测试清单

**CreateMode 测试：**
- [ ] 新建文章，编辑器空白
- [ ] 输入文本，编辑器正常显示
- [ ] 格式化按钮正常（加粗、斜体、标题等）
- [ ] 图片上传和插入正常
- [ ] 刷新页面后草稿恢复
- [ ] 导出 Markdown
- [ ] 导出 HTML
- [ ] 清空编辑器

**EditMode 测试：**
- [ ] 从 Article Manager 点击 Edit
- [ ] 文章内容正确显示
- [ ] 可以编辑内容
- [ ] 修改后可以保存
- [ ] 切换到其他文章再切换回来，内容保持
- [ ] 导出功能正常

**格式转换测试：**
- [ ] Markdown → HTML 转换正确
- [ ] HTML → Markdown 导出正确
- [ ] 纯文本自动转换正确

#### 任务 4.2: 性能优化

**优化点：**
1. **防抖保存优化**
   - 当前：500ms
   - 测试：是否需要调整

2. **大文档处理**
   - 测试 10000+ 字的文章
   - 检查编辑器性能
   - 检查 localStorage 保存性能

3. **内存泄漏检查**
   - 确保编辑器正确销毁
   - 确保 useEffect 清理函数正确执行

---

### 阶段 5: 文档与交付（第 7 天）

#### 任务 5.1: 更新文档

**需要更新的文档：**
1. ✅ `docs/tiptap/editor_features.md` - 本文档
2. ✅ `CLAUDE.md` - 添加编辑器使用说明，添加对 editor_features.md文档引用，简化 CLAUDE.md。

#### 任务 5.2: 代码注释

**需要添加注释的位置：**
1. `lib/editor-state.ts` - Hook 使用说明
2. `lib/tiptap-utils.ts` - 工具函数说明
3. `components/tiptap-editor.tsx` - 关键逻辑说明
4. `components/article/article-writing.tsx` - 状态管理说明

#### 任务 5.3: TODO 标记

**需要添加的 TODO：**
```typescript
// TODO: 后端 API 集成
// - POST /api/articles - 创建文章
// - PUT /api/articles/:id - 更新文章
// - GET /api/articles/:id - 获取文章
// - DELETE /api/articles/:id - 删除文章
// 参考：https://github.com/your-org/backend-api/issues/xxx

// TODO: Mock 数据废弃
// 后端 API 实现后，移除 components/article/article-types.ts 中的 mockArticles
// 参考：docs/tiptap/editor_features.md 阶段 1 任务 1.1
```

---

## 参考资源

### 官方文档
- [Tiptap Markdown 官方文档](https://tiptap.dev/docs/editor/markdown)
- [Tiptap setContent 命令](https://tiptap.dev/docs/editor/api/commands/content/set-content)
- [Tiptap React 集成](https://tiptap.dev/docs/editor/getting-started/install/react)
- [导出 JSON 和 HTML](https://tiptap.dev/docs/guides/output-json-html)

### 社区资源
- [StackOverflow: Tiptap React setContent](https://stackoverflow.com/questions/74505924/how-to-load-content-using-setcontent-in-tiptap-with-react)
- [GitHub: Streaming Markdown into Tiptap](https://github.com/ueberdosis/tiptap/discussions/5563)
- [中文 Tiptap 教程](https://juejin.cn/post/7246056370625413175)

### 内部文档
- `/docs/articles/IMPLEMENT_REPORT.md` - 文章系统实现报告
- `/CLAUDE.md` - 项目整体架构说明
- `/docs/AUTH_API.md` - 认证系统文档

---

**维护者：** Claude Code
**最后更新：** 2026-01-15
**状态：** 已审核
