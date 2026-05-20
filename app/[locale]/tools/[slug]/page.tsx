import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ToolsPageContent } from "@/components/tools/tools-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildMetadata } from "@/lib/seo"
import { TOOL_SLUGS, isToolSlug, type ToolSlug } from "@/lib/tools/catalog"

interface ToolDetailPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

const toolMetadata: Record<ToolSlug, { zh: string; en: string }> = {
  "ai-writer": { zh: "AI 写作", en: "AI Writer" },
  "image-generator": { zh: "创作图片", en: "Create Image" },
  infographic: { zh: "信息图", en: "Infographic" },
  "mind-map": { zh: "思维导图", en: "Mind Map" },
  "ai-charts": { zh: "AI 图表", en: "AI Charts" },
  "ppt-generator": { zh: "PPT 生成", en: "PPT Generator" },
  "markdown-to-word": { zh: "Markdown 转 Word", en: "Markdown to Word" },
  "ppt-to-word": { zh: "PPT 转 Word", en: "PPT to Word" },
  "word-to-ppt": { zh: "Word 转 PPT", en: "Word to PPT" },
  "meme-inserter": { zh: "智能插入表情包", en: "Smart Meme Inserter" },
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    TOOL_SLUGS.map((slug) => ({
      locale,
      slug,
    })),
  )
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isLocale(locale) || !isToolSlug(slug)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const isZh = locale === "zh"
  const toolTitle = toolMetadata[slug][locale]

  return buildMetadata({
    title: isZh ? `${toolTitle} - 免费工具` : `${toolTitle} - Free Tool`,
    description: slug === "image-generator"
      ? isZh
        ? "使用 JoyfulWords 创作图片工具，通过文字描述和参考图生成封面、配图与营销素材，支持游客试用。"
        : "Use JoyfulWords Create Image to generate covers, supporting visuals, and campaign assets from prompts and reference images, with guest trial support."
      : slug === "infographic"
        ? isZh
          ? "登录 JoyfulWords 后，输入或粘贴一段文字，自动分析主题并生成适合传播的信息图。"
          : "Log in to JoyfulWords, paste or write a passage, and generate a shareable infographic from the analyzed topic."
        : slug === "ai-charts"
          ? isZh
            ? "使用 JoyfulWords AI 图表工具，把数据、观点或分析结果转换成可读图表。"
            : "Use JoyfulWords AI Charts to turn data, claims, or analysis into readable charts."
        : isZh
          ? `${toolTitle} 是 JoyfulWords 免费工具箱中的独立工具页面，当前功能预留中，后续支持分享、SEO 和任务中心联动。`
          : `${toolTitle} is an independent JoyfulWords free tool page prepared for sharing, SEO, and Task Center integration.`,
    path: buildLocalizedPath(locale, `/tools/${slug}`),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", `/tools/${slug}`),
      en: buildLocalizedPath("en", `/tools/${slug}`),
    },
    keywords: isZh
      ? [toolTitle, "免费 AI 工具", "JoyfulWords 工具箱"]
      : [toolTitle, "free AI tool", "JoyfulWords toolbox"],
  })
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale) || !isToolSlug(slug)) {
    notFound()
  }

  return <ToolsPageContent selectedToolSlug={slug} />
}
