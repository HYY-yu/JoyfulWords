'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { apiClient } from '@/lib/api/client'
import { setupTokenRefresh } from '@/lib/tokens/refresh'
import { tokenStore } from '@/lib/tokens/token-store'
import { isSignupEmailAlreadyRegisteredError } from '@/lib/auth/auth-error-resolver'
import { shouldAttemptSessionRestore } from '@/lib/auth/session-policy'
import type { User } from '@/lib/api/types'

const USER_STORAGE_KEY = 'auth_user'
const LEGACY_USER_STORAGE_KEY = 'user'
type SignupCodeRequestResult = 'code_sent' | 'redirect_to_login'

interface AuthContextType {
  user: User | null
  loading: boolean

  // Authentication methods
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: (redirectUrl?: string) => Promise<void>
  requestSignupCode: (email: string) => Promise<SignupCodeRequestResult>
  verifySignupCode: (email: string, code: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordReset: (email: string, code: string, password: string) => Promise<void>

  // Internal methods (for OAuth callback etc.)
  _setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseStoredUser(rawUser: string | null): User | null {
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as User
  } catch {
    return null
  }
}

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  const storedUser = parseStoredUser(localStorage.getItem(USER_STORAGE_KEY))
  if (storedUser) return storedUser

  const legacyUser = parseStoredUser(localStorage.getItem(LEGACY_USER_STORAGE_KEY))
  if (!legacyUser) {
    return null
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(legacyUser))
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY)

  console.info('[Auth] Migrated legacy user storage to auth_user')
  return legacyUser
}

function persistUser(user: User | null): void {
  if (typeof window === 'undefined') return

  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY)
    return
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const bootstrapStartedRef = useRef(false)

  const setAuthenticatedUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)
    persistUser(nextUser)
  }, [])

  useEffect(() => {
    if (bootstrapStartedRef.current) {
      return
    }

    bootstrapStartedRef.current = true

    let isCancelled = false

    const bootstrapAuth = async () => {
      const currentPathname = pathname || '/'
      const storedUser = readStoredUser()
      const accessToken = tokenStore.getAccessToken()
      const hasStoredUser = Boolean(storedUser)
      const hasAccessToken = Boolean(accessToken)

      if (storedUser && accessToken) {
        console.debug('[Auth] Hydrated session from local storage', {
          pathname: currentPathname,
        })

        if (!isCancelled) {
          setUser(storedUser)
          setLoading(false)
        }
        return
      }

      if (
        !shouldAttemptSessionRestore({
          pathname: currentPathname,
          hasStoredUser,
          hasAccessToken,
        })
      ) {
        console.debug('[Auth] Skipping session restore on public route', {
          pathname: currentPathname,
          hasStoredUser,
          hasAccessToken,
        })

        persistUser(null)
        if (!isCancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      console.info('[Auth] Attempting session restore from refresh cookie', {
        pathname: currentPathname,
        hasStoredUser,
        hasAccessToken,
      })

      const result = await apiClient.refreshToken()

      if (isCancelled) {
        return
      }

      if ('error' in result) {
        console.warn('[Auth] Session restore failed', {
          pathname: currentPathname,
          status: result.status,
          error: result.error,
        })

        tokenStore.clear('auth_bootstrap_restore_failed')
        setUser(null)
        setLoading(false)
        return
      }

      tokenStore.setAccessToken(result, 'auth_bootstrap_restore')
      setAuthenticatedUser(result.user)
      setLoading(false)

      console.info('[Auth] Session restored successfully', {
        pathname: currentPathname,
        userId: result.user.id,
      })
    }

    void bootstrapAuth()

    return () => {
      isCancelled = true
    }
  }, [pathname, setAuthenticatedUser])

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe((event) => {
      if (event.type !== 'token:cleared') return

      setAuthenticatedUser(null)
      setLoading(false)
    })

    return unsubscribe
  }, [setAuthenticatedUser])

  useEffect(() => {
    if (!user || !tokenStore.getAccessToken()) {
      return
    }

    const cleanupRefresh = setupTokenRefresh()
    return () => {
      cleanupRefresh()
    }
  }, [user])

  const signInWithEmail = async (email: string, password: string) => {
    const result = await apiClient.login(email, password)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('auth.toast.loginFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    tokenStore.setAccessToken(result, 'auth_login')
    setAuthenticatedUser(result.user)

    toast({
      title: t('auth.toast.loginSuccess'),
    })
  }

  const signInWithGoogle = async (redirectUrl?: string) => {
    const result = await apiClient.googleLogin(redirectUrl)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('auth.toast.googleLoginFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    sessionStorage.setItem('oauth_state', result.state)
    sessionStorage.setItem('oauth_redirect', redirectUrl || '/articles')
    window.location.href = result.auth_url
  }

  const requestSignupCode = async (email: string) => {
    const result = await apiClient.requestSignupCode(email)

    if ('error' in result) {
      console.warn('[Auth] Signup code request failed', {
        email,
        status: result.status,
        error: result.error,
      })

      if (isSignupEmailAlreadyRegisteredError(result)) {
        const searchParams = new URLSearchParams({
          email,
          notice: 'signup_email_registered',
        })

        router.push(`/auth/login?${searchParams.toString()}`)
        return 'redirect_to_login'
      }

      toast({
        variant: 'destructive',
        title: t('auth.toast.sendFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: t('auth.toast.verificationCodeSent'),
      description: t('auth.toast.checkYourEmail'),
    })

    return 'code_sent'
  }

  const verifySignupCode = async (email: string, code: string, password: string) => {
    const result = await apiClient.verifySignupCode(email, code, password)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('auth.toast.loginFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: t('auth.toast.signupSuccess'),
      description: t('auth.toast.pleaseLogin'),
    })
  }

  const signOut = async () => {
    try {
      await apiClient.logout()
    } finally {
      tokenStore.clear('auth_sign_out')
      setAuthenticatedUser(null)

      toast({
        title: t('auth.toast.logoutSuccess'),
      })

      router.push('/auth/login')
    }
  }

  const requestPasswordReset = async (email: string) => {
    const result = await apiClient.requestPasswordReset(email)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('auth.toast.sendFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: t('auth.toast.verificationCodeSent'),
      description: t('auth.toast.resetCodeSent'),
    })
  }

  const verifyPasswordReset = async (email: string, code: string, password: string) => {
    const result = await apiClient.verifyPasswordReset(email, code, password)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: t('auth.toast.resetFailed'),
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: t('auth.toast.passwordResetSuccess'),
      description: t('auth.toast.loginWithNewPassword'),
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signInWithGoogle,
        requestSignupCode,
        verifySignupCode,
        signOut,
        requestPasswordReset,
        verifyPasswordReset,
        _setUser: setAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
