"use client"

import Link from "next/link"

import { BrandLogo } from "@/components/brand/brand-logo"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath } from "@/lib/i18n/route-locale"

const columns = [
  {
    key: "product",
    links: [
      { key: "create", path: "/articles", localized: false },
      { key: "pricing", path: "/pricing", localized: true },
      { key: "mcp", path: "/mcp", localized: true },
    ],
  },
  {
    key: "resources",
    links: [
      { key: "blog", path: "/blog", localized: true },
      { key: "tools", path: "/tools", localized: true },
      { key: "fileConverter", path: "/file-converter", localized: true },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "privacy", path: "/privacy-policy", localized: true },
      { key: "terms", path: "/terms-of-use", localized: true },
      { key: "cookies", path: "/cookie-policy", localized: true },
    ],
  },
] as const

export function LandingFooter() {
  const { t, locale } = useTranslation()

  return (
    <footer className="border-t border-[var(--jw-border)] bg-[var(--jw-surface)] px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-[13px] leading-6 text-[var(--jw-muted)]">
              {t("landing.footer.description")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:contents">
            {columns.map((column) => (
              <nav key={column.key} aria-label={t(`landing.footer.${column.key}.title`)}>
                <h2 className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-[var(--jw-heading)] uppercase">
                  {t(`landing.footer.${column.key}.title`)}
                </h2>
                <ul className="space-y-2">
                  {column.links.map((link) => {
                    const href = link.localized
                      ? buildLocalizedPath(locale, link.path)
                      : link.path
                    return (
                      <li key={link.key}>
                        <Link
                          href={href}
                          prefetch={false}
                          className="text-xs leading-5 text-[var(--jw-muted)] transition-colors hover:text-[var(--jw-heading)] md:text-[13px]"
                        >
                          {t(`landing.footer.${column.key}.${link.key}`)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--jw-border-subtle)] pt-4 text-[11px] text-[var(--jw-muted)] md:mt-10 md:text-xs">
          {t("landing.footer.copyright")}
        </div>
      </div>
    </footer>
  )
}
