import { Marked, type RendererObject, type Tokens } from "marked"

import { DEFAULT_DESIGN_PALETTE } from "@/lib/design/default-palette"
import type { ArticleThemeDesign } from "@/lib/design/article-design"
export type WeChatImageCaptionMode = "none" | "alt" | "title"

export interface WeChatMarkdownExportOptions {
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

export const DEFAULT_WECHAT_MARKDOWN_EXPORT_OPTIONS: WeChatMarkdownExportOptions = {
  fontSize: 16,
  imageCaption: "alt",
  citeLinks: true,
  showReadingTime: false,
}

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

function formatCodeBlockText(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\t/g, "    ")
  const lines = normalized.split("\n")

  return lines
    .map((line) => {
      const escapedLine = escapeHtml(line)
        .replace(/ /g, "&nbsp;")

      return escapedLine || "&nbsp;"
    })
    .join("<br/>")
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

function getThemeStyles(options: WeChatMarkdownExportOptions, design?: ArticleThemeDesign | null) {
  const palette = design?.palette ?? DEFAULT_DESIGN_PALETTE
  const slug = design?.style.slug ?? "minimal-business"
  const primary = palette.primary
  const FOREGROUND = palette.text
  const MUTED = palette.muted_text
  const DARK_INK = palette.text
  const LINK_COLOR = primary
  const primarySoft = hexToRgba(primary, 0.12)
  const primaryWash = palette.background
  const primaryLine = palette.border
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
    "padding:0",
    "border-radius:14px",
    "background:#f6f8fa",
    "color:#24292f",
    "font-size:14px",
    "line-height:1.65",
    "word-break:normal",
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
    codeHeader: mergeStyle(
      "box-sizing:border-box",
      "display:block",
      "padding:8px 12px",
      "border-bottom:1px solid #e5e7eb",
      "background:#f1f5f9",
      `color:${MUTED}`,
      "font-size:12px",
      "line-height:1.4",
      "font-family:Menlo,Monaco,Consolas,'Courier New',monospace"
    ),
    codeContent: mergeStyle(
      "box-sizing:border-box",
      "display:block",
      "padding:12px 14px",
      "min-width:max-content",
      "color:#24292f",
      "font-size:13px",
      "line-height:1.75",
      "white-space:normal",
      "word-break:normal",
      "font-family:Menlo,Monaco,Consolas,'Courier New',monospace"
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

  const serif = "font-family:Georgia,'Songti SC',SimSun,serif"
  styles.container = mergeStyle(styles.container, `background:${palette.background}`, "padding:24px 16px", slug === "editorial-story" && serif)
  styles.strong = mergeStyle(styles.strong, `color:${primary}`)
  styles.link = mergeStyle(styles.link, `color:${primary}`)
  styles.codeInline = mergeStyle(styles.codeInline, `color:${primary}`, `background:${palette.surface}`)
  styles.figure = mergeStyle(styles.figure, "border:0", "padding:0", "background:transparent", "border-radius:0")
  styles.h1Prefix = "display:none"
  styles.h1Suffix = "display:none"
  styles.h2Prefix = "display:none"
  styles.h3Prefix = "display:none"
  styles.h1 = mergeStyle("margin:0 8px 30px;padding:0 0 16px;line-height:1.5;font-weight:700", `font-size:${Math.round(options.fontSize * 1.5)}px`, `color:${primary}`)
  styles.h2 = mergeStyle("margin:36px 8px 18px;padding:0 0 8px;line-height:1.5;font-weight:700", `font-size:${Math.round(options.fontSize * 1.2)}px`, `color:${primary}`)
  styles.h3 = mergeStyle("margin:24px 8px 12px;line-height:1.6;font-weight:700", `font-size:${options.fontSize + 1}px`, `color:${primary}`)
  styles.blockquote = mergeStyle("margin:22px 8px;padding:12px 16px", `border-left:3px solid ${primary}`, `background:${palette.surface}`)
  styles.hr = mergeStyle("height:1px;border:0;margin:32px 8px", `background:${primaryLine}`)

  const handwriting = "font-family:'Kaiti SC',STKaiti,KaiTi,'Segoe Print',cursive"
  const glass = mergeStyle(
    `background:${palette.surface}`,
    `background:linear-gradient(135deg,${hexToRgba(palette.surface, 0.88)},${hexToRgba(palette.surface, 0.48)})`,
    `border:1px solid ${hexToRgba(primary, 0.18)}`,
    "-webkit-backdrop-filter:blur(16px)", "backdrop-filter:blur(16px)",
    `box-shadow:inset 0 1px 0 ${hexToRgba(palette.surface, 0.95)},0 8px 28px ${hexToRgba(primary, 0.08)}`
  )
  // The six shared catalog styles control geometry only; all colors come from the snapshot.
  switch (slug) {
    case "editorial-story":
      styles.h1 = mergeStyle(styles.h1, serif, `border-bottom:3px double ${primary}`, "font-weight:800")
      styles.h2 = mergeStyle(styles.h2, serif, `border-left:4px solid ${primary}`, "padding:2px 0 2px 12px")
      styles.blockquote = mergeStyle(styles.blockquote, "border:0;background:transparent", `border-top:1px solid ${primaryLine}`, `border-bottom:1px solid ${primaryLine}`)
      styles.image = mergeStyle(styles.image, "border-radius:0")
      break
    case "hand-drawn":
      // Prefer locally available Chinese handwriting fonts; keep body text easy to scan.
      styles.h1 = mergeStyle(styles.h1, handwriting, "padding:12px 10px 18px", `border-bottom:3px double ${primary}`, "border-radius:2% 5% 28% 3% / 2% 4% 12% 7%")
      styles.h2 = mergeStyle(styles.h2, handwriting, `border:2px solid ${primary}`, "border-width:1px 2px 3px 1px;padding:5px 14px;display:table;border-radius:8% 3% 9% 2% / 5% 12% 4% 15%")
      styles.h3 = mergeStyle(styles.h3, handwriting)
      styles.blockquote = mergeStyle(styles.blockquote, handwriting, `border:2px dashed ${primary}`, "border-width:2px 1px 2px 2px;border-radius:3% 7% 4% 8% / 12% 4% 10% 3%", `box-shadow:3px 4px 0 ${hexToRgba(palette.secondary, 0.13)}`)
      styles.figure = mergeStyle(styles.figure, "padding:8px", `border:1px solid ${primary}`, "border-radius:2% 5% 3% 6% / 5% 2% 7% 3%")
      styles.image = mergeStyle(styles.image, "border-radius:3px")
      styles.hr = mergeStyle(styles.hr, "height:0;background:transparent", `border-bottom:2px dashed ${primaryLine}`, "border-radius:50%;width:70%;margin:32px auto")
      break
    case "cute-chibi":
      styles.h1 = mergeStyle(styles.h1, "text-align:center;padding:20px 16px;border-radius:24px", `background:${palette.surface}`)
      styles.h2 = mergeStyle(styles.h2, "display:table;padding:8px 16px;border-radius:20px", `background:${primary}`, `color:${palette.on_primary}`)
      styles.blockquote = mergeStyle(styles.blockquote, "border:0;border-radius:20px 20px 20px 4px")
      styles.image = mergeStyle(styles.image, "border-radius:18px")
      break
    case "premium-glass":
      // Progressive enhancement: gradients and solid fallbacks carry the design if the
      // destination strips backdrop-filter. Never blur the article text itself.
      styles.container = mergeStyle(styles.container, `background-image:radial-gradient(ellipse at 0% 0%,${hexToRgba(primary, 0.18)},transparent 42%),radial-gradient(ellipse at 100% 35%,${hexToRgba(palette.secondary, 0.14)},transparent 48%)`)
      styles.h1 = mergeStyle(styles.h1, "padding:20px;border-radius:12px", `background:${palette.surface}`, `border:1px solid ${primaryLine}`, `border-top:3px solid ${primary}`)
      styles.h2 = mergeStyle(styles.h2, "padding:10px 14px;border-radius:8px", `background:${palette.surface}`, `border:1px solid ${primaryLine}`)
      styles.blockquote = mergeStyle(styles.blockquote, `border:1px solid ${primaryLine}`, "border-radius:12px")
      styles.h1 = mergeStyle(styles.h1, glass, "padding:24px 20px;border-radius:16px")
      styles.h2 = mergeStyle(styles.h2, glass)
      styles.blockquote = mergeStyle(styles.blockquote, glass)
      styles.image = mergeStyle(styles.image, "border-radius:10px")
      break
    case "minimal-light":
      styles.container = mergeStyle(styles.container, `background-image:radial-gradient(ellipse at 100% 0%,${hexToRgba(palette.secondary, 0.13)},transparent 38%),linear-gradient(160deg,${hexToRgba(palette.surface, 0.6)},transparent 65%)`)
      styles.h1 = mergeStyle(styles.h1, `color:${palette.text}`, `border-bottom:1px solid ${primaryLine}`, "padding-bottom:28px")
      styles.h2 = mergeStyle(styles.h2, "margin-top:44px")
      styles.blockquote = mergeStyle(styles.blockquote, "background:transparent", `border-left:2px solid ${primaryLine}`)
      styles.h1 = mergeStyle(styles.h1, "padding:24px 16px 30px", `background:linear-gradient(125deg,${hexToRgba(palette.surface, 0.8)},${hexToRgba(primary, 0.04)},transparent)`, "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)")
      styles.blockquote = mergeStyle(styles.blockquote, `background:linear-gradient(90deg,${hexToRgba(palette.surface, 0.72)},${hexToRgba(palette.surface, 0.15)})`, "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)", `box-shadow:0 6px 24px ${hexToRgba(primary, 0.04)}`)
      styles.image = mergeStyle(styles.image, "border-radius:3px")
      break
    default: // minimal-business, and forward-compatible unknown styles
      styles.h1 = mergeStyle(styles.h1, `border-top:4px solid ${primary}`, "padding-top:18px")
      styles.h2 = mergeStyle(styles.h2, `border-bottom:2px solid ${primary}`, "display:table")
      styles.image = mergeStyle(styles.image, "border-radius:2px")
      break
  }
  styles.th = mergeStyle(styles.th, `color:${palette.on_primary}`)
  styles.table = mergeStyle(styles.table, `background:${palette.surface}`, `border:1px solid ${primaryLine}`)
  styles.td = mergeStyle(styles.td, `border-top:1px solid ${primaryLine}`)
  styles.codeBlock = mergeStyle(styles.codeBlock, `background:${palette.surface}`, `border:1px solid ${primaryLine}`)
  styles.codeHeader = mergeStyle(styles.codeHeader, `background:${palette.background}`, `color:${palette.muted_text}`, `border-bottom:1px solid ${primaryLine}`)
  styles.codeContent = mergeStyle(styles.codeContent, `color:${palette.text}`)
  if (slug === "minimal-business" || slug === "editorial-story") {
    styles.table = mergeStyle(styles.table, "border-radius:0;border-collapse:collapse", `border:1px solid ${primary}`)
    styles.th = mergeStyle(styles.th, "border-radius:0", `border:1px solid ${primary}`)
    styles.td = mergeStyle(styles.td, `border:1px solid ${primaryLine}`)
  } else if (slug === "hand-drawn") {
    styles.table = mergeStyle(styles.table, `border:2px solid ${primary}`, "border-radius:1% 3% 2% 4% / 3% 1% 4% 2%")
    styles.th = mergeStyle(styles.th, handwriting)
    styles.td = mergeStyle(styles.td, `border-top:1px dashed ${primaryLine}`)
  } else if (slug === "premium-glass" || slug === "minimal-light") {
    styles.table = mergeStyle(styles.table, glass, slug === "minimal-light" && "border-radius:4px;box-shadow:none")
    styles.th = mergeStyle(styles.th, `background:linear-gradient(120deg,${primary},${hexToRgba(primary, 0.84)})`)
  }

  return styles
}

function getImageCaption(mode: WeChatImageCaptionMode, alt: string, title: string | null): string {
  if (mode === "alt") return alt
  if (mode === "title") return title ?? ""
  return ""
}

function countVisibleCharacters(text: string): number {
  return Array.from(text.replace(/\s/g, "")).length
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#96;/g, "`")
}

function createPlainText(html: string): string {
  if (typeof document === "undefined") {
    return decodeBasicHtmlEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim()
  }

  const container = document.createElement("div")
  container.innerHTML = html
  return container.textContent?.replace(/\s+\n/g, "\n").trim() ?? ""
}

export function renderWeChatMarkdown(
  markdown: string,
  options: WeChatMarkdownExportOptions,
  design?: ArticleThemeDesign | null
): WeChatMarkdownExportResult {
  const styles = getThemeStyles(options, design)
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
      const language = lang
        ? styled("section", escapeHtml(lang.split(" ")[0]), styles.codeHeader)
        : ""
      const content = styled("code", formatCodeBlockText(text), styles.codeContent)
      return styled("section", `${language}${content}`, styles.codeBlock)
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
        return `<a href="${safeHref}" title="${safeTitle}" style="${styles.link}">${parsedText}<sup style="font-size:75%;color:${design?.palette.primary ?? DEFAULT_DESIGN_PALETTE.primary};">[${index}]</sup></a>`
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
  const visibleContentText = createPlainText(`${body}${footnoteHtml}`)
  const wordCount = countVisibleCharacters(visibleContentText)
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 350))
  const readingTime = options.showReadingTime
    ? styled("blockquote", styled("p", `字数 ${wordCount}，阅读大约需 ${readingMinutes} 分钟`, styles.p), styles.blockquote)
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
