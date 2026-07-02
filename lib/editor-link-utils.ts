export function openEditorLink(url: string) {
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return

  const openedWindow = window.open(trimmedUrl, "_blank", "noopener,noreferrer")
  if (openedWindow) {
    openedWindow.opener = null
  }
}
