'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
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
  requestSignupCode: (email: string) => Promise<void>
  verifySignupCode: (email: string, code: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordReset: (email: string, code: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
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
        title: '登录失败',
        description: result.error,
      })
      throw new Error(result.error)
    }

    // Store tokens
    TokenManager.setTokens(result as Tokens)
    setUser(result.user)
    setSession(result as Tokens)

    toast({
      title: '登录成功',
    })
  }

  const requestSignupCode = async (email: string) => {
    const result = await apiClient.requestSignupCode(email)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: '验证码已发送',
      description: '请查收您的邮箱',
    })
  }

  const verifySignupCode = async (email: string, code: string, password: string) => {
    const result = await apiClient.verifySignupCode(email, code, password)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '注册失败',
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: '注册成功',
      description: '请使用您的邮箱和密码登录',
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
      title: '已退出登录',
    })

    // Redirect to login page
    router.push('/auth/login')
  }

  const requestPasswordReset = async (email: string) => {
    const result = await apiClient.requestPasswordReset(email)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: '验证码已发送',
      description: '如果该邮箱已注册，您将收到密码重置验证码',
    })
  }

  const verifyPasswordReset = async (email: string, code: string, password: string) => {
    const result = await apiClient.verifyPasswordReset(email, code, password)

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: '重置失败',
        description: result.error,
      })
      throw new Error(result.error)
    }

    toast({
      title: '密码重置成功',
      description: '请使用新密码登录',
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        requestSignupCode,
        verifySignupCode,
        signOut,
        requestPasswordReset,
        verifyPasswordReset,
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
