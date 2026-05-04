import { registerOTel } from '@vercel/otel'
import { API_BASE_URL } from '@/lib/config'

function parsePatterns(value: string | undefined): Array<string | RegExp> {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getServerTracePropagationUrls(): Array<string | RegExp> {
  return [
    ...parsePatterns(process.env.OTEL_PROPAGATE_TRACE_URLS),
    API_BASE_URL,
    /^https?:\/\/localhost(?::\d+)?/,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?/,
  ]
}

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'joyful-words-frontend',
    attributes: {
      'service.namespace': process.env.OTEL_SERVICE_NAMESPACE || 'joyfulwords',
    },
    propagators: ['auto'],
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: getServerTracePropagationUrls(),
      },
    },
  })
}
