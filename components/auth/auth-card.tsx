"use client"

import { ReactNode } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { CookieBannerProvider } from "@/components/cookie-banner/cookie-banner-provider"
import Link from "next/link"

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
        {/* Brand Description */}
        <div className="relative mb-8">
          {/* Subtle glow effect - positioned first to be behind */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 rounded-2xl blur-xl -z-10 opacity-50" />

          {/* Main card with sophisticated shadow */}
          <div className="relative bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.24),0_2px_8px_rgba(0,0,0,0.12)] overflow-hidden">

            {/* Decorative top accent line */}
            <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

            {/* Subtle animated background mesh */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/15 to-transparent rounded-full blur-2xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Brand title with distinctive typography */}
              <div className="text-center mb-4">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
                  {t("auth.brand.title")}
                </h1>

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-3 my-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-border" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-border" />
                </div>
              </div>

              {/* Subtitle with refined spacing */}
              <p className="text-center text-sm font-medium text-muted-foreground mb-3 tracking-wide">
                {t("auth.brand.subtitle")}
              </p>

              {/* Features as elegant tags */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {t("auth.brand.features").split(",").map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-accent/50 text-accent-foreground border border-border/50 backdrop-blur-sm transition-all duration-300 hover:bg-accent hover:border-border hover:shadow-sm"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {feature.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Decorative bottom accent line */}
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-40" />
          </div>
        </div>

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

        {/* Legal Links */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link
            href="/terms-of-use"
            className="hover:text-foreground hover:underline transition-colors"
          >
            {t("legal.termsOfUse")}
          </Link>
          <span>•</span>
          <Link
            href="/privacy-policy"
            className="hover:text-foreground hover:underline transition-colors"
          >
            {t("legal.privacyPolicy")}
          </Link>
          <span>•</span>
          <Link
            href="/cookie-policy"
            className="hover:text-foreground hover:underline transition-colors"
          >
            {t("legal.cookiePolicy")}
          </Link>
        </div>

        {/* Cookie Banner (仅在认证页面显示) */}
        <CookieBannerProvider />
      </div>
    </div>
  )
}
