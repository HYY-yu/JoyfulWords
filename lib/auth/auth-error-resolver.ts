import type { ErrorResponse } from '@/lib/api/types'

export function isSignupEmailAlreadyRegisteredError(
  error: ErrorResponse
): boolean {
  return (
    error.status === 409 ||
    error.error === '该邮箱已注册' ||
    error.error === 'This email is already registered'
  )
}
