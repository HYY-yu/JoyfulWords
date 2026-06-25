"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { normalizeClueHref } from "./geometry"
import { normalizeMarkdownLinksWithSpaceDestinations } from "./markdown-utils"

interface MarkdownViewProps {
  markdown: string
  nodeId: string
  linkStates: Record<string, "loading" | "expanded">
  onClueClick: (targetQuery: string, label: string, anchorEl: HTMLElement) => void
}

export function buildClueLinkId(nodeId: string, targetQuery: string) {
  return `${nodeId}->${targetQuery.trim().toLowerCase()}`
}

export function MarkdownView({
  markdown,
  nodeId,
  linkStates,
  onClueClick,
}: MarkdownViewProps) {
  return (
    <div className="material-clue-markdown text-sm leading-6 text-foreground/90 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.14em] [&_h2]:text-muted-foreground [&_li]:my-1 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            const targetQuery = normalizeClueHref(href)
            const label = String(children ?? targetQuery)
            const linkId = buildClueLinkId(nodeId, targetQuery)
            const state = linkStates[linkId]
            return (
              <a
                href={href}
                data-clue-link="1"
                data-target-query={targetQuery}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!targetQuery || state === "loading" || state === "expanded") return
                  onClueClick(targetQuery, label, event.currentTarget)
                }}
                className={[
                  "cursor-pointer rounded-sm font-medium text-primary underline decoration-primary/40 underline-offset-4 transition",
                  state === "loading" ? "animate-pulse decoration-primary text-primary" : "",
                  state === "expanded" ? "cursor-default text-muted-foreground decoration-muted-foreground/30" : "",
                ].join(" ")}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {normalizeMarkdownLinksWithSpaceDestinations(markdown)}
      </ReactMarkdown>
    </div>
  )
}
