import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { buildLocalizedPath, isLocale } from "@/lib/i18n/route-locale"

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getRequestLocale() {
  const requestLocale = (await headers()).get("x-locale")
  return isLocale(requestLocale) ? requestLocale : "zh"
}

export default async function BlogPostRedirectPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  redirect(buildLocalizedPath(await getRequestLocale(), `/blog/${slug}`))
}
