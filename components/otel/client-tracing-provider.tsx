'use client'

import { useEffect } from 'react'
import { initClientTracing } from '@/lib/otel/client-instrumentation'

/**
 * Grafana Faro Client Telemetry Provider
 *
 * This component initializes browser RUM, Web Vitals, errors, and fetch tracing.
 * It should be rendered once in the root layout.
 *
 * Telemetry is only enabled when NEXT_PUBLIC_ENABLE_TELEMETRY is set to "true".
 */
export function OpenTelemetryProvider() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === 'true') {
      initClientTracing()
    }
  }, [])

  return null
}
