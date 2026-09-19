import { illustrationsClient } from "@/lib/api/illustrations/client"
import type { ArticleDesignState } from "@/lib/api/illustrations/types"

export type ArticleDesignSnapshot = NonNullable<ArticleDesignState["binding"]>["snapshot"]
export type ArticleThemeDesign = Pick<ArticleDesignSnapshot, "style" | "palette">

// A bound article keeps its snapshot; otherwise use the user's current preference.
// Failures must propagate so consumers do not export a silently substituted design.
export async function fetchArticleDesign(articleId?: number): Promise<ArticleDesignSnapshot | null> {
  if (articleId) {
    const article = await illustrationsClient.design(articleId)
    if ("error" in article) throw new Error(article.error)
    if (article.binding) return article.binding.snapshot
  }
  const preference = await illustrationsClient.preference()
  if ("error" in preference) throw new Error(preference.error)
  return preference.snapshot
}
