"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { zh } from "./locales/zh"
import { en } from "./locales/en"
import { DEFAULT_LOCALE, getLocaleFromPathname, getHtmlLang } from "./route-locale"
import { LOCALE_COOKIE_NAME, type Locale } from "./shared"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, any>) => any
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const dictionaries = { zh, en }

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function persistLocalePreference(newLocale: Locale) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem("locale", newLocale)
  document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.lang = getHtmlLang(newLocale)
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const pathname = usePathname()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const routeLocale = getLocaleFromPathname(pathname)
    if (routeLocale && routeLocale !== locale) {
      setLocaleState(routeLocale)
    }
  }, [locale, pathname])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    persistLocalePreference(newLocale)
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = getHtmlLang(locale)
    }
  }, [locale])

  const t = (key: string, params?: Record<string, any>): any => {
    const keys = key.split(".")
    let value: any = dictionaries[locale]

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k]
      } else {
        let fallback: any = dictionaries.zh
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk]
          } else {
            return key
          }
        }
        return fallback
      }
    }

    if (params && typeof value === "string") {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match
      })
    }

    return value !== undefined ? value : key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider")
  }
  return context
}
