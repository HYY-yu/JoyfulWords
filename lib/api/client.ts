import { API_BASE_URL } from '@/lib/config'
import { trace, context } from '@opentelemetry/api'
import type { InsufficientCreditsData } from '@/components/credits/insufficient-credits-dialog'
import { tokenStore } from '@/lib/tokens/token-store'
import { shouldAttemptAuthRefresh } from '@/lib/auth/session-policy'
import type {
  LoginRequest,
  SignupRequestCode,
  SignupVerify,
  PasswordResetRequest,
  PasswordResetVerify,
  ChangePasswordRequest,
  GoogleLoginRequest,
  GoogleLoginResponse,
  AuthResponse,
  MessageResponse,
  ErrorResponse,
} from './types'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

function isInsufficientCreditsData(data: unknown): data is InsufficientCreditsData {
  if (!data || typeof data !== 'object') return false

  const candidate = data as Record<string, unknown>
  return (
    typeof candidate.current_credits === 'number' &&
    typeof candidate.required_credits === 'number' &&
    typeof candidate.shortage_credits === 'number' &&
    typeof candidate.recommended_recharge === 'number' &&
    typeof candidate.recommended_recharge_usd === 'string'
  )
}

/**
 * Get Accept-Language header based on browser locale
 */
export function getLanguageHeader(): string {
  if (typeof window === 'undefined') return 'en-US'

  const locale = localStorage.getItem('locale') || navigator.language || 'en-US'
  return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
}

/**
 * Inject OpenTelemetry trace headers for distributed tracing
 *
 * This function extracts the current trace context and injects it into
 * outgoing HTTP requests using the W3C Trace Context format.
 *
 * @returns Headers object with traceparent header if tracing is active
 */
function injectTraceHeaders(): HeadersInit {
  const headers: HeadersInit = {}

  try {
    // Get current trace context
    const currentContext = context.active()
    const span = trace.getSpan(currentContext)

    if (span) {
      const spanContext = span.spanContext()

      // Inject W3C traceparent header
      // Format: 00-{trace_id}-{span_id}-{trace_flags}
      if (spanContext.traceId && spanContext.spanId) {
        const traceParent = `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags || 1}`
        headers['traceparent'] = traceParent
      }
    }
  } catch (error) {
    // Silently fail if OpenTelemetry is not initialized
    // This prevents breaking the app when tracing is disabled
    console.debug('[Trace] Failed to inject trace headers:', error)
  }

  return headers
}

function mergeHeaders(...headerSets: Array<HeadersInit | undefined>): Headers {
  const mergedHeaders = new Headers()

  headerSets.forEach((headerSet) => {
    if (!headerSet) return

    const nextHeaders = new Headers(headerSet)
    nextHeaders.forEach((value, key) => {
      mergedHeaders.set(key, value)
    })
  })

  return mergedHeaders
}

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string | null): HeadersInit {
  const mergedHeaders = mergeHeaders(headers)

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  } else {
    mergedHeaders.delete('Authorization')
  }

  return mergedHeaders
}

