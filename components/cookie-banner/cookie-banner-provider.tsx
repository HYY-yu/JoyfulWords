"use client"

import { useEffect, useState, useRef } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useAuth } from "@/lib/auth/auth-context"
import type { SilktideConfig } from "./types"
import { BANNER_SUFFIX } from "./types"
import { notifyAnalyticsConsentChanged } from "@/lib/analytics/cookie-consent"

const SILKTIDE_SCRIPT_SRC = "/components/cookie-banner/silktide-consent-manager.js?v=20260703-auth-menu-entry"

/**
 * CookieBannerProvider - Silktide Cookie Banner 包装组件
 *
 * 功能:
 * - 动态加载 Silktide 脚本（确保全局只加载一次）
 * - 将 i18n 翻译转换为 Silktide 配置
 * - 监听语言切换,动态更新配置
 * - 处理组件卸载和清理
 *
 * 位置: app/layout.tsx 全局使用
 */
export function CookieBannerProvider() {
  const { t, locale } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 加载 Silktide 脚本
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_COOKIE_BANNER !== "true") {
      return
    }

    // 检查是否已经加载过脚本（全局检查）
    if (window.silktideCookieBannerManager || isScriptLoaded) {
      setIsScriptLoaded(true)
      return
    }

    let cancelled = false
    const cleanup = loadSilktideAssets(() => {
      if (cancelled) return
      setIsScriptLoaded(true)
    })
    cleanupRef.current = cleanup

    return () => {
      cancelled = true
      cleanupRef.current?.()
      // 注意：只清理事件监听，不移除资源，因为脚本需要保留在全局。
      // 这样即使用户在页面间切换，脚本也不会重复加载
    }
  }, [isScriptLoaded])

  // 初始化/更新配置 (脚本加载完成或语言切换时)
  useEffect(() => {
    if (!isScriptLoaded || !window.silktideCookieBannerManager) {
      return
    }

    const config = buildSilktideConfig(t, {
      showCookieIcon: !authLoading && !user,
    })

    try {
      migrateLegacySilktideStorage()
      window.silktideCookieBannerManager.updateCookieBannerConfig(config)
      console.debug("[Cookie Banner] Configuration updated", { locale })
    } catch (error) {
      console.error("[Cookie Banner] Failed to update configuration:", error)
    }
  }, [authLoading, isScriptLoaded, locale, t, user])

  return null
}

/**
 * 动态加载 Silktide JS 文件
 * 确保每个资源只被加载一次
 *
 * @returns 清理函数,用于移除添加的 DOM 元素
 */
function loadSilktideAssets(onReady: () => void) {
  try {
    // 检查是否已经加载过这些资源
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-silktide-cookie-banner]')

    // 加载 JS
    const script =
      existingScript ??
      (() => {
        const script = document.createElement("script")
        script.src = SILKTIDE_SCRIPT_SRC
        script.dataset.silktideCookieBanner = ""
        script.defer = true
        document.head.appendChild(script)
        return script
      })()

    const cleanupListeners: Array<() => void> = []

    waitForSilktideScript(script, cleanupListeners)
      .then(() => {
        console.debug("[Cookie Banner] Script loaded")
        onReady()
      })
      .catch((error) => {
        console.error("[Cookie Banner] Failed to load script:", error)
      })

    // 返回事件监听清理函数（保留脚本在全局）
    return () => {
      cleanupListeners.forEach((cleanup) => cleanup())
      // 不清理，因为脚本需要在全局保持活跃
      // 这样可以避免用户在页面间切换时重复加载
    }
  } catch (error) {
    console.error("[Cookie Banner] Failed to load assets:", error)
    return () => {}
  }
}

function waitForSilktideScript(script: HTMLScriptElement, cleanupListeners: Array<() => void>) {
  if (window.silktideCookieBannerManager) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const handleLoad = () => resolve()
    const handleError = () => reject(new Error(`Failed to load script: ${script.src}`))

    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })
    cleanupListeners.push(() => {
      script.removeEventListener("load", handleLoad)
      script.removeEventListener("error", handleError)
    })
  })
}

function migrateLegacySilktideStorage() {
  const migrations = [
    ["silktideCookieBanner_InitialChoice__global", "silktideCookieBanner_InitialChoice_global"],
    ["silktideCookieChoice_necessary__global", "silktideCookieChoice_necessary_global"],
    ["silktideCookieChoice_analytics__global", "silktideCookieChoice_analytics_global"],
  ] as const

  for (const [legacyKey, currentKey] of migrations) {
    const legacyValue = localStorage.getItem(legacyKey)
    if (legacyValue === null || localStorage.getItem(currentKey) !== null) continue

    localStorage.setItem(currentKey, legacyValue)
    console.info("[Cookie Banner] Migrated legacy storage key", {
      legacyKey,
      currentKey,
    })
  }
}

/**
 * 构建 Silktide 配置对象
 * 将 i18n 翻译传递给 Silktide
 *
 * @param t - i18n 翻译函数
 * @returns Silktide 配置对象
 */
function buildSilktideConfig(
  t: (key: string) => string,
  options: { showCookieIcon: boolean },
): SilktideConfig {
  return {
    background: {
      showBackground: true,
    },
    cookieIcon: {
      position: "bottomLeft",
      visible: options.showCookieIcon,
    },
    bannerSuffix: BANNER_SUFFIX,
    cookieTypes: [
      {
        id: "necessary",
        name: t("cookieBanner.types.necessary.name"),
        description: t("cookieBanner.types.necessary.description"),
        required: true,
        defaultValue: true,
      },
      {
        id: "analytics",
        name: t("cookieBanner.types.analytics.name"),
        description: t("cookieBanner.types.analytics.description"),
        defaultValue: false,
        onAccept: () => {
          console.debug("[Cookie Banner] Analytics cookies accepted")
          notifyAnalyticsConsentChanged(true)
          // @tracking: cookie_consent_analytics_accepted
        },
        onReject: () => {
          console.debug("[Cookie Banner] Analytics cookies rejected")
          notifyAnalyticsConsentChanged(false)
          // @tracking: cookie_consent_analytics_rejected
        },
      },
    ],
    text: {
      banner: {
        description: t("cookieBanner.banner.description"),
        acceptAllButtonText: t("cookieBanner.banner.acceptAll"),
        acceptAllButtonAccessibleLabel: t("cookieBanner.banner.acceptAllLabel"),
        rejectNonEssentialButtonText: t("cookieBanner.banner.rejectNonEssential"),
        rejectNonEssentialButtonAccessibleLabel: t("cookieBanner.banner.rejectNonEssentialLabel"),
        preferencesButtonText: t("cookieBanner.banner.preferences"),
        preferencesButtonAccessibleLabel: t("cookieBanner.banner.preferencesLabel"),
      },
      preferences: {
        title: t("cookieBanner.preferences.title"),
        description: t("cookieBanner.preferences.description"),
        creditLinkText: t("cookieBanner.preferences.creditLink"),
        creditLinkAccessibleLabel: t("cookieBanner.preferences.creditLinkLabel"),
      },
    },
    onAcceptAll: () => {
      console.debug("[Cookie Banner] All cookies accepted")
      // @tracking: cookie_consent_all_accepted
    },
    onRejectAll: () => {
      console.debug("[Cookie Banner] Non-essential cookies rejected")
      // @tracking: cookie_consent_non_essential_rejected
    },
    onBackdropOpen: () => {
      console.debug("[Cookie Banner] Preferences modal opened")
      // @tracking: cookie_consent_preferences_opened
    },
  }
}
