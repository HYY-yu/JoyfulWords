'use client'

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { resourceFromAttributes } from '@opentelemetry/resources';

let isInitialized = false

/**
 * Initialize client-side OpenTelemetry tracing
 *
 * This function sets up browser-based tracing with:
 * - WebTracerProvider for browser spans
 * - ZoneContextManager for async context tracking
 * - FetchInstrumentation to trace all HTTP requests
 * - OTLP exporter to send traces to collector
 *
 * @see https://opentelemetry.io/docs/instrumentation/js/
 */
export function initClientTracing() {
  // Only initialize once and only in browser
  if (isInitialized || typeof window === 'undefined') return

  try {
    // Configure OTLP exporter
    // In development, sends directly to Jaeger
    // In production, can send to Next.js API route or external collector
    const exporterUrl = process.env.NEXT_PUBLIC_OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces'

    const exporter = new OTLPTraceExporter({
      url: exporterUrl,
    })

    // Create WebTracerProvider with span processor
    const provider = new WebTracerProvider({
      // Service name and other resource attributes
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'joyful-words-browser',
      }),
      // Add batch span processor for efficient export
      spanProcessors: [new BatchSpanProcessor(exporter)],
    })

    // Register provider with ZoneContextManager (required for async context)
    provider.register({
      contextManager: new ZoneContextManager(),
    })

    // Register automatic instrumentations
    registerInstrumentations({
      instrumentations: [
        // Automatically trace all fetch() calls
        new FetchInstrumentation({
          // List of URLs to propagate trace headers to
          // Supports regex patterns for flexible matching
          propagateTraceHeaderCorsUrls: [
            // Local development
            /http:\/\/localhost:\d+/,
            // Production API (update with your actual domain)
            // /https:\/\/api\.yourdomain\.com/,
          ],
          // Apply trace context to request headers
          clearTimingResources: true,
        }),
      ],
    })

    isInitialized = true

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[OpenTelemetry] Client tracing initialized', {
        service: 'joyful-words-browser',
        exporter: exporterUrl,
      })
    }
  } catch (error) {
    // Log error but don't break the app
    console.error('[OpenTelemetry] Failed to initialize client tracing:', error)
  }
}