/**
 * Make API request with error handling
 * @param endpoint - API endpoint path
 * @param options - Request options (supports signal for aborting requests)
 * @param skipAuthRefresh - If true, skip 401 auto-refresh (used by token refresh to avoid infinite loop)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRefresh = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = mergeHeaders(
    DEFAULT_HEADERS,
    { 'Accept-Language': getLanguageHeader() },
    injectTraceHeaders(), // Inject distributed tracing headers
    options.headers
  )
  const hasAuthorizationHeader = headers.has('Authorization')

  try {
    // 支持 AbortController signal
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal, // 传递 signal 以支持请求取消
    })

    const text = await response.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      console.error(`[API] Invalid JSON from ${endpoint}:`, text.slice(0, 200))
      return {
        error: `Server returned invalid response (status ${response.status})`,
        status: response.status,
      } as T
    }

    if (!response.ok) {
      // Only authenticated requests should enter the token refresh flow.
      if (
        response.status === 401 &&
        shouldAttemptAuthRefresh({
          endpoint,
          hasAuthorizationHeader,
          skipAuthRefresh,
        })
      ) {
        // Try to refresh the token
        const { refreshAccessToken } = await import('@/lib/tokens/refresh')
        const success = await refreshAccessToken()

        if (success) {
          // Retry the original request with new token
          const newToken = tokenStore.getAccessToken()
          const newHeaders = withAuthorizationHeader(headers, newToken)
          const retryResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
          })
          const retryData = await retryResponse.json()

          if (!retryResponse.ok) {
            return {
              error: retryData.error || retryData.message || 'Request failed',
              status: retryResponse.status,
            } as T
          }

          return retryData as T
        }

        // Refresh failed, redirect to login page
        if (typeof window !== 'undefined') {
          console.warn('[API] Authenticated request failed after refresh attempt', {
            endpoint,
            status: response.status,
          })
          window.location.href = '/auth/login?reason=token_expired'
        }
        return { error: 'Session expired', status: 401 } as T
      }

      // Handle 402 Payment Required - insufficient credits
      if (response.status === 402 && data?.data) {
        // 在客户端环境下触发积分不足弹窗
        if (typeof window !== 'undefined' && isInsufficientCreditsData(data.data)) {
          // 动态导入避免服务端渲染问题
          const { showInsufficientCreditsDialog } = await import(
            '@/lib/credits/insufficient-credits-dialog-handler'
          )
          showInsufficientCreditsDialog(data.data)
        } else if (typeof window !== 'undefined') {
          console.warn('[API] Invalid insufficient credits payload:', data.data)
          // TODO(observability): count invalid insufficient credits payloads from API responses.
        }
        return {
          error: data.error || 'Insufficient credits',
          status: response.status,
        } as T
      }

      // Return error in standard format
      return {
        error: data.error || data.message || 'Request failed',
        status: response.status,
      } as T
    }

    return data as T
  } catch (error) {
    // Network or parsing error
    return { error: error instanceof Error ? error.message : 'Network error' } as T
  }
}

export async function authenticatedApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRefresh = false
): Promise<T> {
  const accessToken = tokenStore.getAccessToken()

  return apiRequest<T>(
    endpoint,
    {
      ...options,
      headers: withAuthorizationHeader(options.headers, accessToken),
    },
    skipAuthRefresh
  )
}

/**
 * Browser API Client
 * Handles all authentication API calls from the browser
 */
export const apiClient = {
  /**
   * Login with email and password
   * POST /auth/login
   */
  async login(email: string, password: string) {
    return apiRequest<AuthResponse | ErrorResponse>('/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ email, password } as LoginRequest),
    })
  },

  /**
   * Request signup verification code
   * POST /auth/signup/request
   */
  async requestSignupCode(email: string) {
    return apiRequest<MessageResponse | ErrorResponse>('/auth/signup/request', {
      method: 'POST',
      body: JSON.stringify({ email } as SignupRequestCode),
    })
  },

  /**
   * Verify signup code and complete registration
   * POST /auth/signup/verify
   */
  async verifySignupCode(email: string, code: string, password: string) {
    return apiRequest<MessageResponse | ErrorResponse>('/auth/signup/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code, password } as SignupVerify),
    })
  },

  /**
   * Refresh access token
   * POST /auth/token/refresh
   */
  async refreshToken() {
    const token = tokenStore.getAccessToken()

    return apiRequest<AuthResponse | ErrorResponse>(
      '/auth/token/refresh',
      {
        method: 'POST',
        credentials: 'include',
        headers: withAuthorizationHeader(undefined, token),
      },
      true // Skip 401 auto-refresh to avoid infinite loop
    )
  },

  /**
   * Logout
   * POST /auth/logout
   */
  async logout() {
    const token = tokenStore.getAccessToken()

    return apiRequest<MessageResponse | ErrorResponse>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: withAuthorizationHeader(undefined, token),
    })
  },

  /**
   * Request password reset code
   * POST /auth/password/reset/request
   */
  async requestPasswordReset(email: string) {
    return apiRequest<MessageResponse | ErrorResponse>(
      '/auth/password/reset/request',
      {
        method: 'POST',
        body: JSON.stringify({ email } as PasswordResetRequest),
      }
    )
  },

  /**
   * Verify password reset code and reset password
   * POST /auth/password/reset/verify
   */
  async verifyPasswordReset(email: string, code: string, password: string) {
    return apiRequest<MessageResponse | ErrorResponse>(
      '/auth/password/reset/verify',
      {
        method: 'POST',
        body: JSON.stringify({ email, code, password } as PasswordResetVerify),
      }
    )
  },

  /**
   * Change password
   * POST /auth/change_password
   */
  async changePassword(oldPassword: string, newPassword: string) {
    return authenticatedApiRequest<MessageResponse | ErrorResponse>('/auth/change_password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      } as ChangePasswordRequest),
    })
  },

  /**
   * Get Google OAuth login URL
   * POST /auth/google/login
   */
  async googleLogin(redirectUrl?: string) {
    return apiRequest<GoogleLoginResponse | ErrorResponse>('/auth/google/login', {
      method: 'POST',
      body: JSON.stringify({ redirect_url: redirectUrl } as GoogleLoginRequest),
    })
  },
}
