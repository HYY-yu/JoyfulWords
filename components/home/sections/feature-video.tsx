"use client"

import Image from "next/image"
import { Pause, Play } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useTranslation } from "@/lib/i18n/i18n-context"
import type { Locale } from "@/lib/i18n/shared"
import { trackProductEvent } from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { cn } from "@/lib/utils"

type LocalizedAsset = string | Record<Locale, string>
type LandingVideoAnalytics = "hero" | "feature" | false
type VideoPreload = "none" | "metadata" | "auto"

export interface FeatureVideoProps {
  /** Base path without the locale suffix or extension, for example `/videos/landing/feature-article`. */
  srcBase: LocalizedAsset
  /** Base poster path without the locale suffix or extension. */
  posterBase?: string
  /** Explicit poster URL, or one URL for each locale. Takes precedence over `posterBase`. */
  poster?: LocalizedAsset
  label: string
  chromeLabel?: string
  featureKey?: string
  preload?: VideoPreload
  fallback?: ReactNode
  analytics?: LandingVideoAnalytics
  className?: string
  stageClassName?: string
  /** Keep false until the corresponding MP4 has been shipped. The poster/fallback still renders. */
  enabled?: boolean
}

// 视频为无缝循环设计，开头约 0.4s 是接近纯色的过渡帧；越过该时间点才把视频层盖到海报上
const CONTENT_START_SECONDS = 0.45

