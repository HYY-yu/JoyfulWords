/**
 * Silktide Cookie Banner 配置类型定义
 */

export interface CookieTypeConfig {
  id: string
  name: string
  description: string
  required?: boolean
  defaultValue?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export interface BannerTextConfig {
  description: string
  acceptAllButtonText: string
  acceptAllButtonAccessibleLabel: string
  rejectNonEssentialButtonText: string
  rejectNonEssentialButtonAccessibleLabel: string
  preferencesButtonText: string
  preferencesButtonAccessibleLabel: string
}

export interface PreferencesTextConfig {
  title: string
  description: string
  creditLinkText: string
  creditLinkAccessibleLabel: string
}

export interface TextConfig {
  banner: BannerTextConfig
  preferences: PreferencesTextConfig
}

export interface SilktideConfig {
  background?: {
    showBackground: boolean
  }
  cookieIcon?: {
    position: "bottomLeft" | "bottomRight"
  }
  bannerSuffix?: string
  cookieTypes: CookieTypeConfig[]
  text: TextConfig
  onAcceptAll?: () => void
  onRejectAll?: () => void
  onBackdropOpen?: () => void
}

/**
 * window.silktideCookieBannerManager 接口扩展
 */
declare global {
  interface Window {
    silktideCookieBannerManager: {
      updateCookieBannerConfig: (config: SilktideConfig) => void
      initCookieBanner: () => void
      injectScript: (url: string, loadOption: "async" | "defer") => void
    }
  }
}

export const LOCAL_STORAGE_KEY_PREFIX = "silktideCookieChoice_"
export const BANNER_SUFFIX = "_auth"
