"use client"

import { useCallback, useEffect, useState } from "react"

export type JoyfulTheme = "blue-white" | "black-gold" | "paper"

export const JOYFUL_THEME_STORAGE_KEY = "joyfulwords-theme"
const LEGACY_EDITOR_THEME_STORAGE_KEY = "joyfulwords-editor-theme"

export const JOYFUL_THEMES: JoyfulTheme[] = ["blue-white", "black-gold", "paper"]

export function isJoyfulTheme(value: string | null): value is JoyfulTheme {
  return value === "blue-white" || value === "black-gold" || value === "paper"
}

export function readStoredJoyfulTheme(): JoyfulTheme {
  if (typeof window === "undefined") return "blue-white"

  const storedTheme =
    window.localStorage.getItem(JOYFUL_THEME_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_EDITOR_THEME_STORAGE_KEY)

  return isJoyfulTheme(storedTheme) ? storedTheme : "blue-white"
}

export function applyJoyfulTheme(theme: JoyfulTheme) {
  if (typeof document === "undefined") return

  document.documentElement.dataset.joyfulTheme = theme
  document.documentElement.style.colorScheme = theme === "black-gold" ? "dark" : "light"
}

export function useJoyfulTheme() {
  const [theme, setThemeState] = useState<JoyfulTheme>(() => readStoredJoyfulTheme())

  useEffect(() => {
    const nextTheme = readStoredJoyfulTheme()
    setThemeState(nextTheme)
    applyJoyfulTheme(nextTheme)

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<JoyfulTheme>).detail
      if (isJoyfulTheme(nextTheme)) {
        setThemeState(nextTheme)
        applyJoyfulTheme(nextTheme)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === JOYFUL_THEME_STORAGE_KEY ||
        event.key === LEGACY_EDITOR_THEME_STORAGE_KEY
      ) {
        const nextTheme = readStoredJoyfulTheme()
        setThemeState(nextTheme)
        applyJoyfulTheme(nextTheme)
      }
    }

    window.addEventListener("joyfulwords-theme-change", handleThemeChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("joyfulwords-theme-change", handleThemeChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const setTheme = useCallback((nextTheme: JoyfulTheme) => {
    setThemeState(nextTheme)
    window.localStorage.setItem(JOYFUL_THEME_STORAGE_KEY, nextTheme)
    window.localStorage.setItem(LEGACY_EDITOR_THEME_STORAGE_KEY, nextTheme)
    applyJoyfulTheme(nextTheme)
    window.dispatchEvent(
      new CustomEvent<JoyfulTheme>("joyfulwords-theme-change", { detail: nextTheme })
    )
  }, [])

  return { theme, setTheme }
}
