"use client"

import { CheckIcon, MoonStarIcon, PaletteIcon, SparklesIcon, SunMediumIcon } from "lucide-react"

import { Button } from "@/components/ui/base/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/base/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/base/tooltip"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import { type JoyfulTheme, useJoyfulTheme } from "@/lib/theme/joyful-theme"

interface JoyfulThemeSwitcherProps {
  variant?: "icon" | "compact"
  className?: string
}

const THEME_OPTIONS: Array<{
  value: JoyfulTheme
  labelKey: "blueWhite" | "blackGold" | "paper"
  descriptionKey: "blueWhiteDesc" | "blackGoldDesc" | "paperDesc"
  Icon: typeof SunMediumIcon
  swatchClassName: string
  previewClassName: string
}> = [
  {
    value: "blue-white",
    labelKey: "blueWhite",
    descriptionKey: "blueWhiteDesc",
    Icon: SunMediumIcon,
    swatchClassName: "bg-[#2563eb]",
    previewClassName: "from-[#f8fbff] via-[#dbeafe] to-[#2563eb]",
  },
  {
    value: "black-gold",
    labelKey: "blackGold",
    descriptionKey: "blackGoldDesc",
    Icon: MoonStarIcon,
    swatchClassName: "bg-[#d6a84f]",
    previewClassName: "from-[#0f0d0a] via-[#282014] to-[#d6a84f]",
  },
  {
    value: "paper",
    labelKey: "paper",
    descriptionKey: "paperDesc",
    Icon: SparklesIcon,
    swatchClassName: "bg-[#007f6d]",
    previewClassName: "from-[#fffdf7] via-[#f1e6d3] to-[#007f6d]",
  },
]

export function JoyfulThemeSwitcher({
  variant = "compact",
  className,
}: JoyfulThemeSwitcherProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useJoyfulTheme()
  const activeTheme = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0]

  const trigger = (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "sm"}
      className={cn(
        "jw-theme-trigger rounded-full text-[var(--jw-muted)] hover:bg-[var(--jw-accent-soft)] hover:text-[var(--jw-accent)]",
        variant === "icon" ? "h-9 w-9" : "h-9 gap-2 px-3",
        className
      )}
    >
      <PaletteIcon className="h-4 w-4" />
      {variant === "compact" ? (
        <>
          <span className="text-sm">
            {t(`common.themeSwitcher.${activeTheme.labelKey}` as any)}
          </span>
          <span className={cn("h-2.5 w-2.5 rounded-full", activeTheme.swatchClassName)} />
        </>
      ) : null}
    </Button>
  )

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="jw-theme-menu w-[320px] rounded-2xl border p-2 shadow-[0_26px_70px_-42px_rgba(18,15,10,0.72)]"
        >
          <div className="px-3 pb-2 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--jw-heading)]">
              <PaletteIcon className="h-4 w-4 text-[var(--jw-accent)]" />
              {t("common.themeSwitcher.title")}
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--jw-muted)]">
              {t("common.themeSwitcher.subtitle")}
            </p>
          </div>

          <div className="space-y-1.5">
            {THEME_OPTIONS.map((option) => {
              const isActive = option.value === theme
              const Icon = option.Icon

              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => setTheme(option.value)}
                  className="group block cursor-pointer rounded-xl p-0 focus:bg-transparent"
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 transition-all",
                      isActive
                        ? "border-[var(--jw-accent)] bg-[var(--jw-accent-soft)]"
                        : "border-transparent hover:border-[var(--jw-border)] hover:bg-[var(--jw-surface-muted)]"
                    )}
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--jw-border)] bg-gradient-to-br shadow-inner">
                      <div className={cn("absolute inset-0 bg-gradient-to-br", option.previewClassName)} />
                      <div className="absolute bottom-1.5 left-1.5 h-1.5 w-8 rounded-full bg-white/70" />
                      <div className="absolute bottom-4 left-1.5 h-1.5 w-11 rounded-full bg-white/55" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            isActive
                              ? "bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)]"
                              : "bg-[var(--jw-surface)] text-[var(--jw-accent)]"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium text-[var(--jw-heading)]">
                          {t(`common.themeSwitcher.${option.labelKey}` as any)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--jw-muted)]">
                        {t(`common.themeSwitcher.${option.descriptionKey}` as any)}
                      </p>
                    </div>

                    {isActive ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--jw-accent)] text-[var(--jw-accent-foreground)]">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>
        <span>{t("common.themeSwitcher.tooltip")}</span>
      </TooltipContent>
    </Tooltip>
  )
}
