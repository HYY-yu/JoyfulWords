import type { Metadata } from "next"
import { HomePageContent } from "@/components/home/home-page-content"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "AI 内容创作工作台",
  description:
    "JoyfulWords 是面向正式内容生产的 AI 内容创作工作台，把 AI 写作、AI 配图、素材管理和 SEO 优化整合进同一工作流。",
  path: "/",
  keywords: [
    "AI内容创作工具",
    "AI写作工作台",
    "博客写作工具",
    "SEO内容创作",
    "内容创作工作流",
  ],
})

export default function LandingPage() {
  return <HomePageContent />
}

