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

  // Persisted editor content is HTML. Detect it before Markdown so code blocks
  // containing lines like "# title" or "- item" are not reparsed on article load.
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html'
  }

  if (parseMarkdownTableRows(content)) {
    return 'markdown'
  }

  const markdownPatterns = [
    /^#{1,6}\s+/m,         // 标题 #, ##, ###
    /^\*{3,}$/m,           // 分隔线 ***
    /^\[.+?\]\(.+?\)/m,    // 链接 [text](url)
    /^>\s+/m,              // 引用 >
    /^\*{1,2}.+?\*{1,2}/m, // 粗体/斜体 *text* or **text**
    /^\[[ xX]\]\s+/m,      // 待办列表 [ ] / [x]
    /^[-*+]\s+/m,          // 无序列表 - * +
    /^[-*+]\s+\[[ xX]\]\s+/m, // 待办列表 - [ ] / - [x]
    /^\d+\.\s+/m,          // 有序列表 1. 2. 3.
    /!\[.*?\]\(.*?\)/m,    // 图片 ![alt](url)
  ]


  for (const pattern of markdownPatterns) {
    if (pattern.test(content)) {
      return 'markdown'
    }
  }

  return 'text'
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function splitMarkdownTableRow(line: string): string[] {
  let current = ''
  let escaped = false
  const cells: string[] = []
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')

  for (const char of trimmed) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '|') {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())

  return cells
}

function isMarkdownTableSeparatorRow(cells: string[]): boolean {
  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')))
  )
}

function normalizeTableRows(rows: string[][], columnCount: number): string[][] {
  return rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.trim() ?? '')
  )
}

export function parseMarkdownTableRows(markdown: string): string[][] | null {
  const lines = markdown
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return null
  }

  const header = splitMarkdownTableRow(lines[0])
  const separator = splitMarkdownTableRow(lines[1])

  if (
    header.length < 2 ||
    separator.length !== header.length ||
    !isMarkdownTableSeparatorRow(separator)
  ) {
    return null
  }

  const body = lines.slice(2).map(splitMarkdownTableRow)
  const hasInvalidBodyRow = body.some((row) => row.length > header.length)

  if (hasInvalidBodyRow) {
    return null
  }

  return normalizeTableRows([header, ...body], header.length)
}

export function parseTSVTableRows(text: string): string[][] | null {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\n+|\n+$/g, '')

  if (!normalized.trim()) {
    return null
  }

  const rows = normalized
    .split('\n')
    .map((line) => line.replace(/\r$/, '').split('\t').map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0))

  if (rows.length < 2) {
    return null
  }

  const columnCount = rows[0]?.length ?? 0

  if (columnCount < 2 || rows.some((row) => row.length !== columnCount)) {
    return null
  }

  return rows
}

function tableRowsToHTML(rows: string[][], options: { headerRow: boolean }): string {
  const renderCells = (row: string[], tagName: 'td' | 'th') =>
    row.map((cell) => `<${tagName}>${escapeHTML(cell)}</${tagName}>`).join('')

  if (options.headerRow) {
    const [header, ...body] = rows

    return [
      '<table>',
      '<thead>',
      `<tr>${renderCells(header ?? [], 'th')}</tr>`,
      '</thead>',
      '<tbody>',
      ...body.map((row) => `<tr>${renderCells(row, 'td')}</tr>`),
      '</tbody>',
      '</table>',
    ].join('')
  }

  return [
    '<table>',
    '<tbody>',
    ...rows.map((row) => `<tr>${renderCells(row, 'td')}</tr>`),
    '</tbody>',
    '</table>',
  ].join('')
}

export function clipboardTableTextToHTML(text: string): string | null {
  const markdownRows = parseMarkdownTableRows(text)
  if (markdownRows) {
    return tableRowsToHTML(markdownRows, { headerRow: true })
  }

  const tsvRows = parseTSVTableRows(text)
  if (tsvRows) {
    return tableRowsToHTML(tsvRows, { headerRow: false })
  }

  return null
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
