"use client"

import { useState } from "react"
import { ImageIcon, FileTextIcon, CreditCardIcon, SearchIcon, VideoIcon, UserCircleIcon, LogOutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/base/button"
import { ProfileDialog } from "@/components/auth/profile-dialog"
import { TallyFeedbackButton, FeedbackErrorBoundary } from "@/components/feedback"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t, locale, setLocale } = useTranslation()
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const menuItems = [
    {
      id: "image-generation",
      label: t("sidebar.imageGeneration"),
      icon: ImageIcon,
    },
    {
      id: "content-writing",
      label: t("sidebar.contentWriting"),
      icon: FileTextIcon,
    },
    {
      id: "knowledge-cards",
      label: t("sidebar.knowledgeCards"),
      icon: CreditCardIcon,
    },
    {
      id: "seo-geo",
      label: t("sidebar.seoGeo"),
      icon: SearchIcon,
    },
    {
      id: "video-editing",
      label: t("sidebar.videoEditing"),
      icon: VideoIcon,
    },
  ]

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col fixed left-0 top-0 h-screen z-20">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">{t("sidebar.title")}</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">{t("sidebar.subtitle")}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "text-sm font-medium",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {/* Feedback Button */}
        <FeedbackErrorBoundary>
          <TallyFeedbackButton />
        </FeedbackErrorBoundary>

        {/* Language Switcher */}
        <div className="flex bg-sidebar-accent/30 rounded-lg p-1">
          <button
            onClick={() => setLocale("zh")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
              locale === "zh" 
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            <span className="text-[10px]">ZH</span>
            {t("common.zh")}
          </button>
          <button
            onClick={() => setLocale("en")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
              locale === "en" 
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            <span className="text-[10px]">EN</span>
            {t("common.en")}
          </button>
        </div>

        {/* Account Management */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors justify-start"
            >
              <UserCircleIcon className="w-5 h-5 text-sidebar-foreground/60" />
              <span className="truncate">{user?.email || t("common.account")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{t("common.account")}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setProfileOpen(true)}
            >
              <UserCircleIcon className="mr-2 h-4 w-4" />
              {t("auth.profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onSelect={() => signOut()}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Version Info */}
        <div className="px-4 pt-2">
          <p className="text-[10px] text-sidebar-foreground/40 font-medium tracking-wider uppercase">
            {t("common.version")} 1.0.0
          </p>
        </div>
      </div>

      {/* Profile Dialog */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  )
}
