"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics/cookie-consent"
import {
  getIdentifiedProductUserId,
  identifyProductUser,
  initializeProductAnalytics,
  optInProductAnalytics,
  optOutProductAnalytics,
  resetProductUser,
  setProductAnalyticsContext,
  trackProductEvent,
} from "@/lib/analytics/client"
import { PRODUCT_ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { shouldResetProductIdentity } from "@/lib/analytics/identity"

export function ProductAnalyticsProvider() {
  const { user, loading } = useAuth()
  const { locale } = useTranslation()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hasConsent, setHasConsent] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const routeSearch = searchParams?.toString() ?? ""
  const routePath = useMemo(() => {
    const currentPathname = pathname ?? ""
    return routeSearch ? `${currentPathname}?${routeSearch}` : currentPathname
  }, [pathname, routeSearch])

  useEffect(() => {
    setHasConsent(hasAnalyticsConsent())

    const handleConsentChanged = (event: Event) => {
      const accepted = (event as CustomEvent<{ accepted: boolean }>).detail
        ?.accepted
      setHasConsent(Boolean(accepted))
    }

    window.addEventListener(
      ANALYTICS_CONSENT_CHANGED_EVENT,
      handleConsentChanged
    )

    return () => {
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGED_EVENT,
        handleConsentChanged
      )
    }
  }, [])

  useEffect(() => {
    setProductAnalyticsContext({
      locale,
      is_authenticated: Boolean(user),
    })
  }, [locale, user])

  useEffect(() => {
    if (!hasConsent) {
      optOutProductAnalytics()
      setIsReady(false)
      return
    }

    optInProductAnalytics()
    void initializeProductAnalytics({
      locale,
      is_authenticated: Boolean(user),
    }).then((initialized) => {
      if (initialized) {
        optInProductAnalytics()
        setIsReady(true)
      }
    })
  }, [hasConsent, locale, user])

  useEffect(() => {
    if (!isReady || loading) return

    const authenticatedUserId = user ? String(user.id) : null
    const identifiedUserId = getIdentifiedProductUserId()

    if (
      shouldResetProductIdentity(identifiedUserId, authenticatedUserId)
    ) {
      resetProductUser()
    }

    if (user) {
      identifyProductUser(user.id, {
        locale,
      })
    }
  }, [isReady, loading, locale, user])

  useEffect(() => {
    if (!isReady || !routePath) return

    const currentUrl =
      typeof window === "undefined" ? routePath : window.location.href

    trackProductEvent(PRODUCT_ANALYTICS_EVENTS.PAGE_VIEWED, {
      path: pathname,
      search: routeSearch || null,
      url: currentUrl,
      referrer:
        typeof document === "undefined" ? null : document.referrer || null,
    })
  }, [isReady, pathname, routePath, routeSearch])

  return null
}
