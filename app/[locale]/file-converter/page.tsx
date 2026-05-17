import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { FileConverterPageContent } from "@/components/file-converter/file-converter-page-content"
import { buildLocalizedPath, isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildMetadata } from "@/lib/seo"

interface FileConverterPageProps {
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: FileConverterPageProps): Promise<Metadata> {
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
    title: isZh ? "文件转换" : "File Converter",
    description: isZh
      ? "在 JoyfulWords 中转换 PDF、Word、JSON 与 Markdown 文件或文本。"
      : "Convert PDF, Word, JSON, and Markdown files or text in JoyfulWords.",
    path: buildLocalizedPath(locale, "/file-converter"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/file-converter"),
      en: buildLocalizedPath("en", "/file-converter"),
    },
    keywords: isZh
      ? ["文件转换", "PDF转Markdown", "Word转JSON", "Markdown转PDF", "JSON转Word"]
      : ["file converter", "PDF to Markdown", "Word to JSON", "Markdown to PDF", "JSON to Word"],
  })
}

export default async function FileConverterPage({ params }: FileConverterPageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <FileConverterPageContent />
}
