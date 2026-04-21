"use client"

import { Globe } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { switchLocalePathname } from "@/lib/i18n/route-locale"
import { cn } from "@/lib/utils"

export function BlogLanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale, t } = useTranslation()

  const handleLocaleChange = (nextLocale: "zh" | "en") => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-2 py-1 shadow-sm backdrop-blur">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{t("blog.common.localeLabel")}</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("zh")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          locale === "zh" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
        )}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          locale === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
    </div>
  )
}
