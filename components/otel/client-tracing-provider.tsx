'use client'

import { useEffect } from 'react'
import { initClientTracing } from '@/lib/otel/client-instrumentation'

/**
 * OpenTelemetry Client Tracing Provider
 *
 * This component initializes client-side OpenTelemetry tracing.
 * It should be rendered once in the root layout to enable browser tracing.
 *
 * Tracing is only enabled when:
 * - Running in browser environment (not SSR)
 * - NEXT_PUBLIC_ENABLE_TELEMETRY is set to 'true'
 */
export function OpenTelemetryProvider() {
  useEffect(() => {
    // Check if telemetry is explicitly enabled
    if (process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === 'true') {
      initClientTracing()
    }
  }, [])

  // This component doesn't render anything
  return null
}
