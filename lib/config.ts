const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

const API_BASE_URL_BY_APP_HOST: Record<string, string> = {
  'hk.joyword.link': 'https://hk-api.joyword.link',
  'joyword.top': 'https://api.joyword.top',
  'www.joyword.top': 'https://api.joyword.top',
}

export function resolveApiBaseUrl(hostname?: string): string {
  const currentHostname =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : undefined)

  if (currentHostname && API_BASE_URL_BY_APP_HOST[currentHostname]) {
    return API_BASE_URL_BY_APP_HOST[currentHostname]
  }

  return DEFAULT_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
