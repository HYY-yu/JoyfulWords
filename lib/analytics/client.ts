"use client"

import type {
  ProductAnalyticsEvent,
  ProductAnalyticsProperties,
} from "@/lib/analytics/events"

type PostHogClient = typeof import("posthog-js").default

type QueuedProductAnalyticsEvent = {
  event: ProductAnalyticsEvent
  properties: ProductAnalyticsProperties
}

const SENSITIVE_PROPERTY_KEYS = new Set([
  "email",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "content",
  "prompt",
  "article_content",
  "material_content",
])

const MAX_QUEUED_EVENTS = 100
const DEFAULT_FLUSH_WAIT_MS = 200

let posthogClient: PostHogClient | null = null
let initializePromise: Promise<boolean> | null = null
let isInitialized = false
let hasCaptureConsent = false
let baseProperties: ProductAnalyticsProperties = {}
let queuedEvents: QueuedProductAnalyticsEvent[] = []

function isProductAnalyticsEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PRODUCT_ANALYTICS === "true"
}

function hasProductAnalyticsConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
  )
}

function canQueueProductAnalyticsEvent() {
  return (
    typeof window !== "undefined" &&
    isProductAnalyticsEnabled() &&
    hasProductAnalyticsConfig() &&
    hasCaptureConsent
  )
}

function sanitizeProperties(
  properties: ProductAnalyticsProperties = {}
): ProductAnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (value === undefined) return false
      return !SENSITIVE_PROPERTY_KEYS.has(key.toLowerCase())
    })
  )
}

function captureProductEvent(
  event: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties = {},
  options?: {
    transport?: "XHR" | "fetch" | "sendBeacon"
    sendInstantly?: boolean
  }
) {
  if (!posthogClient || !isInitialized || !hasCaptureConsent) return

  posthogClient.capture(
    event,
    {
      ...baseProperties,
      ...sanitizeProperties(properties),
    },
    {
      transport: options?.transport,
      send_instantly: options?.sendInstantly,
    }
  )
}

function enqueueProductEvent(
  event: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties
) {
  if (!canQueueProductAnalyticsEvent()) return

  if (queuedEvents.length >= MAX_QUEUED_EVENTS) {
    queuedEvents.shift()
    if (process.env.NODE_ENV === "development") {
      console.warn("[ProductAnalytics] Dropped oldest queued event")
    }
  }

  queuedEvents.push({
    event,
    properties: sanitizeProperties(properties),
  })
}

function flushQueuedProductEvents() {
  if (!posthogClient || !isInitialized || !hasCaptureConsent) return
  if (queuedEvents.length === 0) return

  const eventsToFlush = queuedEvents
  queuedEvents = []

  for (const queuedEvent of eventsToFlush) {
    captureProductEvent(queuedEvent.event, queuedEvent.properties)
  }
}

export function setProductAnalyticsContext(
  properties: ProductAnalyticsProperties
) {
  baseProperties = {
    ...baseProperties,
    ...sanitizeProperties(properties),
  }

  if (posthogClient && isInitialized) {
    posthogClient.register(baseProperties)
  }
}

export async function initializeProductAnalytics(
  initialProperties: ProductAnalyticsProperties = {}
) {
  if (typeof window === "undefined") return false
  if (!isProductAnalyticsEnabled() || !hasProductAnalyticsConfig()) {
    queuedEvents = []
    return false
  }

  const token =
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!token || !apiHost) {
    queuedEvents = []
    return false
  }

  setProductAnalyticsContext(initialProperties)

  if (isInitialized) return true
  if (initializePromise) return initializePromise

  initializePromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(token, {
        api_host: apiHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,
        defaults: "2026-01-30",
        disable_session_recording:
          process.env.NEXT_PUBLIC_POSTHOG_ENABLE_REPLAY !== "true",
        session_recording: {
          maskAllInputs: true,
          maskTextSelector:
            "textarea, input, [contenteditable='true'], .ProseMirror, [data-sensitive='true']",
          blockSelector:
            "[data-ph-block='true'], [data-analytics-block='true'], .ph-no-capture",
        },
        loaded: (client) => {
          client.register(baseProperties)
        },
      })

      posthogClient = posthog
      isInitialized = true
      if (hasCaptureConsent) {
        posthog.opt_in_capturing()
      }
      flushQueuedProductEvents()

      if (process.env.NODE_ENV === "development") {
        console.debug("[ProductAnalytics] PostHog initialized", {
          apiHost,
          replay:
            process.env.NEXT_PUBLIC_POSTHOG_ENABLE_REPLAY === "true",
        })
      }

      return true
    })
    .catch((error) => {
      initializePromise = null
      console.error("[ProductAnalytics] Failed to initialize PostHog:", error)
      return false
    })

  return initializePromise
}

export function trackProductEvent(
  event: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties = {}
) {
  if (!posthogClient || !isInitialized || !hasCaptureConsent) {
    enqueueProductEvent(event, properties)
    return
  }

  captureProductEvent(event, properties)
}

export async function trackProductEventAndFlush(
  event: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties = {},
  timeoutMs = DEFAULT_FLUSH_WAIT_MS
) {
  if (!canQueueProductAnalyticsEvent()) return

  if (!isInitialized && initializePromise) {
    await Promise.race([
      initializePromise,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ])
  }

  if (posthogClient && isInitialized && hasCaptureConsent) {
    captureProductEvent(event, properties, {
      transport: "sendBeacon",
      sendInstantly: true,
    })
  } else {
    enqueueProductEvent(event, properties)
  }

  await new Promise((resolve) => setTimeout(resolve, timeoutMs))
}

export function identifyProductUser(
  userId: string | number,
  properties: ProductAnalyticsProperties = {}
) {
  if (!posthogClient || !isInitialized) return

  posthogClient.identify(String(userId), sanitizeProperties(properties))
}

export function resetProductUser() {
  if (!posthogClient || !isInitialized) return

  posthogClient.reset()
}

export function optOutProductAnalytics() {
  hasCaptureConsent = false
  queuedEvents = []
  if (!posthogClient || !isInitialized) return

  posthogClient.opt_out_capturing()
}

export function optInProductAnalytics() {
  hasCaptureConsent = true
  if (!posthogClient || !isInitialized) return

  posthogClient.opt_in_capturing()
  flushQueuedProductEvents()
}
