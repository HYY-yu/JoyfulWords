'use client'

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { API_BASE_URL } from '@/lib/config'

let isInitialized = false

function parsePatterns(value: string | undefined): Array<string | RegExp> {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return null
  }
}

function getTracePropagationUrls(): Array<string | RegExp> {
  const apiOrigin = getApiOrigin()

  return [
    ...parsePatterns(process.env.NEXT_PUBLIC_FARO_PROPAGATE_TRACE_URLS),
    ...(apiOrigin ? [apiOrigin] : []),
    /^https?:\/\/localhost(?::\d+)?/,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?/,
  ]
}

function getAppEnvironment(): string {
  return process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development'
}

function getAppVersion(): string {
  return (
    process.env.NEXT_PUBLIC_FARO_APP_VERSION ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    'development'
  )
}

/**
 * Initialize Grafana Faro browser telemetry and OpenTelemetry fetch tracing.
 */
export function initClientTracing() {
  if (isInitialized || typeof window === 'undefined' || faro.api) return

  const faroUrl = process.env.NEXT_PUBLIC_FARO_URL
  if (!faroUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Faro] NEXT_PUBLIC_FARO_URL is not configured; browser telemetry is disabled.')
    }
    return
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: process.env.NEXT_PUBLIC_FARO_APP_NAME || 'joyful-words-browser',
        namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || 'joyfulwords',
        version: getAppVersion(),
        environment: getAppEnvironment(),
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation({
          instrumentationOptions: {
            propagateTraceHeaderCorsUrls: getTracePropagationUrls(),
          },
        }),
      ],
    })

    isInitialized = true

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.info('[Faro] Browser telemetry initialized', {
        service: process.env.NEXT_PUBLIC_FARO_APP_NAME || 'joyful-words-browser',
        namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || 'joyfulwords',
        propagateTraceHeaderCorsUrls: getTracePropagationUrls().map((pattern) => pattern.toString()),
      })
    }
  } catch (error) {
    console.error('[Faro] Failed to initialize browser telemetry:', error)
  }
}
