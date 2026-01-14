'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { apiClient } from '@/lib/api/client'
import { TokenManager } from '@/lib/tokens/token-manager'
import { setupTokenRefresh } from '@/lib/tokens/refresh'
import type { User, Tokens } from '@/lib/api/types'

interface AuthContextType {
  user: User | null
  session: Tokens | null
  loading: boolean

  // Authentication methods
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: (redirectUrl?: string) => Promise<void>
  requestSignupCode: (email: string) => Promise<void>
  verifySignupCode: (email: string, code: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordReset: (email: string, code: string, password: string) => Promise<void>

  // Internal methods (for OAuth callback etc.)
  _setUser: (user: User) => void
  _setSession: (session: Tokens) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Tokens | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage on mount
    const tokens = TokenManager.getTokens()
    const storedUser = TokenManager.getUser()

    if (tokens && storedUser) {
      setUser(storedUser)
      setSession(tokens)
      setLoading(false)

      // Setup automatic token refresh
      const cleanupRefresh = setupTokenRefresh()

      return () => {
        cleanupRefresh()
      }
    }

    setLoading(false)
  }, [])

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

    // Store tokens
    TokenManager.setTokens(result as Tokens)
    setUser(result.user)
    setSession(result as Tokens)

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

    // Store state for callback verification
    sessionStorage.setItem('oauth_state', result.state)
    sessionStorage.setItem('oauth_redirect', redirectUrl || '/')

    // Redirect to Google authorization page
    window.location.href = result.auth_url
  }

  const requestSignupCode = async (email: string) => {
    const result = await apiClient.requestSignupCode(email)

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
      description: t('auth.toast.checkYourEmail'),
    })
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
    const refreshToken = TokenManager.getRefreshToken()

    if (refreshToken) {
      await apiClient.logout(refreshToken)
    }

    // Clear all tokens
    TokenManager.clearTokens()
    setUser(null)
    setSession(null)

    toast({
      title: t('auth.toast.logoutSuccess'),
    })

    // Redirect to login page
    router.push('/auth/login')
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
        session,
        loading,
        signInWithEmail,
        signInWithGoogle,
        requestSignupCode,
        verifySignupCode,
        signOut,
        requestPasswordReset,
        verifyPasswordReset,
        _setUser: setUser,
        _setSession: setSession,
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
