import { Marked, type RendererObject, type Tokens } from "marked"

export type WeChatMarkdownTheme = "default" | "grace" | "simple"
export type WeChatImageCaptionMode = "none" | "alt" | "title"

export interface WeChatMarkdownExportOptions {
  theme: WeChatMarkdownTheme
  primaryColor: string
  fontSize: number
  imageCaption: WeChatImageCaptionMode
  citeLinks: boolean
  showReadingTime: boolean
}

export interface WeChatMarkdownExportResult {
  html: string
  plainText: string
  wordCount: number
  readingMinutes: number
}

export const WECHAT_MARKDOWN_THEME_OPTIONS: Array<{
  value: WeChatMarkdownTheme
  labelKey: string
  descriptionKey: string
}> = [
  {
    value: "default",
    labelKey: "wechatExport.theme.default",
    descriptionKey: "wechatExport.theme.defaultDesc",
  },
  {
    value: "grace",
    labelKey: "wechatExport.theme.grace",
    descriptionKey: "wechatExport.theme.graceDesc",
  },
  {
    value: "simple",
    labelKey: "wechatExport.theme.simple",
    descriptionKey: "wechatExport.theme.simpleDesc",
  },
]

export const DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS: WeChatMarkdownExportOptions = {
  theme: "default",
  primaryColor: "#16a34a",
  fontSize: 16,
  imageCaption: "alt",
  citeLinks: true,
  showReadingTime: false,
}

const FOREGROUND = "#2f2f2f"
const MUTED = "#6b7280"
const LINK_COLOR = "#576b95"
const DARK_INK = "#111827"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;")
}

function mergeStyle(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(";")
}

function styled(tag: string, content: string, style: string, attrs = ""): string {
  return `<${tag}${attrs} style="${style}">${content}</${tag}>`
}

function hexToRgba(color: string, alpha: number): string {
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!match) return `rgba(22,163,74,${alpha})`

  const hex = match[1]
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)

  return `rgba(${red},${green},${blue},${alpha})`
}

