import type { BlogListItem } from "@/lib/blog"
import type { Locale } from "@/lib/i18n/shared"

export type BlogTopicId =
  | "ai-writing"
  | "seo-content"
  | "content-workflow"
  | "ai-visuals"
  | "materials"

interface TopicCopy {
  label: string
  description: string
  audienceHint: string
  emptyState: string
}

interface BlogTopicDefinition {
  id: BlogTopicId
  anchor: string
  slugs: string[]
  keywords: string[]
  copy: Record<Locale, TopicCopy>
}

export interface BlogTopicSection extends TopicCopy {
  id: BlogTopicId
  anchor: string
  posts: BlogListItem[]
}

const BLOG_TOPIC_DEFINITIONS: BlogTopicDefinition[] = [
  {
    id: "ai-writing",
    anchor: "ai-writing",
    slugs: ["welcome-to-joyfulwords"],
    keywords: ["ai 写作", "ai writing", "rewrite", "writing", "blog writing"],
    copy: {
      zh: {
        label: "AI 写作",
        description: "聚焦文章起稿、扩写、改写、润色，以及如何把 AI 真正用进正式发布流程。",
        audienceHint: "适合想把 AI 写作从灵感工具升级为正式生产工具的创作者。",
        emptyState: "这里会优先收录 AI 写作方法、最佳实践和常见误区。",
      },
      en: {
        label: "AI Writing",
        description: "Drafting, rewriting, polishing, and turning AI writing into a reliable publishing workflow.",
        audienceHint: "For creators who want AI writing to support real production rather than one-off prompts.",
        emptyState: "This section will collect AI writing workflows, best practices, and common mistakes.",
      },
    },
  },
  {
    id: "seo-content",
    anchor: "seo-content",
    slugs: [],
    keywords: ["seo", "keyword", "keywords", "faq", "search intent"],
    copy: {
      zh: {
        label: "SEO 内容优化",
        description: "围绕关键词、结构、FAQ、搜索意图与内容完整性，帮助文章更适合长期搜索流量。",
        audienceHint: "适合把官网博客当成获客资产来经营的团队和创作者。",
        emptyState: "这里会持续补充 SEO 写作、结构优化和内容集群相关文章。",
      },
      en: {
        label: "SEO Content",
        description: "Keyword strategy, structure, FAQ, search intent, and content completeness for compounding search traffic.",
        audienceHint: "For teams and creators using a blog as a long-term acquisition channel.",
        emptyState: "This section will grow into SEO writing, article structure, and content cluster guidance.",
      },
    },
  },
  {
    id: "content-workflow",
    anchor: "content-workflow",
    slugs: ["welcome-to-joyfulwords"],
    keywords: ["workflow", "process", "publishing", "content workflow", "creator workflow"],
    copy: {
      zh: {
        label: "内容创作工作流",
        description: "从选题、搜集资料、写作、配图到发布准备，关注完整创作链路而不是单点技巧。",
        audienceHint: "适合重视效率、质量和协作连续性的正式内容生产场景。",
        emptyState: "这里会沉淀内容工作流、流程设计和发布准备类文章。",
      },
      en: {
        label: "Content Workflow",
        description: "Planning, research, writing, visuals, and publishing prep across one continuous creation workflow.",
        audienceHint: "For formal content production where efficiency and consistency matter.",
        emptyState: "This section will cover workflows, process design, and publishing readiness.",
      },
    },
  },
  {
    id: "ai-visuals",
    anchor: "ai-visuals",
    slugs: [],
    keywords: ["image", "visual", "illustration", "ai image", "cover image"],
    copy: {
      zh: {
        label: "AI 配图",
        description: "围绕文章插图、封面图和视觉一致性，帮助内容在阅读体验和完成度上更进一步。",
        audienceHint: "适合希望把写作与视觉呈现放到同一工作台里的创作者。",
        emptyState: "这里会补充 AI 配图、插图协同和视觉策略类文章。",
      },
      en: {
        label: "AI Visuals",
        description: "Article visuals, cover images, and visual consistency that support stronger published content.",
        audienceHint: "For creators who want writing and visuals inside one working system.",
        emptyState: "This section will cover AI visuals, illustration workflows, and visual strategy.",
      },
    },
  },
  {
    id: "materials",
    anchor: "materials",
    slugs: [],
    keywords: ["material", "materials", "reference", "research", "knowledge base"],
    copy: {
      zh: {
        label: "素材管理与复用",
        description: "讨论如何沉淀网页、图片、资料和参考信息，让素材变成长期可复用的内容资产。",
        audienceHint: "适合需要持续写作、持续积累参考资料的内容团队。",
        emptyState: "这里会补充素材管理、参考资料整理和复用方法。",
      },
      en: {
        label: "Materials & Reuse",
        description: "How to organize references, links, visuals, and source material into reusable content assets.",
        audienceHint: "For teams that publish continuously and need a reusable research system.",
        emptyState: "This section will expand into material management and reference reuse guides.",
      },
    },
  },
]

export function getBlogTopics(locale: Locale, posts: BlogListItem[]): BlogTopicSection[] {
  return BLOG_TOPIC_DEFINITIONS.map((topic) => {
    const matchedPosts = posts.filter((post) => matchesTopic(post, topic))
    const copy = topic.copy[locale]

    return {
      id: topic.id,
      anchor: topic.anchor,
      label: copy.label,
      description: copy.description,
      audienceHint: copy.audienceHint,
      emptyState: copy.emptyState,
      posts: matchedPosts,
    }
  })
}

function matchesTopic(post: BlogListItem, topic: BlogTopicDefinition): boolean {
  if (topic.slugs.includes(post.slug)) {
    return true
  }

  const haystack = `${post.title} ${post.summary}`.toLowerCase()
  return topic.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
}

