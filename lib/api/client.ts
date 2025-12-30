import { API_BASE_URL } from '@/lib/config'
import type {
  LoginRequest,
  SignupRequestCode,
  SignupVerify,
  RefreshTokenRequest,
  LogoutRequest,
  PasswordResetRequest,
  PasswordResetVerify,
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
  if (typeof window === 'undefined') return 'en'

  const locale = localStorage.getItem('locale') || navigator.language || 'en'
  return locale.startsWith('zh') ? 'zh-CN' : 'en'
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
}