function getThemeStyles(options: WeChatMarkdownExportOptions) {
  const primary = options.primaryColor
  const primarySoft = hexToRgba(primary, 0.12)
  const primaryWash = hexToRgba(primary, 0.06)
  const primaryLine = hexToRgba(primary, 0.28)
  const primaryShadow = hexToRgba(primary, 0.18)
  const fontSize = `${options.fontSize}px`
  const baseText = mergeStyle(
    "box-sizing:border-box",
    `font-size:${fontSize}`,
    "line-height:1.75",
    `color:${FOREGROUND}`,
    "letter-spacing:0.03em",
    "word-break:break-word"
  )

  const codeBlockBase = mergeStyle(
    "box-sizing:border-box",
    "display:block",
    "overflow-x:auto",
    "max-width:100%",
    "margin:12px 8px",
    "padding:14px",
    "border-radius:8px",
    "background:#f6f8fa",
    "color:#24292f",
    "font-size:14px",
    "line-height:1.65",
    "white-space:pre-wrap",
    "word-break:break-word",
    "font-family:Menlo,Monaco,Consolas,'Courier New',monospace"
  )

  const styles = {
    container: mergeStyle(
      "box-sizing:border-box",
      "max-width:100%",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
      `font-size:${fontSize}`,
      "line-height:1.75",
      "text-align:left",
      `color:${FOREGROUND}`
    ),
    h1: mergeStyle(
      "box-sizing:border-box",
      "display:table",
      "margin:0 auto 26px",
      "padding:14px 24px",
      `border:1px solid ${primaryLine}`,
      `border-bottom:4px solid ${primary}`,
      "border-radius:999px",
      `background:${primaryWash}`,
      `color:${FOREGROUND}`,
      `font-size:${Math.round(options.fontSize * 1.35)}px`,
      "font-weight:700",
      "line-height:1.45",
      "text-align:center"
    ),
    h2: mergeStyle(
      "box-sizing:border-box",
      "display:table",
      "margin:42px auto 22px",
      "padding:8px 18px",
      `border:1px solid ${primaryLine}`,
      "border-radius:18px 18px 18px 4px",
      `background:${primarySoft}`,
      `color:${DARK_INK}`,
      `font-size:${Math.round(options.fontSize * 1.22)}px`,
      "font-weight:700",
      "line-height:1.5",
      "text-align:center"
    ),
    h3: mergeStyle(
      "box-sizing:border-box",
      "margin:28px 8px 12px 0",
      "padding:9px 12px",
      `border-left:6px solid ${primary}`,
      `border-top:1px solid ${primaryLine}`,
      `border-right:1px solid ${primaryLine}`,
      `border-bottom:1px solid ${primaryLine}`,
      "border-radius:12px",
      `background:${primaryWash}`,
      `color:${FOREGROUND}`,
      `font-size:${Math.round(options.fontSize * 1.12)}px`,
      "font-weight:700",
      "line-height:1.4"
    ),
    h4: mergeStyle(
      "box-sizing:border-box",
      "margin:24px 8px 10px",
      `color:${primary}`,
      `font-size:${fontSize}`,
      "font-weight:700",
      "line-height:1.5"
    ),
    p: mergeStyle(baseText, "margin:18px 8px"),
    blockquote: mergeStyle(
      "box-sizing:border-box",
      "margin:18px 8px",
      "padding:14px 16px",
      `border:1px solid ${primaryLine}`,
      `border-left:5px solid ${primary}`,
      "border-radius:14px",
      `background:${primaryWash}`,
      `color:${FOREGROUND}`
    ),
    codeBlock: mergeStyle(
      codeBlockBase,
      "border:1px solid #e5e7eb",
      "border-radius:14px",
      "background:#f8fafc"
    ),
    codeInline: mergeStyle(
      "box-sizing:border-box",
      "padding:2px 5px",
      "border-radius:4px",
      "background:rgba(27,31,35,0.06)",
      "color:#d14",
      "font-size:90%",
      "font-family:Menlo,Monaco,Consolas,'Courier New',monospace"
    ),
    list: mergeStyle(
      "box-sizing:border-box",
      "margin:12px 8px",
      "padding-left:0",
      `color:${FOREGROUND}`
    ),
    listItem: mergeStyle(baseText, "display:block", "margin:6px 0"),
    figure: mergeStyle(
      "box-sizing:border-box",
      "margin:22px 8px",
      "padding:8px",
      "text-align:center",
      `border:1px solid ${primaryLine}`,
      "border-radius:18px",
      "background:#ffffff"
    ),
    image: mergeStyle(
      "box-sizing:border-box",
      "display:block",
      "max-width:100%",
      "height:auto",
      "margin:0 auto 8px",
      "border-radius:12px"
    ),
    caption: mergeStyle("box-sizing:border-box", `color:${MUTED}`, "font-size:13px", "line-height:1.5", "text-align:center", "padding:2px 8px 4px"),
    link: mergeStyle(`color:${LINK_COLOR}`, "text-decoration:none"),
    strong: mergeStyle("font-weight:700", `color:${FOREGROUND}`),
    em: mergeStyle("font-style:italic"),
    hr: mergeStyle("box-sizing:border-box", "height:6px", "border:0", "border-radius:999px", "margin:30px auto", `background:${primarySoft}`, "width:64%"),
    tableWrapper: mergeStyle("box-sizing:border-box", "max-width:100%", "overflow-x:auto", "margin:18px 8px"),
    table: mergeStyle("box-sizing:border-box", "width:100%", "border-collapse:separate", "border-spacing:0", `color:${FOREGROUND}`, `font-size:${fontSize}`, "border-radius:14px", "overflow:hidden", "border:1px solid #e5e7eb"),
    th: mergeStyle("box-sizing:border-box", "padding:9px", `background:${primary}`, "color:#ffffff", "border:0", "font-weight:700"),
    td: mergeStyle("box-sizing:border-box", "padding:9px", "border-top:1px solid #e5e7eb", `color:${FOREGROUND}`),
    h1Prefix: mergeStyle("display:inline-block", "width:10px", "height:10px", `background:${primary}`, "border-radius:999px", "margin-right:8px", "vertical-align:middle"),
    h1Suffix: mergeStyle("display:inline-block", "width:10px", "height:10px", `background:${primarySoft}`, "border-radius:999px", "margin-left:8px", "vertical-align:middle"),
    h2Prefix: mergeStyle("display:inline-block", "width:18px", "height:4px", `background:${primary}`, "border-radius:999px", "margin-right:8px", "vertical-align:middle"),
    h3Prefix: mergeStyle("display:inline-block", "width:7px", "height:7px", `background:${primary}`, "border-radius:999px", "margin-right:8px", "vertical-align:middle"),
    listMarker: mergeStyle(`color:${primary}`, "font-weight:700", "margin-right:4px"),
  }

  if (options.theme === "grace") {
    styles.h1 = mergeStyle(
      "box-sizing:border-box",
      "display:block",
      "margin:0 8px 30px",
      "padding:18px 18px 16px",
      `border:1px solid ${primaryLine}`,
      "border-radius:22px",
      `background:linear-gradient(135deg, ${primaryWash}, #ffffff 55%, ${hexToRgba(primary, 0.10)})`,
      `box-shadow:0 10px 28px ${primaryShadow}`,
      `color:${DARK_INK}`,
      `font-size:${Math.round(options.fontSize * 1.42)}px`,
      "font-weight:800",
      "line-height:1.45",
      "text-align:left"
    )
    styles.h2 = mergeStyle(
      "box-sizing:border-box",
      "display:table",
      "margin:44px 8px 20px",
      "padding:8px 16px",
      `background:linear-gradient(90deg, ${primary}, ${DARK_INK})`,
      "color:#ffffff",
      "border-radius:999px",
      `font-size:${Math.round(options.fontSize * 1.2)}px`,
      "font-weight:700",
      "line-height:1.5",
      "text-align:left",
      `box-shadow:0 8px 18px ${primaryShadow}`
    )
    styles.h3 = mergeStyle(
      "box-sizing:border-box",
      "margin:28px 8px 12px",
      "padding:0 0 8px",
      `border-bottom:2px solid ${primaryLine}`,
      `color:${DARK_INK}`,
      `font-size:${Math.round(options.fontSize * 1.14)}px`,
      "font-weight:700",
      "line-height:1.5"
    )
    styles.blockquote = mergeStyle(
      "box-sizing:border-box",
      "margin:20px 8px",
      "padding:16px 18px",
      `border:1px solid ${primaryLine}`,
      "border-radius:20px 20px 20px 6px",
      `background:linear-gradient(135deg, ${primaryWash}, #ffffff)`,
      `box-shadow:0 8px 20px ${hexToRgba(primary, 0.10)}`,
      `color:${FOREGROUND}`,
      "font-style:italic"
    )
    styles.figure = mergeStyle(
      "box-sizing:border-box",
      "margin:24px 8px",
      "padding:10px",
      "text-align:center",
      "border-radius:24px",
      `background:linear-gradient(135deg, ${primaryWash}, #ffffff)`,
      `border:1px solid ${primaryLine}`
    )
    styles.image = mergeStyle(styles.image, "border-radius:18px", `box-shadow:0 10px 24px ${hexToRgba(primary, 0.16)}`)
    styles.table = mergeStyle(styles.table, "border-radius:18px")
    styles.h1Prefix = mergeStyle("display:block", "width:42px", "height:5px", `background:${primary}`, "border-radius:999px", "margin:0 0 12px")
    styles.h1Suffix = mergeStyle("display:none")
    styles.h2Prefix = mergeStyle("display:inline-block", "width:8px", "height:8px", "background:#ffffff", "border-radius:999px", "margin-right:9px", "vertical-align:middle")
  }

  if (options.theme === "simple") {
    styles.h1 = mergeStyle(
      "box-sizing:border-box",
      "display:block",
      "margin:0 8px 28px",
      "padding:0 0 14px",
      `border-bottom:1px solid ${primaryLine}`,
      `color:${DARK_INK}`,
      `font-size:${Math.round(options.fontSize * 1.34)}px`,
      "font-weight:800",
      "line-height:1.45",
      "text-align:left"
    )
    styles.h2 = mergeStyle(
      "box-sizing:border-box",
      "display:table",
      "margin:38px 8px 18px",
      "padding:7px 14px",
      "border-radius:999px",
      `border:1px solid ${primaryLine}`,
      `background:${primaryWash}`,
      `color:${DARK_INK}`,
      `font-size:${Math.round(options.fontSize * 1.12)}px`,
      "font-weight:700",
      "line-height:1.5"
    )
    styles.h3 = mergeStyle(
      "box-sizing:border-box",
      "margin:24px 8px 10px",
      "padding:8px 10px",
      "border-radius:10px",
      `background:${primaryWash}`,
      `color:${FOREGROUND}`,
      `font-size:${Math.round(options.fontSize * 1.08)}px`,
      "font-weight:700",
      "line-height:1.45"
    )
    styles.blockquote = mergeStyle(
      "box-sizing:border-box",
      "margin:18px 8px",
      "padding:14px 16px",
      `border:1px dashed ${primaryLine}`,
      "border-radius:16px",
      "background:#ffffff",
      `color:${FOREGROUND}`
    )
    styles.figure = mergeStyle(
      "box-sizing:border-box",
      "margin:20px 8px",
      "padding:0",
      "text-align:center",
      "border:0",
      "border-radius:0",
      "background:transparent"
    )
    styles.image = mergeStyle(styles.image, `border:1px solid ${primaryLine}`, "border-radius:16px")
    styles.hr = mergeStyle("box-sizing:border-box", "height:1px", "border:0", "margin:26px 8px", `background:${primaryLine}`)
    styles.h1Prefix = mergeStyle("display:inline-block", "width:22px", "height:3px", `background:${primary}`, "border-radius:999px", "margin-right:8px", "vertical-align:middle")
    styles.h1Suffix = mergeStyle("display:none")
    styles.h2Prefix = mergeStyle("display:inline-block", "width:6px", "height:6px", `background:${primary}`, "border-radius:999px", "margin-right:8px", "vertical-align:middle")
  }

  return styles
}

