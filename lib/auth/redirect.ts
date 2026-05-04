export const DEFAULT_AUTH_REDIRECT = '/articles'

export function normalizeAuthRedirect(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT
  }

  try {
    const parsed = new URL(value, 'https://console.joyword.link')

    if (parsed.origin !== 'https://console.joyword.link') {
      return DEFAULT_AUTH_REDIRECT
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}` || DEFAULT_AUTH_REDIRECT
  } catch {
    return DEFAULT_AUTH_REDIRECT
  }
}
