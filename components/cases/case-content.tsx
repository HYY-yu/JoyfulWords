"use client"

import { createElement, useEffect, useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { caseAssetUrl } from "@/lib/api/cases/client"

const allowed = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "u", "s", "blockquote", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "pre", "code", "br", "hr", "figcaption", "figure"])
const blocked = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button"])

// Render an allowlisted React tree, never raw snapshot HTML or event attributes.
function renderNode(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const element = node as Element
  const tag = element.tagName.toLowerCase()
  if (blocked.has(tag)) return null
  const children = Array.from(element.childNodes).map(renderNode)
  if (tag === "img") {
    const src = caseAssetUrl(element.getAttribute("src") || "")
    return src ? <img key={key} src={src} alt={element.getAttribute("alt") || ""} loading="lazy" /> : null
  }
  if (tag === "a") {
    const href = caseAssetUrl(element.getAttribute("href") || "")
    return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span key={key}>{children}</span>
  }
  return createElement(allowed.has(tag) ? tag : "div", { key }, children)
}

export function CaseContent({ content }: { content: string }) {
  // Persisted rich-text documents begin with a block tag. Markdown autolinks
  // and inline HTML must not switch the whole document to the HTML parser.
  const isHTML = /^\s*<(?:p|div|section|article|h[1-6]|ul|ol|blockquote|table|pre|figure)(?:\s|>)/i.test(content)
  const [html, setHtml] = useState<{ source: string; nodes: ReactNode[] } | null>(null)
  useEffect(() => {
    if (!isHTML) return
    const document = new DOMParser().parseFromString(content, "text/html")
    setHtml({ source: content, nodes: Array.from(document.body.childNodes).map(renderNode) })
  }, [content, isHTML])
  return <div className="max-w-none break-words text-sm leading-8 text-foreground sm:text-base [&_p]:my-4 [&_h1]:my-6 [&_h1]:text-3xl [&_h2]:my-5 [&_h2]:text-2xl [&_h3]:my-4 [&_h3]:text-xl [&_h4]:my-4 [&_h4]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-lg [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_th]:border [&_th]:border-border [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_hr]:my-6">
    {isHTML ? html?.source === content ? html.nodes : null : <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
      a: ({ href, children }) => {
        const safeHref = caseAssetUrl(href || "")
        return safeHref ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>
      },
      img: ({ src, alt }) => {
        const safeSrc = typeof src === "string" ? caseAssetUrl(src) : undefined
        return safeSrc ? <img src={safeSrc} alt={alt || ""} loading="lazy" /> : null
      },
    }}>{content}</ReactMarkdown>}
  </div>
}
