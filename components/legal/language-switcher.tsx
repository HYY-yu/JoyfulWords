"use client"

import { usePathname, useRouter } from "next/navigation"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { switchLocalePathname } from "@/lib/i18n/route-locale"
import { cn } from "@/lib/utils"

/**
 * LanguageSwitcher Component
 *
 * Reusable language switcher for legal document pages.
 * Provides toggle between Chinese (ZH) and English (EN) with visual feedback.
 *
 * Used in:
 * - /app/cookie-policy/page.tsx
 * - /app/terms-of-use/page.tsx
 * - /app/privacy-policy/page.tsx
 */
export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale, t } = useTranslation()

  const handleLocaleChange = (nextLocale: "zh" | "en") => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

  return (
    <div className="mt-6 flex justify-center">
      <div className="flex bg-accent/30 rounded-lg p-1 border border-border/50 shadow-sm">
        <button
          onClick={() => handleLocaleChange("zh")}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            locale === "zh"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
          aria-label="Switch to Chinese"
        >
          <span className="text-[10px] font-bold">ZH</span>
          <span className="hidden sm:inline">{t("common.zh")}</span>
        </button>
        <button
          onClick={() => handleLocaleChange("en")}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            locale === "en"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
          aria-label="Switch to English"
        >
          <span className="text-[10px] font-bold">EN</span>
          <span className="hidden sm:inline">{t("common.en")}</span>
        </button>
      </div>
    </div>
  )
}
