"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { LanguageSwitcher } from "@/components/legal/language-switcher"

/**
 * Terms & Conditions Page
 *
 * Route: /terms-of-use
 *
 * This page outlines the terms and conditions for using JoyfulWords services.
 * It covers user responsibilities, acceptable use, intellectual property, disclaimers, termination, and contact information.
 *
 * International users: This document is available in both Chinese and English.
 */
export default function TermsOfUsePage() {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState<string>("")

  // Set date on client side to avoid hydration errors
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("termsOfUse.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("termsOfUse.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.introduction")}
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.acceptance.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.acceptance.description")}
            </p>
          </section>

          {/* Services */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.services.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("termsOfUse.services.description")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>{t("termsOfUse.services.features.0")}</li>
              <li>{t("termsOfUse.services.features.1")}</li>
              <li>{t("termsOfUse.services.features.2")}</li>
              <li>{t("termsOfUse.services.features.3")}</li>
              <li>{t("termsOfUse.services.features.4")}</li>
              <li>{t("termsOfUse.services.features.5")}</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.responsibilities.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t("termsOfUse.responsibilities.description")}
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>{t("termsOfUse.responsibilities.items.0")}</li>
              <li>{t("termsOfUse.responsibilities.items.1")}</li>
              <li>{t("termsOfUse.responsibilities.items.2")}</li>
              <li>{t("termsOfUse.responsibilities.items.3")}</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.intellectualProperty.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.intellectualProperty.description")}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8 p-4 bg-accent/30 rounded-lg border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("termsOfUse.liability.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.liability.description")}
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.termination.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.termination.description")}
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.changes.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.changes.description")}
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("termsOfUse.governingLaw.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.governingLaw.description")}
            </p>
          </section>

          {/* Contact */}
          <section className="p-4 bg-accent/30 rounded-lg border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("termsOfUse.contact.title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("termsOfUse.contact.description")}
            </p>
            <a
              href={`mailto:${t("termsOfUse.contact.email")}`}
              className="inline-block mt-3 text-primary hover:underline"
            >
              {t("termsOfUse.contact.email")}
            </a>
          </section>

          {/* Last Updated */}
          <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground text-center">
            {t("termsOfUse.lastUpdated")}: {currentDate}
          </div>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </div>
  )
}
