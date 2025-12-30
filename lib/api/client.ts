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
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
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

    return apiRequest<AuthResponse | ErrorResponse>('/auth/token/refresh', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ refresh_token: refreshToken } as RefreshTokenRequest),
    })
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
}
