import { API_BASE_URL } from '@/lib/config'
import { trace, context } from '@opentelemetry/api'
import type {
  LoginRequest,
  SignupRequestCode,
  SignupVerify,
  RefreshTokenRequest,
  LogoutRequest,
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

/**
 * Get Accept-Language header based on browser locale
 */
function getLanguageHeader(): string {
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

/**
 * Make API request with error handling
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @param skipAuthRefresh - If true, skip 401 auto-refresh (used by token refresh to avoid infinite loop)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRefresh = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    ...DEFAULT_HEADERS,
    'Accept-Language': getLanguageHeader(),
    ...injectTraceHeaders(), // Inject distributed tracing headers
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired
      if (response.status === 401 && !skipAuthRefresh) {
        // Try to refresh the token
        const { refreshAccessToken } = await import('@/lib/tokens/refresh')
        const success = await refreshAccessToken()

        if (success) {
          // Retry the original request with new token
          const newToken = localStorage.getItem('access_token')
          const newHeaders: HeadersInit = {
            ...headers,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
          })
          const retryData = await retryResponse.json()

          if (!retryResponse.ok) {
            return { error: retryData.error || retryData.message || 'Request failed' } as T
          }

          return retryData as T
        }

        // Refresh failed, redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?reason=token_expired'
        }
        return { error: 'Session expired' } as T
      }

      // Return error in standard format
      return { error: data.error || data.message || 'Request failed' } as T
    }

    return data as T
  } catch (error) {
    // Network or parsing error
    return { error: error instanceof Error ? error.message : 'Network error' } as T
  }
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
  async refreshToken(refreshToken: string) {
    const token = localStorage.getItem('access_token')

    return apiRequest<AuthResponse | ErrorResponse>(
      '/auth/token/refresh',
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ refresh_token: refreshToken } as RefreshTokenRequest),
      },
      true // Skip 401 auto-refresh to avoid infinite loop
    )
  },

  /**
   * Logout
   * POST /auth/logout
   */
  async logout(refreshToken: string) {
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse | ErrorResponse>('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ refresh_token: refreshToken } as LogoutRequest),
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
    const token = localStorage.getItem('access_token')

    return apiRequest<MessageResponse | ErrorResponse>('/auth/change_password', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
