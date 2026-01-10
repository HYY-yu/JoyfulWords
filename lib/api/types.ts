// API Request Types
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequestCode {
  email: string
}

export interface SignupVerify {
  email: string
  code: string
  password: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetVerify {
  email: string
  code: string
  password: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface GoogleLoginRequest {
  redirect_url?: string
}

export interface GoogleLoginResponse {
  auth_url: string
  state: string
}

// API Response Types
export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface User {
  id: number
  email: string
}

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  error: string
}

export interface Tokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export type AuthResult = AuthResponse | MessageResponse
export type ApiError = ErrorResponse
