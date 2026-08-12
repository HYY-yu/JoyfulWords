const NON_TEXT_ARTICLE_CONTENT_PATTERN =
  /<(img|video|audio|table|hr|iframe|svg|canvas|figure)\b/i

function normalizeArticleText(value: string): string {
  return value
    .replace(/&nbsp;|&#160;|&#x0*a0;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim()
}

export function hasMeaningfulArticleContent({
  html,
  text,
}: {
  html: string
  text?: string
}): boolean {
  const visibleText = normalizeArticleText(
    text ?? html.replace(/<[^>]*>/g, "")
  )

  return Boolean(visibleText) || NON_TEXT_ARTICLE_CONTENT_PATTERN.test(html)
}

export function shouldConfirmAIWriteOverwrite(
  articleId: number | null | undefined,
  articleHasContent: boolean
): boolean {
  return typeof articleId === "number" && articleHasContent
}

export function shouldTrackFirstArticleKeystroke({
  articleId,
  articleStartedEmpty,
  alreadyTracked,
}: {
  articleId: number | null | undefined
  articleStartedEmpty: boolean
  alreadyTracked: boolean
}): boolean {
  return typeof articleId === "number" && articleStartedEmpty && !alreadyTracked
}
