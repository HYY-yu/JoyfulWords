"use client"

import { useMemo } from "react"
import { SearchIcon, ClockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PLATFORM_OPTIONS, URL_TYPES } from "@/lib/api/competitors/enums"
import { getAllowedUrlTypes } from "@/lib/api/competitors/utils"
import type { SocialPlatform, UrlType } from "@/lib/api/competitors/types"

interface CompetitorSearchBarProps {
  activePlatform: SocialPlatform
  setActivePlatform: (platform: SocialPlatform) => void
  profileUrl: string
  setProfileUrl: (url: string) => void
  urlType: UrlType
  setUrlType: (type: UrlType) => void
  searching: boolean
  onFetch: () => void
  onSchedule: () => void
  t: (key: string) => string
}

export function CompetitorSearchBar({
  activePlatform,
  setActivePlatform,
  profileUrl,
  setProfileUrl,
  urlType,
  setUrlType,
  searching,
  onFetch,
  onSchedule,
  t,
}: CompetitorSearchBarProps) {
  const currentPlatform = PLATFORM_OPTIONS.find((p) => p.value === activePlatform)!

  // 缓存允许的 URL 类型（性能优化）
  const allowedUrlTypes = useMemo(() => getAllowedUrlTypes(activePlatform), [activePlatform])

  // 检查每个 URL 类型是否被允许
  const isProfileAllowed = allowedUrlTypes.includes(URL_TYPES.PROFILE)
  const isPostAllowed = allowedUrlTypes.includes(URL_TYPES.POST)

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="space-y-4">
        {/* Platform Tabs */}
        <div className="flex gap-2">
          {PLATFORM_OPTIONS.map((platform) => (
            <button
              key={platform.value}
              onClick={() => {
                setActivePlatform(platform.value as SocialPlatform)
                setProfileUrl("")
              }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${
                  activePlatform === platform.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }
              `}
            >
              {platform.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="space-y-3">
          {/* URL Type Selection */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-foreground">{t("contentWriting.competitors.urlType.label")}:</span>
            <RadioGroup value={urlType} onValueChange={(value) => setUrlType(value as UrlType)} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="profile"
                  id="profile"
                  disabled={!isProfileAllowed}
                />
                <Label
                  htmlFor="profile"
                  className={cn(
                    "font-normal cursor-pointer",
                    !isProfileAllowed && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {t("contentWriting.competitors.urlType.profile")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="post"
                  id="post"
                  disabled={!isPostAllowed}
                />
                <Label
                  htmlFor="post"
                  className={cn(
                    "font-normal cursor-pointer",
                    !isPostAllowed && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {t("contentWriting.competitors.urlType.post")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder={currentPlatform.placeholder}
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onFetch()}
                className="h-11"
              />
            </div>
            <Button onClick={onFetch} disabled={!profileUrl.trim() || searching} className="h-11 px-6">
              <SearchIcon className="w-4 h-4 mr-2" />
              {t("contentWriting.competitors.crawlBtn")}
            </Button>
            <Button
              onClick={onSchedule}
              disabled={!profileUrl.trim() || urlType !== "profile"}
              variant="outline"
              className="h-11 px-6"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              {t("contentWriting.competitors.timerCrawlBtn")}
            </Button>
          </div>

          {/* Loading State */}
          {searching && (
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-md animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-primary font-medium">{t("contentWriting.competitors.aiSearching")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