function getImageCaption(mode: WeChatImageCaptionMode, alt: string, title: string | null): string {
  if (mode === "alt") return alt
  if (mode === "title") return title ?? ""
  return ""
}

function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_`~\-\d.[\]()]/g, " ")
    .trim()

  const cjkCount = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
  const wordCount = (text.replace(/[\u4e00-\u9fff]/g, " ").match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? []).length

  return cjkCount + wordCount
}

function createPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }

  const container = document.createElement("div")
  container.innerHTML = html
  return container.textContent?.replace(/\s+\n/g, "\n").trim() ?? ""
}

export function renderWeChatMarkdown(
  markdown: string,
  options: WeChatMarkdownExportOptions
): WeChatMarkdownExportResult {
  const styles = getThemeStyles(options)
  const footnotes: Array<{ index: number; title: string; href: string }> = []
  const listOrderedStack: boolean[] = []
  const listCounters: number[] = []

  const addFootnote = (title: string, href: string) => {
    const existing = footnotes.find((item) => item.href === href)
    if (existing) return existing.index

    const index = footnotes.length + 1
    footnotes.push({ index, title, href })
    return index
  }

  const renderer: RendererObject = {
    heading({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens)
      const style = depth === 1 ? styles.h1 : depth === 2 ? styles.h2 : depth === 3 ? styles.h3 : styles.h4
      const decoratedText =
        depth === 1
          ? `<span style="${styles.h1Prefix}"></span>${text}<span style="${styles.h1Suffix}"></span>`
          : depth === 2
            ? `<span style="${styles.h2Prefix}"></span>${text}`
            : depth === 3
              ? `<span style="${styles.h3Prefix}"></span>${text}`
              : text
      return styled(`h${Math.min(depth, 4)}`, decoratedText, style)
    },
    paragraph({ tokens }: Tokens.Paragraph) {
      const text = this.parser.parseInline(tokens)
      if (!text.trim()) return ""
      return styled("p", text, styles.p)
    },
    blockquote({ tokens }: Tokens.Blockquote) {
      return styled("blockquote", this.parser.parse(tokens), styles.blockquote)
    },
    code({ text, lang }: Tokens.Code) {
      const language = lang ? `<span style="display:block;margin-bottom:8px;color:${MUTED};font-size:12px;">${escapeHtml(lang)}</span>` : ""
      return styled("pre", `${language}${escapeHtml(text)}`, styles.codeBlock)
    },
    codespan({ text }: Tokens.Codespan) {
      return styled("code", escapeHtml(text), styles.codeInline)
    },
    list({ ordered, items, start = 1 }: Tokens.List) {
      listOrderedStack.push(ordered)
      listCounters.push(Number(start))
      const content = items.map((item) => this.listitem(item)).join("")
      listOrderedStack.pop()
      listCounters.pop()
      return styled(ordered ? "ol" : "ul", content, styles.list)
    },
    listitem(token: Tokens.ListItem) {
      const ordered = listOrderedStack[listOrderedStack.length - 1] ?? false
      const current = listCounters[listCounters.length - 1] ?? 1
      if (listCounters.length > 0) {
        listCounters[listCounters.length - 1] = current + 1
      }

      let content = ""
      try {
        content = this.parser.parseInline(token.tokens)
      } catch {
        content = this.parser.parse(token.tokens).replace(/^<p[^>]*>([\s\S]*?)<\/p>$/i, "$1")
      }

      const prefix = ordered ? `${current}.` : "•"
      const marker = `<span style="${styles.listMarker}">${prefix}</span>`
      return styled("li", `${marker}${content}`, styles.listItem)
    },
    image({ href, title, text }: Tokens.Image) {
      const caption = getImageCaption(options.imageCaption, text, title)
      const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ""
      const image = `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}"${titleAttr} style="${styles.image}" />`
      const captionHtml = caption ? styled("figcaption", escapeHtml(caption), styles.caption) : ""
      return styled("figure", `${image}${captionHtml}`, styles.figure)
    },
    link({ href, title, text, tokens }: Tokens.Link) {
      const parsedText = this.parser.parseInline(tokens)
      const safeHref = escapeAttribute(href)
      const safeTitle = escapeAttribute(title || text)

      if (href === text) {
        return parsedText
      }

      if (options.citeLinks && !/^https?:\/\/mp\.weixin\.qq\.com/.test(href)) {
        const index = addFootnote(title || text, href)
        return `<a href="${safeHref}" title="${safeTitle}" style="${styles.link}">${parsedText}<sup style="font-size:75%;color:${options.primaryColor};">[${index}]</sup></a>`
      }

      return `<a href="${safeHref}" title="${safeTitle}" style="${styles.link}">${parsedText}</a>`
    },
    strong({ tokens }: Tokens.Strong) {
      return styled("strong", this.parser.parseInline(tokens), styles.strong)
    },
    em({ tokens }: Tokens.Em) {
      return styled("em", this.parser.parseInline(tokens), styles.em)
    },
    table({ header, rows }: Tokens.Table) {
      const head = header.map((cell) => styled("th", this.parser.parseInline(cell.tokens), styles.th)).join("")
      const body = rows
        .map((row) => styled("tr", row.map((cell) => this.tablecell(cell)).join(""), ""))
        .join("")
      return styled(
        "section",
        `<table style="${styles.table}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
        styles.tableWrapper
      )
    },
    tablecell(token: Tokens.TableCell) {
      return styled("td", this.parser.parseInline(token.tokens), styles.td)
    },
    hr() {
      return `<hr style="${styles.hr}" />`
    },
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text)
    },
  }

  const marked = new Marked({
    breaks: true,
    gfm: true,
    renderer,
  })

  const body = marked.parse(markdown) as string
  const wordCount = countWords(markdown)
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 350))
  const readingTime = options.showReadingTime
    ? styled("blockquote", styled("p", `字数 ${wordCount}，阅读大约需 ${readingMinutes} 分钟`, styles.p), styles.blockquote)
    : ""
  const footnoteHtml = footnotes.length
    ? styled(
        "section",
        styled("h4", "引用链接", styles.h4) +
          footnotes
            .map((item) =>
              styled(
                "p",
                `<code style="${styles.codeInline}">[${item.index}]</code> ${escapeHtml(item.title)}: <span style="word-break:break-all;">${escapeHtml(item.href)}</span>`,
                mergeStyle(styles.p, "font-size:13px", "margin:8px")
              )
            )
            .join(""),
        "box-sizing:border-box;margin-top:28px;"
      )
    : ""
  const html = styled("section", `${readingTime}${body}${footnoteHtml}`, styles.container)

  return {
    html,
    plainText: createPlainText(html),
    wordCount,
    readingMinutes,
  }
}

function fallbackCopyHtml(html: string): boolean {
  if (typeof document === "undefined") return false

  const selection = window.getSelection()
  if (!selection) return false

  const container = document.createElement("div")
  container.innerHTML = html
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.opacity = "0"
  container.style.pointerEvents = "none"
  container.style.backgroundColor = "#ffffff"
  container.style.color = "#000000"
  document.body.appendChild(container)

  try {
    const range = document.createRange()
    range.selectNodeContents(container)
    selection.removeAllRanges()
    selection.addRange(range)
    return document.execCommand("copy")
  } finally {
    selection.removeAllRanges()
    container.remove()
  }
}

export async function copyWeChatHtml(html: string, plainText: string): Promise<void> {
  console.debug("[WeChatMarkdownExport] Copy requested", {
    htmlLength: html.length,
    plainTextLength: plainText.length,
  })

  if (typeof navigator !== "undefined" && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ])
      console.info("[WeChatMarkdownExport] Copied HTML content to clipboard", {
        htmlLength: html.length,
      })
      return
    } catch (error) {
      console.warn("[WeChatMarkdownExport] ClipboardItem copy failed, falling back to execCommand", {
        error,
      })
    }
  }

  if (fallbackCopyHtml(html)) {
    console.info("[WeChatMarkdownExport] Copied HTML content with execCommand fallback")
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText)
    console.warn("[WeChatMarkdownExport] HTML copy unavailable; copied plain text fallback")
    return
  }

  console.error("[WeChatMarkdownExport] Clipboard copy failed")
  throw new Error("Clipboard copy failed")
}
