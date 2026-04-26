const REVEAL_PREVIEW_GUARD_STYLE_ID = "joyfulwords-reveal-preview-guard"

const REVEAL_PREVIEW_GUARD_STYLE = `<style id="${REVEAL_PREVIEW_GUARD_STYLE_ID}">
.reveal .slide-number,
.reveal a.slide-number,
.reveal .slide-number a {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
</style>`

export function preparePresentationPreviewHTML(html: string): string {
  if (!html || html.includes(REVEAL_PREVIEW_GUARD_STYLE_ID)) {
    return html
  }

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${REVEAL_PREVIEW_GUARD_STYLE}</head>`)
  }

  return `${REVEAL_PREVIEW_GUARD_STYLE}${html}`
}
