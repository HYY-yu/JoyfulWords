"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/legal/language-switcher"

export default function CookiePolicyPage() {
  const { t, locale, setLocale } = useTranslation()
  const [currentDate, setCurrentDate] = useState<string>("")

  // 在客户端挂载后设置日期,避免 Hydration 错误
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("cookiePolicy.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("cookiePolicy.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-muted-foreground leading-relaxed">
              {t("cookiePolicy.introduction")}
            </p>
          </section>

          {/* What are Cookies */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("cookiePolicy.whatAreCookies.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("cookiePolicy.whatAreCookies.description")}
            </p>
          </section>

          {/* Cookie Types */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {t("cookiePolicy.types.title")}
            </h2>

            {/* Necessary Cookies */}
            <div className="mb-6 p-4 bg-accent/30 rounded-lg border border-border/50">
              <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                  1
                </span>
                {t("cookiePolicy.types.necessary.name")}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                {t("cookiePolicy.types.necessary.description")}
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>{t("cookiePolicy.types.necessary.examples.0")}</li>
                <li>{t("cookiePolicy.types.necessary.examples.1")}</li>
                <li>{t("cookiePolicy.types.necessary.examples.2")}</li>
              </ul>
            </div>

            {/* Analytics Cookies */}
            <div className="mb-6 p-4 bg-accent/30 rounded-lg border border-border/50">
              <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                  2
                </span>
                {t("cookiePolicy.types.analytics.name")}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                {t("cookiePolicy.types.analytics.description")}
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>{t("cookiePolicy.types.analytics.examples.0")}</li>
                <li>{t("cookiePolicy.types.analytics.examples.1")}</li>
                <li>{t("cookiePolicy.types.analytics.examples.2")}</li>
              </ul>
            </div>
          </section>

          {/* How to Manage */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("cookiePolicy.howToManage.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("cookiePolicy.howToManage.description")}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {t("cookiePolicy.howToManage.browserSettings.title")}:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t("cookiePolicy.howToManage.browserSettings.chrome")}</li>
                <li>{t("cookiePolicy.howToManage.browserSettings.firefox")}</li>
                <li>{t("cookiePolicy.howToManage.browserSettings.safari")}</li>
                <li>{t("cookiePolicy.howToManage.browserSettings.edge")}</li>
              </ul>
            </div>
          </section>

          {/* Updates to Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("cookiePolicy.updates.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("cookiePolicy.updates.description")}
            </p>
          </section>

          {/* Contact */}
          <section className="p-4 bg-accent/30 rounded-lg border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("cookiePolicy.contact.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("cookiePolicy.contact.description")}
            </p>
            <a
              href={`mailto:${t("cookiePolicy.contact.email")}`}
              className="inline-block mt-3 text-primary hover:underline"
            >
              {t("cookiePolicy.contact.email")}
            </a>
          </section>

          {/* Last Updated */}
          <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground text-center">
            {t("cookiePolicy.lastUpdated")}: {currentDate}
          </div>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </div>
  )
}
