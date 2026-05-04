import type { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { McpPageContent } from "@/components/home/mcp-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl, buildMetadata, SITE_NAME } from "@/lib/seo"

interface LocalePageProps {
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const isZh = locale === "zh"

  return buildMetadata({
    title: "Connect to AI Agent",
    description: isZh
      ? "JoyfulWords 支持标准 MCP Server，可连接 Claude Code 或任意 AI Agent。复制命令即可让 AI Agent 自己安装。"
      : "JoyfulWords supports a standard MCP Server for Claude Code or any AI Agent. Copy the command and let your AI Agent install it.",
    path: buildLocalizedPath(locale, "/mcp"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/mcp"),
      en: buildLocalizedPath("en", "/mcp"),
    },
    keywords: isZh
      ? ["JoyfulWords MCP", "Claude Code MCP", "MCP Server", "HTTP MCP", "Claude MCP 添加"]
      : ["JoyfulWords MCP", "Claude Code MCP", "MCP Server", "HTTP MCP", "add MCP to Claude"],
  })
}

export default async function McpPage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: locale === "zh" ? "将 JoyfulWords MCP 连接到 AI Agent" : "Connect JoyfulWords MCP to an AI Agent",
    description:
      locale === "zh"
        ? "使用标准 MCP Server 把 JoyfulWords 添加到 Claude Code 或任意 AI Agent。"
        : "Use the standard MCP Server to add JoyfulWords to Claude Code or any AI Agent.",
    url: buildCanonicalUrl(buildLocalizedPath(locale, "/mcp")),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: buildCanonicalUrl("/"),
    },
    step: [
      {
        "@type": "HowToStep",
        name: locale === "zh" ? "添加 MCP 服务" : "Add the MCP service",
        text: "claude mcp add --transport http --client-id joyfulwords-mcp-server joyfulwords https://api.joyword.link/mcp",
      },
      {
        "@type": "HowToStep",
        name: locale === "zh" ? "启动 Claude Code" : "Launch Claude Code",
        text: locale === "zh" ? "启动 Claude Code。" : "Launch Claude Code.",
      },
      {
        "@type": "HowToStep",
        name: locale === "zh" ? "执行 /mcp" : "Run /mcp",
        text: locale === "zh" ? "在 Claude Code 中执行 /mcp 检查服务。" : "Run /mcp in Claude Code to check the service.",
      },
    ],
  }

  return (
    <>
      <Script
        id={`joyfulwords-mcp-howto-${locale}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <McpPageContent />
    </>
  )
}
