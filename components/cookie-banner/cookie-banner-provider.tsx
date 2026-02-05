"use client"

import { useEffect, useState, useRef } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import type { SilktideConfig } from "./types"
import { BANNER_SUFFIX } from "./types"

/**
 * CookieBannerProvider - Silktide Cookie Banner 包装组件
 *
 * 功能:
 * - 动态加载 Silktide 脚本和样式（确保全局只加载一次）
 * - 将 i18n 翻译转换为 Silktide 配置
 * - 监听语言切换,动态更新配置
 * - 处理组件卸载和清理
 *
 * 位置: 仅在 AuthCard (登录/注册页) 中使用
 */
export function CookieBannerProvider() {
  const { t, locale } = useTranslation()
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 加载 Silktide 脚本和样式
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_COOKIE_BANNER !== "true") {
      return
    }

    // 检查是否已经加载过脚本（全局检查）
    if (window.silktideCookieBannerManager || isScriptLoaded) {
      setIsScriptLoaded(true)
      return
    }

    const cleanup = loadSilktideAssets()
    cleanupRef.current = cleanup

    // 轮询检查脚本是否加载完成
    const checkInterval = setInterval(() => {
      if (window.silktideCookieBannerManager) {
        setIsScriptLoaded(true)
        clearInterval(checkInterval)
      }
    }, 100)

    return () => {
      clearInterval(checkInterval)
      // 注意：不执行 cleanup，因为脚本需要保留在全局
      // 这样即使用户在页面间切换，脚本也不会重复加载
    }
  }, [])

  // 初始化/更新配置 (脚本加载完成或语言切换时)
  useEffect(() => {
    if (!isScriptLoaded || !window.silktideCookieBannerManager) {
      return
    }

    const config = buildSilktideConfig(t)

    try {
      window.silktideCookieBannerManager.updateCookieBannerConfig(config)
      console.debug("[Cookie Banner] Configuration updated", { locale })
    } catch (error) {
      console.error("[Cookie Banner] Failed to update configuration:", error)
    }
  }, [isScriptLoaded, locale, t])

  return null
}

/**
 * 动态加载 Silktide CSS 和 JS 文件
 * 确保每个资源只被加载一次
 *
 * @returns 清理函数,用于移除添加的 DOM 元素
 */
function loadSilktideAssets() {
  try {
    // 检查是否已经加载过这些资源
    const existingCss = document.querySelector('link[data-silktide-cookie-banner]')
    const existingScript = document.querySelector('script[data-silktide-cookie-banner]')

    // 如果已经加载过，直接返回空清理函数
    if (existingCss && existingScript) {
      console.debug("[Cookie Banner] Assets already loaded, skipping...")
      return () => {}
    }

    // 加载 CSS
    if (!existingCss) {
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "/components/cookie-banner/silktide-consent-manager.css"
      cssLink.dataset.silktideCookieBanner = ""
      document.head.appendChild(cssLink)
    }

    // 加载 JS
    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "/components/cookie-banner/silktide-consent-manager.js"
      script.dataset.silktideCookieBanner = ""
      document.head.appendChild(script)
    }

    console.debug("[Cookie Banner] Assets loaded")

    // 返回空的清理函数（保留脚本在全局）
    return () => {
      // 不清理，因为脚本需要在全局保持活跃
      // 这样可以避免用户在页面间切换时重复加载
    }
  } catch (error) {
    console.error("[Cookie Banner] Failed to load assets:", error)
    return () => {}
  }
}

/**
 * 构建 Silktide 配置对象
 * 将 i18n 翻译传递给 Silktide
 *
 * @param t - i18n 翻译函数
 * @returns Silktide 配置对象
 */
function buildSilktideConfig(t: (key: string) => string): SilktideConfig {
  return {
    background: {
      showBackground: true,
    },
    cookieIcon: {
      position: "bottomLeft",
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
          // @tracking: cookie_consent_analytics_accepted
        },
        onReject: () => {
          console.debug("[Cookie Banner] Analytics cookies rejected")
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
