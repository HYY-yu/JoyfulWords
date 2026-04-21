import type { Locale } from "./shared"

export const SUPPORTED_LOCALES = ["zh", "en"] as const
const LOCALE_PREFIX = /^\/(zh|en)(?=\/|$)/

export const DEFAULT_LOCALE: Locale = "zh"

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh" || value === "en"
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const match = pathname.match(LOCALE_PREFIX)
  return match ? (match[1] as Locale) : null
}

export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(LOCALE_PREFIX)
  if (!match) return pathname

  const remainder = pathname.slice(match[0].length)
  if (!remainder) return "/"
  return remainder.startsWith("/") ? remainder : `/${remainder}`
}

export function buildLocalizedPath(locale: Locale, path = "/"): string {
  const normalizedPath = path === "" ? "/" : path
  if (normalizedPath === "/") return `/${locale}`
  return `/${locale}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
}

export function switchLocalePathname(pathname: string, locale: Locale): string {
  const normalizedPath = stripLocalePrefix(pathname)
  if (normalizedPath === "/") return `/${locale}`
  return `/${locale}${normalizedPath}`
}

export function getHtmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en-US"
}

export function getOpenGraphLocale(locale: Locale): string {
  return locale === "zh" ? "zh_CN" : "en_US"
}

export function getHreflang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en-US"
}

export function parseAcceptLanguageLocale(headerValue: string | null | undefined): Locale | null {
  if (!headerValue) return null

  const normalized = headerValue.toLowerCase()
  if (normalized.includes("zh")) return "zh"
  if (normalized.includes("en")) return "en"
  return null
}
