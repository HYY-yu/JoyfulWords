import { marked } from 'marked'

// Configure marked for GFM (GitHub Flavored Markdown)
marked.use({
  gfm: true,
  breaks: false,  // Don't convert single line breaks to <br>
})

/**
 * Tiptap 编辑器工具函数集合
 * 提供 Markdown、HTML、Text 之间的格式转换和检测功能
 *
 * @module tiptap-utils
 */

/**
 * 检测内容格式
 *
 * @param content - 待检测的内容字符串
 * @returns 格式类型：'markdown' | 'html' | 'text'
 *
 * @example
 * ```ts
 * detectContentFormat('# Hello') // 'markdown'
 * detectContentFormat('<p>Hello</p>') // 'html'
 * detectContentFormat('Hello') // 'text'
 * ```
 */
export function detectContentFormat(content: string): 'markdown' | 'html' | 'text' {
  if (!content) return 'text'

  // 检测 Markdown 标记
  const markdownPatterns = [
    /^#{1,6}\s+/m,        // 标题 #, ##, ###
    /^\*{3,}$/m,           // 分隔线 ***
    /^\[.+?\]\(.+?\)/m,    // 链接 [text](url)
    /^>\s+/m,              // 引用 >
    /^\*{1,2}.+?\*{1,2}/m, // 粗体/斜体 *text* or **text**
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
 * 使用 marked.js 库进行转换
 *
 * @param markdown - Markdown 格式字符串
 * @returns HTML 格式字符串
 *
 * @example
 * ```ts
 * const html = markdownToHTML('# Hello\n\nThis is **bold** text')
 * // 返回: '<h1>Hello</h1><p>This is <strong>bold</strong> text</p>'
 * ```
 */
export async function markdownToHTML(markdown: string): Promise<string> {
  if (!markdown) return ''
 
  try {
    return await marked.parse(markdown)
  } catch (error) {
    console.error('[markdownToHTML] Conversion failed:', error)
    return ''
  }
}

/**
 * HTML 转 Markdown
 * 使用主编辑器的 getMarkdown() 方法（需要 Markdown 扩展）
 *
 * @param html - HTML 格式字符串
 * @returns Markdown 格式字符串
 *
 * @example
 * ```ts
 * const markdown = htmlToMarkdown('<h1>Hello</h1><p>This is text</p>')
 * // 返回: '# Hello\n\nThis is text'
 * ```
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  try {
    // Access main editor instance (exposed at tiptap-editor.tsx:120)
    const editor = (window as any).tiptapEditor

    if (!editor) {
      console.error('[htmlToMarkdown] Editor not initialized. Call this after editor is ready.')
      return ''
    }

    // Get Markdown using the Markdown extension
    return editor.getMarkdown()
  } catch (error) {
    console.error('[htmlToMarkdown] Conversion failed:', error)
    return html
  }
}

/**
 * 纯文本转 HTML
 *
 * @param text - 纯文本字符串
 * @returns HTML 格式字符串
 *
 * @example
 * ```ts
 * const html = textToHTML('Hello\n\nWorld')
 * // 返回: '<p>Hello</p><p>World</p>'
 * ```
 */
export function textToHTML(text: string): string {
  if (!text) return ''

  return text
    .split('\n\n')
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => `<p>${para}</p>`)
    .join('')
}

/**
 * 根据格式自动转换内容为 HTML
 *
 * @param content - 输入内容
 * @param sourceFormat - 可选：明确指定源格式
 * @returns HTML 格式字符串
 *
 * @example
 * ```ts
 * // 自动检测格式
 * normalizeContentToHTML('# Hello') // Markdown -> HTML
 *
 * // 明确指定格式
 * normalizeContentToHTML('<p>Hello</p>', 'html') // 直接返回
 * ```
 */
export async function normalizeContentToHTML(
  content: string,
  sourceFormat?: 'markdown' | 'html' | 'text'
): Promise<string> {
  if (!content) return ''

  const format = sourceFormat || detectContentFormat(content)

  switch (format) {
    case 'markdown':
      return await markdownToHTML(content)
    case 'html':
      return content
    case 'text':
      return textToHTML(content)
    default:
      return content
  }
}

/**
 * 从 HTML 中提取纯文本（去除标签）
 *
 * @param html - HTML 格式字符串
 * @returns 纯文本字符串
 *
 * @example
 * ```ts
 * const text = extractTextFromHTML('<p>Hello <strong>World</strong></p>')
 * // 返回: 'Hello World'
 * ```
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return ''

  // 移除 HTML 标签
  return html.replace(/<[^>]*>/g, '')
}
