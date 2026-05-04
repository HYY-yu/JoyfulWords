"use client"

import { BANNER_SUFFIX } from "@/components/cookie-banner/types"

export const ANALYTICS_COOKIE_TYPE_ID = "analytics"
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "joyfulwords:analytics-consent-changed"

export function getAnalyticsConsentStorageKey() {
  return `silktideCookieChoice_${ANALYTICS_COOKIE_TYPE_ID}${BANNER_SUFFIX}`
}

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false

  return localStorage.getItem(getAnalyticsConsentStorageKey()) === "true"
}

export function notifyAnalyticsConsentChanged(accepted: boolean) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_CHANGED_EVENT, {
      detail: { accepted },
    })
  )
}
