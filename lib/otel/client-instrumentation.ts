'use client'

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { getDefaultOTELInstrumentations, TracingInstrumentation } from '@grafana/faro-web-tracing'
import { API_BASE_URL } from '@/lib/config'

let isInitialized = false

function parsePatterns(value: string | undefined): Array<string | RegExp> {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(urlPatternFromConfig)
}

function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return null
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getUrlPrefix(value: string): string | null {
  try {
    const url = new URL(value)
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '')

    return `${url.origin}${path}`
  } catch {
    return null
  }
}

function urlPatternFromConfig(value: string): string | RegExp {
  const prefix = getUrlPrefix(value)
  return prefix ? new RegExp(`^${escapeRegExp(prefix)}(?:[/?#]|$)`) : value
}

function getTraceAllowedPrefixes(): string[] {
  const configuredPrefixes = parsePatterns(process.env.NEXT_PUBLIC_FARO_PROPAGATE_TRACE_URLS)
    .filter((pattern): pattern is RegExp => pattern instanceof RegExp)
    .map((pattern) => pattern.source)

  const apiOrigin = getApiOrigin()
  const apiPrefix = apiOrigin ? getUrlPrefix(apiOrigin) : null
  const apiPattern = apiPrefix ? `^${escapeRegExp(apiPrefix)}(?:[/?#]|$)` : null

  return Array.from(new Set([...configuredPrefixes, ...(apiPattern ? [apiPattern] : [])]))
}

function getTracePropagationUrls(): Array<string | RegExp> {
  const apiOrigin = getApiOrigin()

  return [
    ...parsePatterns(process.env.NEXT_PUBLIC_FARO_PROPAGATE_TRACE_URLS),
    ...(apiOrigin ? [urlPatternFromConfig(apiOrigin)] : []),
    /^https?:\/\/localhost(?::\d+)?/,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?/,
  ]
}

function getTraceIgnoreUrls(): RegExp[] {
  const allowedPrefixes = getTraceAllowedPrefixes()

  if (allowedPrefixes.length === 0) {
    return []
  }

  return [new RegExp(`^(?!(?:${allowedPrefixes.join('|')})).*`)]
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
          instrumentations: getDefaultOTELInstrumentations({
            ignoreUrls: getTraceIgnoreUrls(),
            propagateTraceHeaderCorsUrls: getTracePropagationUrls(),
          }),
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
        traceIgnoreUrls: getTraceIgnoreUrls().map((pattern) => pattern.toString()),
      })
    }
  } catch (error) {
    console.error('[Faro] Failed to initialize browser telemetry:', error)
  }
}
