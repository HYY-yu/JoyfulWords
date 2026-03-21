import "server-only"

import { cache } from "react"
import { promises as fs } from "node:fs"
import path from "node:path"
import { markdownToHTML } from "@/lib/tiptap-utils"
import type { Locale } from "@/lib/i18n/shared"

const BLOG_DIRECTORY = path.join(process.cwd(), "blog")
const BLOG_FILE_PATTERN = /^(?<slug>.+)\.(?<locale>zh|en)\.md$/

interface BlogFrontmatter {
  title: string
  date: string
  summary: string
  locale: Locale
}

interface RawBlogPost extends BlogFrontmatter {
  slug: string
  content: string
}

export interface BlogListItem extends BlogFrontmatter {
  slug: string
  availableLocales: Locale[]
  isFallback: boolean
}

export interface BlogPost extends BlogListItem {
  html: string
}

function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, string>
  content: string
} {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)

  if (!match) {
    throw new Error("Missing frontmatter block")
  }

  const [, frontmatterBlock, content] = match
  const frontmatter: Record<string, string> = {}

  for (const rawLine of frontmatterBlock.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`)
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")

    frontmatter[key] = value
  }

  return { frontmatter, content: content.trim() }
}

function validateFrontmatter(
  frontmatter: Record<string, string>,
  fileName: string,
  localeFromFile: Locale,
): BlogFrontmatter {
  const { title, date, summary, locale } = frontmatter

  if (!title || !date || !summary) {
    throw new Error(`Missing required frontmatter fields in ${fileName}`)
  }

  if (Number.isNaN(Date.parse(date))) {
    throw new Error(`Invalid date in ${fileName}: ${date}`)
  }

  if (locale && locale !== localeFromFile) {
    console.warn(
      `[blog] Frontmatter locale mismatch in ${fileName}, using filename locale "${localeFromFile}" instead of "${locale}".`,
    )
    // TODO(observability): attach trace attributes for locale mismatch during content ingestion.
  }

  return {
    title,
    date,
    summary,
    locale: localeFromFile,
  }
}

const getRawBlogPosts = cache(async (): Promise<RawBlogPost[]> => {
  let fileNames: string[] = []

  try {
    fileNames = await fs.readdir(BLOG_DIRECTORY)
  } catch (error) {
    console.warn("[blog] Failed to read blog directory:", error)
    // TODO(observability): increment blog directory read failure metric.
    return []
  }

  const posts = new Map<string, RawBlogPost>()

  for (const fileName of fileNames) {
    const matched = fileName.match(BLOG_FILE_PATTERN)
    if (!matched?.groups) continue

    const slug = matched.groups.slug
    const locale = matched.groups.locale as Locale
    const dedupeKey = `${slug}:${locale}`
    const filePath = path.join(BLOG_DIRECTORY, fileName)

    if (posts.has(dedupeKey)) {
      console.warn(`[blog] Duplicate blog entry detected for ${dedupeKey}, skipping ${fileName}.`)
      // TODO(observability): record duplicate slug-locale pairs.
      continue
    }

    try {
      const markdown = await fs.readFile(filePath, "utf8")
      const { frontmatter, content } = parseFrontmatter(markdown)
      const validatedFrontmatter = validateFrontmatter(frontmatter, fileName, locale)

      if (!content) {
        throw new Error(`Empty markdown body in ${fileName}`)
      }

      posts.set(dedupeKey, {
        slug,
        content,
        ...validatedFrontmatter,
      })
    } catch (error) {
      console.warn(`[blog] Failed to load ${fileName}:`, error)
      // TODO(observability): record per-file load failures for markdown ingestion.
    }
  }

  return [...posts.values()].sort((left, right) => {
    return new Date(right.date).getTime() - new Date(left.date).getTime()
  })
})

function buildLocaleMap(posts: RawBlogPost[]) {
  const localeMap = new Map<string, Partial<Record<Locale, RawBlogPost>>>()

  for (const post of posts) {
    const localeEntry = localeMap.get(post.slug) ?? {}
    localeEntry[post.locale] = post
    localeMap.set(post.slug, localeEntry)
  }

  return localeMap
}

export const getBlogSlugs = cache(async (): Promise<string[]> => {
  const posts = await getRawBlogPosts()
  return [...new Set(posts.map((post) => post.slug))]
})

export const getBlogList = cache(async (locale: Locale): Promise<BlogListItem[]> => {
  const posts = await getRawBlogPosts()
  const localeMap = buildLocaleMap(posts)

  return [...localeMap.entries()]
    .map(([slug, locales]) => {
      const requestedPost = locales[locale]
      const fallbackPost = locale === "zh" ? locales.en : locales.zh
      const selectedPost = requestedPost ?? fallbackPost

      if (!selectedPost) return null

      return {
        slug,
        title: selectedPost.title,
        date: selectedPost.date,
        summary: selectedPost.summary,
        locale: selectedPost.locale,
        availableLocales: (Object.keys(locales) as Locale[]).sort(),
        isFallback: selectedPost.locale !== locale,
      }
    })
    .filter((post): post is BlogListItem => post !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
})

export const getBlogPostBySlug = cache(async (
  slug: string,
  locale: Locale,
): Promise<BlogPost | null> => {
  const posts = await getRawBlogPosts()
  const localeMap = buildLocaleMap(posts)
  const locales = localeMap.get(slug)

  if (!locales) {
    return null
  }

  const selectedPost = locales[locale] ?? (locale === "zh" ? locales.en : locales.zh)
  if (!selectedPost) {
    return null
  }

  const html = await markdownToHTML(selectedPost.content)

  return {
    slug,
    title: selectedPost.title,
    date: selectedPost.date,
    summary: selectedPost.summary,
    locale: selectedPost.locale,
    availableLocales: (Object.keys(locales) as Locale[]).sort(),
    isFallback: selectedPost.locale !== locale,
    html,
  }
})
