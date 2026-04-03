import "server-only"

import { cache } from "react"
import { promises as fs } from "node:fs"
import type { Dirent } from "node:fs"
import path from "node:path"
import type { BlogListItem } from "@/lib/blog"
import type { Locale } from "@/lib/i18n/shared"

const BLOG_DIRECTORY = path.join(process.cwd(), "blog")
const TOPIC_DEFINITION_FILE = "DEFI.md"

interface TopicCopy {
  label: string
  description: string
  audienceHint: string
  emptyState: string
}

interface TopicDefinition {
  id: string
  anchor: string
  order: number
  copy: Record<Locale, TopicCopy>
}

export interface BlogTopicSection extends TopicCopy {
  id: string
  anchor: string
  order: number
  posts: BlogListItem[]
}

export const getBlogTopics = cache(async (
  locale: Locale,
  posts: BlogListItem[],
): Promise<BlogTopicSection[]> => {
  const topicDefinitions = await getTopicDefinitions()

  return topicDefinitions.map((topic) => {
    const copy = topic.copy[locale]

    return {
      id: topic.id,
      anchor: topic.anchor,
      order: topic.order,
      label: copy.label,
      description: copy.description,
      audienceHint: copy.audienceHint,
      emptyState: copy.emptyState,
      posts: posts.filter((post) => post.topic === topic.id),
    }
  })
})

export const getAllowedBlogTopics = cache(async (): Promise<Set<string>> => {
  const topicDefinitions = await getTopicDefinitions()
  return new Set(topicDefinitions.map((topic) => topic.id))
})

const getTopicDefinitions = cache(async (): Promise<TopicDefinition[]> => {
  let entries: Dirent[] = []

  try {
    entries = await fs.readdir(BLOG_DIRECTORY, { withFileTypes: true })
  } catch (error) {
    console.warn("[blog-topics] Failed to read blog directory:", error)
    // TODO(observability): increment topic directory read failure metric.
    return []
  }

  const topicDefinitions: TopicDefinition[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const topicId = entry.name
    const definitionPath = path.join(BLOG_DIRECTORY, topicId, TOPIC_DEFINITION_FILE)

    try {
      const markdown = await fs.readFile(definitionPath, "utf8")
      topicDefinitions.push(parseTopicDefinition(markdown, topicId))
    } catch (error) {
      console.warn(`[blog-topics] Failed to load ${topicId}/${TOPIC_DEFINITION_FILE}:`, error)
      // TODO(observability): record topic definition load failures.
    }
  }

  return topicDefinitions.sort((left, right) => left.order - right.order)
})

function parseTopicDefinition(markdown: string, topicId: string): TopicDefinition {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)

  if (!match) {
    throw new Error(`Missing frontmatter block in ${topicId}/${TOPIC_DEFINITION_FILE}`)
  }

  const frontmatter: Record<string, string> = {}

  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line in ${topicId}/${TOPIC_DEFINITION_FILE}: ${line}`)
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")
    frontmatter[key] = value
  }

  const order = Number(frontmatter.order ?? "999")
  if (Number.isNaN(order)) {
    throw new Error(`Invalid order in ${topicId}/${TOPIC_DEFINITION_FILE}: ${frontmatter.order}`)
  }

  return {
    id: topicId,
    anchor: topicId,
    order,
    copy: {
      zh: {
        label: requireField(frontmatter, "label_zh", topicId),
        description: requireField(frontmatter, "description_zh", topicId),
        audienceHint: requireField(frontmatter, "audience_hint_zh", topicId),
        emptyState: requireField(frontmatter, "empty_state_zh", topicId),
      },
      en: {
        label: requireField(frontmatter, "label_en", topicId),
        description: requireField(frontmatter, "description_en", topicId),
        audienceHint: requireField(frontmatter, "audience_hint_en", topicId),
        emptyState: requireField(frontmatter, "empty_state_en", topicId),
      },
    },
  }
}

function requireField(frontmatter: Record<string, string>, key: string, topicId: string): string {
  const value = frontmatter[key]

  if (!value) {
    throw new Error(`Missing ${key} in ${topicId}/${TOPIC_DEFINITION_FILE}`)
  }

  return value
}
