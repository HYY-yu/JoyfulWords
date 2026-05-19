"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileCode2Icon, Globe, MenuIcon, type LucideIcon } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"
import { Button } from "@/components/ui/base/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/base/sheet"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import { cn } from "@/lib/utils"

type LandingNavItem = "features" | "pricing" | "mcp" | "tools" | "fileConverter" | "blog"

interface LandingHeaderProps {
  activeItem?: LandingNavItem
  featuresHref?: string
}

export function LandingHeader({
  activeItem,
  featuresHref,
}: LandingHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const homeHref = buildLocalizedPath(locale)
  const navItems: Array<{
    key: LandingNavItem
    label: string
    href: string
    Icon?: LucideIcon
  }> = [
    {
      key: "features",
      label: t("landing.nav.features"),
      href: featuresHref ?? "#features",
    },
    {
      key: "pricing",
      label: t("landing.nav.pricing"),
      href: buildLocalizedPath(locale, "/pricing"),
    },
    {
      key: "mcp",
      label: t("landing.nav.mcp"),
      href: buildLocalizedPath(locale, "/mcp"),
    },
    {
      key: "tools",
      label: t("landing.nav.tools"),
      href: buildLocalizedPath(locale, "/tools"),
    },
    {
      key: "fileConverter",
      label: t("landing.nav.fileConverter"),
      href: buildLocalizedPath(locale, "/file-converter"),
      Icon: FileCode2Icon,
    },
    {
      key: "blog",
      label: t("landing.nav.blog"),
      href: buildLocalizedPath(locale, "/blog"),
    },
  ]

  const switchLocale = () => {
    const nextLocale = locale === "zh" ? "en" : "zh"

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname ?? "/", nextLocale))
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="jw-app-header fixed top-0 right-0 left-0 z-50 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-2xl sm:px-6 md:px-10">
      <Link href={homeHref} aria-label="JoyfulWords">
        <BrandLogo />
      </Link>
      <div className="flex-1" />

      <div className="hidden items-center gap-2 xl:flex">
        <JoyfulThemeSwitcher variant="compact" />
        <button
          type="button"
          onClick={switchLocale}
          className="jw-themed-link flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
        >
          <Globe className="h-4 w-4" />
          {locale === "zh" ? "EN" : "中文"}
        </button>

        {navItems.map((item) => {
          const isActive = activeItem === item.key
          const className = cn(
            "jw-themed-link rounded-full px-3.5 py-1.5 text-sm",
            isActive && "jw-themed-link-active"
          )

          if (item.href.startsWith("#")) {
            return (
              <a
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={className}
              >
                {item.label}
              </a>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              {item.label}
            </Link>
          )
        })}

        <Button variant="outline" size="sm" className="jw-secondary-button rounded-full shadow-sm" asChild>
          <Link href="/articles" prefetch={false}>
            {t("landing.nav.myArticles")}
          </Link>
        </Button>
        <Button size="sm" className="jw-primary-button rounded-full" asChild>
          <Link href="/articles" prefetch={false}>
            {t("landing.nav.startCreating")}
          </Link>
        </Button>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={t("landing.nav.menu")}
          >
            <MenuIcon className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="gap-0">
          <SheetHeader className="pb-2">
            <SheetTitle>{t("landing.nav.menu")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("landing.nav.menuDescription")}
            </SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4 pb-6">
            <div className="mb-2">
              <JoyfulThemeSwitcher variant="compact" className="w-full justify-between" />
            </div>
            <button
              type="button"
              onClick={() => {
                switchLocale()
                closeMobileMenu()
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {locale === "zh" ? "EN" : "中文"}
            </button>

            {navItems.map((item) => {
              const isActive = activeItem === item.key
              const Icon = item.Icon
              const className = cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-foreground",
                isActive &&
                  "bg-[var(--jw-accent-soft)] font-medium text-[var(--jw-heading)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-heading)]"
              )

              if (item.href.startsWith("#")) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeMobileMenu}
                    className={className}
                  >
                    {Icon ? <Icon className="size-4" /> : null}
                    {item.label}
                  </a>
                )
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMobileMenu}
                  className={className}
                >
                  {Icon ? <Icon className="size-4" /> : null}
                  {item.label}
                </Link>
              )
            })}

            <div className="my-2 h-px bg-border" />

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/articles" prefetch={false} onClick={closeMobileMenu}>
                {t("landing.nav.myArticles")}
              </Link>
            </Button>
            <Button className="w-full justify-start" asChild>
              <Link href="/articles" prefetch={false} onClick={closeMobileMenu}>
                {t("landing.nav.startCreating")}
              </Link>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
