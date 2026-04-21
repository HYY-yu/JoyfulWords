import type { MetadataRoute } from "next"
import { getBlogSlugs } from "@/lib/blog"
import { buildLocalizedPath, SUPPORTED_LOCALES } from "@/lib/i18n/route-locale"
import { buildCanonicalUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const blogSlugs = await getBlogSlugs()

  const localizedStaticPages = SUPPORTED_LOCALES.flatMap((locale) => [
    {
      url: buildCanonicalUrl(buildLocalizedPath(locale)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: buildCanonicalUrl(buildLocalizedPath(locale, "/blog")),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: buildCanonicalUrl(buildLocalizedPath(locale, "/privacy-policy")),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: buildCanonicalUrl(buildLocalizedPath(locale, "/cookie-policy")),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: buildCanonicalUrl(buildLocalizedPath(locale, "/terms-of-use")),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ])

  const blogPages: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    blogSlugs.map((slug) => ({
      url: buildCanonicalUrl(buildLocalizedPath(locale, `/blog/${slug}`)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  )

  return [...localizedStaticPages, ...blogPages]
}
