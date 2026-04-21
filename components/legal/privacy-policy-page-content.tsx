"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { LanguageSwitcher } from "@/components/legal/language-switcher"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"

export function PrivacyPolicyPageContent() {
  const { t, locale } = useTranslation()
  const [currentDate, setCurrentDate] = useState<string>("")

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US").format(new Date())
    )
  }, [locale])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("privacyPolicy.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("privacyPolicy.subtitle")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
          <section className="mb-8">
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.introduction")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.dataCollection.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("privacyPolicy.dataCollection.description")}
            </p>

            <div className="mb-4 p-4 bg-accent/30 rounded-lg border border-border/50">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("privacyPolicy.dataCollection.personalInfo.title")}
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>{t("privacyPolicy.dataCollection.personalInfo.items.0")}</li>
                <li>{t("privacyPolicy.dataCollection.personalInfo.items.1")}</li>
                <li>{t("privacyPolicy.dataCollection.personalInfo.items.2")}</li>
              </ul>
            </div>

            <div className="mb-4 p-4 bg-accent/30 rounded-lg border border-border/50">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("privacyPolicy.dataCollection.usageData.title")}
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>{t("privacyPolicy.dataCollection.usageData.items.0")}</li>
                <li>{t("privacyPolicy.dataCollection.usageData.items.1")}</li>
                <li>{t("privacyPolicy.dataCollection.usageData.items.2")}</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.dataUsage.title")}
            </h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
              <li>{t("privacyPolicy.dataUsage.purposes.0")}</li>
              <li>{t("privacyPolicy.dataUsage.purposes.1")}</li>
              <li>{t("privacyPolicy.dataUsage.purposes.2")}</li>
              <li>{t("privacyPolicy.dataUsage.purposes.3")}</li>
              <li>{t("privacyPolicy.dataUsage.purposes.4")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.dataSharing.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("privacyPolicy.dataSharing.description")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>{t("privacyPolicy.dataSharing.exceptions.0")}</li>
              <li>{t("privacyPolicy.dataSharing.exceptions.1")}</li>
              <li>{t("privacyPolicy.dataSharing.exceptions.2")}</li>
              <li>{t("privacyPolicy.dataSharing.exceptions.3")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.security.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.security.description")}
            </p>
          </section>

          <section className="mb-8 p-4 bg-accent/30 rounded-lg border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("privacyPolicy.rights.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("privacyPolicy.rights.description")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>{t("privacyPolicy.rights.items.0")}</li>
              <li>{t("privacyPolicy.rights.items.1")}</li>
              <li>{t("privacyPolicy.rights.items.2")}</li>
              <li>{t("privacyPolicy.rights.items.3")}</li>
              <li>{t("privacyPolicy.rights.items.4")}</li>
              <li>{t("privacyPolicy.rights.items.5")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.retention.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.retention.description")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.international.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.international.description")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.children.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.children.description")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.cookies.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.cookies.description")}{" "}
              <Link href={buildLocalizedPath(locale, "/cookie-policy")} className="text-primary hover:underline">
                {t("privacyPolicy.cookies.cookiePolicyLink")}
              </Link>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("privacyPolicy.changes.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.changes.description")}
            </p>
          </section>

          <section className="p-4 bg-accent/30 rounded-lg border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("privacyPolicy.contact.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacyPolicy.contact.description")}
            </p>
            <a
              href={`mailto:${t("privacyPolicy.contact.email")}`}
              className="inline-block mt-3 text-primary hover:underline"
            >
              {t("privacyPolicy.contact.email")}
            </a>
          </section>

          <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground text-center">
            {t("privacyPolicy.lastUpdated")}: {currentDate}
          </div>
        </div>

        <LanguageSwitcher />
      </div>
    </div>
  )
}
