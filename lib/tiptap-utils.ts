import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Link from '@tiptap/extension-link'

// 从 tiptap-extensions.ts 导入自定义扩展
import { UnderlineWithMarkdown, CustomImage, CustomHighlight, CustomTextAlign } from './tiptap-extensions'

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
 * 转换编辑器的扩展配置
 * 确保与实际编辑器配置一致，以支持所有自定义扩展
 */
const CONVERTER_EXTENSIONS = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  UnderlineWithMarkdown,
  CustomImage,
  CustomHighlight,
  CustomTextAlign,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-blue-600 underline cursor-pointer",
    },
  }),
  Markdown,
]

/**
 * 全局转换编辑器实例（单例模式）
 * 生命周期跟随应用
 */
let _converter: Editor | null = null

/**
 * 获取转换编辑器实例
 */
function getConverter(): Editor {
  if (!_converter) {
    _converter = new Editor({
      extensions: CONVERTER_EXTENSIONS,
      content: '',
      editable: false, // 转换用途，无需可编辑
    })
  }
  return _converter
}

/**
 * Markdown 转 HTML
 * 使用官方推荐的 contentType: 'markdown' 方式
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
export function markdownToHTML(markdown: string): string {
  if (!markdown) return ''

  try {
    const editor = getConverter()

    // 使用官方推荐的 API
    editor.commands.setContent(markdown, { contentType: 'markdown' })

    return editor.getHTML()
  } catch (error) {
    console.error('[markdownToHTML] Conversion failed:', error)
    return ''
  }
}

/**
 * HTML 转 Markdown
 * 使用官方推荐的 getMarkdown() 方法
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
    const editor = getConverter()

    // 设置 HTML 内容
    editor.commands.setContent(html)

    // 使用官方推荐的 API
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

/**
 * 清理转换编辑器（可选，仅在需要时手动调用）
 * 通常不需要调用，让编辑器跟随应用生命周期
 *
 * @example
 * ```ts
 * // 仅在特殊场景下使用，例如应用卸载前需要释放内存
 * cleanupConverter()
 * ```
 */
export function cleanupConverter() {
  if (_converter) {
    _converter.destroy()
    _converter = null
  }
}
