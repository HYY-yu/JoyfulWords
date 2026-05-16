"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpenTextIcon,
  CheckSquareIcon,
  GlobeIcon,
  LogInIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { FeedbackErrorBoundary, TallyFeedbackButton } from "@/components/feedback"
import { ProfileDialog } from "@/components/auth/profile-dialog"
import { TaskCenterDialog } from "@/components/taskcenter/taskcenter-dialog"
import { ToolboxWorkbench } from "@/components/tools/toolbox-workbench"
import { Button } from "@/components/ui/base/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import { JoyfulThemeSwitcher } from "@/components/theme/joyful-theme-switcher"
import { useAuth } from "@/lib/auth/auth-context"
import { persistLocalePreference, useTranslation } from "@/lib/i18n/i18n-context"
import { buildLocalizedPath, switchLocalePathname } from "@/lib/i18n/route-locale"
import type { Locale } from "@/lib/i18n/shared"
import type { ToolSlug } from "@/lib/tools/catalog"
import { useState } from "react"

interface ToolsPageContentProps {
  selectedToolSlug?: ToolSlug
}

export function ToolsPageContent({ selectedToolSlug }: ToolsPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useTranslation()
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [taskCenterOpen, setTaskCenterOpen] = useState(false)

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return

    persistLocalePreference(nextLocale)
    router.replace(switchLocalePathname(pathname, nextLocale))
  }

  return (
    <div className="jw-app-shell min-h-screen">
      <header className="jw-app-header sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[2200px] items-center justify-between px-4 sm:px-6">
          <Link
            href={buildLocalizedPath(locale, "/tools")}
            className="rounded-xl transition-transform hover:-translate-y-0.5"
            aria-label="JoyfulWords"
          >
            <BrandLogo />
          </Link>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="jw-themed-link hidden h-8 rounded-full text-sm md:inline-flex">
              <Link href="/articles">
                <BookOpenTextIcon className="size-4 text-[var(--jw-accent)]" />
                {t("toolsPage.nav.workspace")}
              </Link>
            </Button>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="jw-themed-link h-8 gap-2 rounded-full text-sm"
                onClick={() => setTaskCenterOpen(true)}
              >
                <CheckSquareIcon className="size-4 text-[var(--jw-accent)]" />
                <span className="hidden sm:inline">{t("contentWriting.taskCenter.title")}</span>
              </Button>
            ) : null}

            <FeedbackErrorBoundary>
              <TallyFeedbackButton className="jw-themed-link hidden h-8 w-auto rounded-full py-0 text-sm sm:inline-flex" />
            </FeedbackErrorBoundary>

            <Button
              variant="ghost"
              size="sm"
              className="jw-themed-link h-8 gap-2 rounded-full text-sm"
              onClick={() => handleLocaleChange(locale === "zh" ? "en" : "zh")}
            >
              <GlobeIcon className="size-4 text-[var(--jw-accent)]" />
              <span className="hidden sm:inline">{locale === "zh" ? "English" : "中文"}</span>
            </Button>

            <JoyfulThemeSwitcher variant="compact" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="jw-themed-link rounded-full">
                    <UserCircleIcon className="!size-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{t("common.account")}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setProfileOpen(true)}>
                    <UserCircleIcon className="mr-2 size-4" />
                    {t("auth.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={() => signOut()}
                  >
                    <LogOutIcon className="mr-2 size-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="jw-primary-button h-8 rounded-full px-3">
                <Link href={`/auth/login?redirect=${encodeURIComponent(pathname || buildLocalizedPath(locale, "/tools"))}`}>
                  <LogInIcon className="size-4" />
                  {t("toolsPage.nav.login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[2200px] px-4 py-6 sm:px-6 lg:py-8">
        <ToolboxWorkbench selectedToolSlug={selectedToolSlug} />
      </main>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <TaskCenterDialog open={taskCenterOpen} onOpenChange={setTaskCenterOpen} />
    </div>
  )
}
