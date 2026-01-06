import { registerOTel } from '@vercel/otel'

/**
 * OpenTelemetry Instrumentation
 *
 * This file is automatically loaded by Next.js to initialize OpenTelemetry tracing.
 * It enables distributed tracing for server-side rendering, API routes, and server actions.
 *
 * @see https://nextjs.org/docs/app/guides/open-telemetry
 */
export function register() {
  registerOTel({
    serviceName: 'joyful-words-frontend',
  })
}
