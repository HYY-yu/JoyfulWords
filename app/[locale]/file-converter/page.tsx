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
      ? "在 JoyfulWords 中使用 Word 模板完成 Markdown 转 Word 与 PPT 转 Word。"
      : "Convert Markdown and PPT files into Word documents with reusable Word templates in JoyfulWords.",
    path: buildLocalizedPath(locale, "/file-converter"),
    locale,
    alternatePaths: {
      zh: buildLocalizedPath("zh", "/file-converter"),
      en: buildLocalizedPath("en", "/file-converter"),
    },
    keywords: isZh
      ? ["文件转换", "Markdown转Word", "PPT转Word", "Word模板", "文档模板"]
      : ["file converter", "Markdown to Word", "PPT to Word", "Word template", "document template"],
  })
}

export default async function FileConverterPage({ params }: FileConverterPageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return <FileConverterPageContent />
}
