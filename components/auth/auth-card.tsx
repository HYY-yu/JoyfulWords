"use client"

import { ReactNode } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"

interface AuthCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          {children}
        </div>

        {/* Language Switcher */}
        <div className="mt-6 flex justify-center">
          <div className="flex bg-accent/30 rounded-lg p-1 border border-border/50 shadow-sm">
            <button
              onClick={() => setLocale("zh")}
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
              onClick={() => setLocale("en")}
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

        {/* Cookie Banner (仅在认证页面显示) */}
        <CookieBannerProvider />
      </div>
    </div>
  )
}