function hasExtension(value: string, extension: string) {
  const path = value.split(/[?#]/, 1)[0]
  return path.toLowerCase().endsWith(extension)
}

function resolveBaseAsset(
  asset: LocalizedAsset,
  locale: Locale,
  extension: ".mp4" | ".jpg"
) {
  if (typeof asset !== "string") {
    const localizedAsset = asset[locale]
    return hasExtension(localizedAsset, extension)
      ? localizedAsset
      : `${localizedAsset}${extension}`
  }

  const localizedAsset = asset.replace("{locale}", locale)
  if (asset.includes("{locale}") || hasExtension(localizedAsset, extension)) {
    return hasExtension(localizedAsset, extension)
      ? localizedAsset
      : `${localizedAsset}${extension}`
  }

  return `${localizedAsset}-${locale}${extension}`
}

function resolveExplicitAsset(asset: LocalizedAsset, locale: Locale) {
  return typeof asset === "string"
    ? asset.replace("{locale}", locale)
    : asset[locale]
}

export function FeatureVideo({
  srcBase,
  posterBase,
  poster,
  label,
  chromeLabel,
  featureKey,
  preload = "none",
  fallback,
  analytics,
  className,
  stageClassName,
  enabled = true,
}: FeatureVideoProps) {
  const { locale } = useTranslation()
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasTrackedPlayRef = useRef(false)
  const [isInView, setIsInView] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasVideoError, setHasVideoError] = useState(false)
  const [hasPosterError, setHasPosterError] = useState(false)

  const videoSrc = useMemo(
    () => resolveBaseAsset(srcBase, locale, ".mp4"),
    [locale, srcBase]
  )
  const posterSrc = useMemo(() => {
    if (poster) return resolveExplicitAsset(poster, locale)
    if (posterBase) return resolveBaseAsset(posterBase, locale, ".jpg")
    return undefined
  }, [locale, poster, posterBase])
  const analyticsMode =
    analytics === undefined ? (featureKey ? "feature" : "hero") : analytics

  useEffect(() => {
    setIsReady(false)
    setIsPlaying(false)
    setHasVideoError(false)
    setHasPosterError(false)
    hasTrackedPlayRef.current = false
  }, [posterSrc, videoSrc])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updateMotionPreference()
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMotionPreference)
    } else {
      mediaQuery.addListener(updateMotionPreference)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updateMotionPreference)
      } else {
        mediaQuery.removeListener(updateMotionPreference)
      }
    }
  }, [])

  useEffect(() => {
    const updatePageVisibility = () => {
      setIsPageVisible(!document.hidden)
    }

    updatePageVisibility()
    document.addEventListener("visibilitychange", updatePageVisibility)
    return () => {
      document.removeEventListener("visibilitychange", updatePageVisibility)
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    if (!("IntersectionObserver" in window)) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.4)
      },
      { threshold: [0, 0.4] }
    )

    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const shouldAutoplay =
      enabled &&
      isInView &&
      isPageVisible &&
      !prefersReducedMotion &&
      !hasVideoError

    if (!shouldAutoplay) {
      video.pause()
      return
    }

    void video.play().catch(() => {
      setIsPlaying(false)
    })
  }, [enabled, hasVideoError, isInView, isPageVisible, prefersReducedMotion, videoSrc])

  const trackFirstPlay = useCallback(() => {
    if (hasTrackedPlayRef.current || analyticsMode === false) return

    hasTrackedPlayRef.current = true
    if (analyticsMode === "feature" && featureKey) {
      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_FEATURE_VIDEO_VIEWED, {
        feature_key: featureKey,
      })
      return
    }

    if (analyticsMode === "hero") {
      trackProductEvent(PRODUCT_ANALYTICS_EVENTS.LANDING_HERO_VIDEO_PLAYED)
    }
  }, [analyticsMode, featureKey])

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video || hasVideoError) return

    if (!video.paused) {
      video.pause()
      return
    }

    try {
      await video.play()
    } catch {
      setIsPlaying(false)
    }
  }, [hasVideoError])

  const fallbackContent = fallback ?? (
    posterSrc && !hasPosterError ? (
      <Image
        src={posterSrc}
        alt=""
        fill
        sizes="(max-width: 767px) 100vw, 50vw"
        className="object-cover"
        onError={() => setHasPosterError(true)}
      />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--jw-surface-muted)] px-6 text-center text-sm font-medium text-[var(--jw-muted)]">
        <Play
          aria-hidden="true"
          className="size-8 text-[var(--jw-accent)]"
          strokeWidth={1.75}
        />
        <span>{label}</span>
      </div>
    )
  )
  const playbackLabel = isPlaying
    ? locale === "zh"
      ? `暂停${label}`
      : `Pause ${label}`
    : locale === "zh"
      ? `播放${label}`
      : `Play ${label}`

  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]",
        className
      )}
      data-feature-key={featureKey}
      data-video-state={!enabled || hasVideoError ? "fallback" : isPlaying ? "playing" : "paused"}
    >
      <div className="flex h-9 min-w-0 items-center gap-1.5 border-b border-[var(--jw-border-subtle)] bg-[var(--jw-surface-muted)] px-3 sm:h-10 sm:px-3.5">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-[var(--jw-muted)] opacity-45"
        />
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full border border-[var(--jw-border)] bg-[var(--jw-accent-soft)]"
        />
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-[var(--jw-accent)] opacity-60"
        />
        <span className="ml-1.5 truncate font-mono text-[10px] text-[var(--jw-muted)] sm:text-[11px]">
          {chromeLabel ?? label}
        </span>
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative aspect-[16/10] overflow-hidden bg-[var(--jw-surface-muted)]",
          stageClassName
        )}
      >
        <div className="absolute inset-0">{fallbackContent}</div>

        {enabled ? (
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            aria-label={label}
            className={cn(
              "absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
              isReady && !hasVideoError ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            poster={posterSrc}
            preload={preload}
            muted
            loop
            playsInline
            onTimeUpdate={(event) => {
              // 视频首尾帧是接近纯色的过渡底（保证无缝循环），越过它再显示视频层，
              // 否则刚开始播放或暂停在开头时会露出一整块"空白"。
              if (event.currentTarget.currentTime >= CONTENT_START_SECONDS) {
                setIsReady(true)
              }
            }}
            onPlay={() => {
              setIsPlaying(true)
              trackFirstPlay()
            }}
            onPause={(event) => {
              setIsPlaying(false)
              if (event.currentTarget.currentTime < CONTENT_START_SECONDS) {
                setIsReady(false)
              }
            }}
            onError={() => {
              setHasVideoError(true)
              setIsReady(false)
              setIsPlaying(false)
            }}
          />
        ) : null}

        {enabled && !hasVideoError ? (
          <button
            type="button"
            onClick={() => void togglePlayback()}
            className={cn(
              "absolute z-20 grid place-items-center rounded-full border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] text-[var(--jw-accent)] shadow-[var(--jw-soft-shadow)] transition-[transform,background-color,opacity] duration-200 hover:bg-[var(--jw-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jw-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--jw-surface-strong)] active:scale-95 motion-reduce:transition-none",
              isPlaying
                ? "bottom-3 left-3 size-9 opacity-80 hover:opacity-100 focus-visible:opacity-100 sm:size-10"
                : "inset-0 m-auto size-12 sm:size-14"
            )}
            aria-label={playbackLabel}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="size-4 sm:size-5" fill="currentColor" />
            ) : (
              <Play
                aria-hidden="true"
                className="ml-0.5 size-5 sm:size-6"
                fill="currentColor"
              />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}
