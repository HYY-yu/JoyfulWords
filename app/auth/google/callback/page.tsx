'use client'

// 强制动态渲染,因为需要读取 URL 参数中的 OAuth code 和 state
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { TokenManager } from '@/lib/tokens/token-manager'
import { useAuth } from '@/lib/auth/auth-context'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { _setUser, _setSession } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const isProcessed = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate processing
      if (isProcessed.current) {
        return
      }
      isProcessed.current = true
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')

        if (!code || !state) {
          throw new Error(t('auth.oauth.missingParams'))
        }

        // Verify state matches
        const storedState = sessionStorage.getItem('oauth_state')
        if (storedState !== state) {
          throw new Error(t('auth.oauth.stateVerificationFailed'))
        }

        // Get the redirect URL from backend
        // The backend has already processed the OAuth callback
        // We need to fetch the tokens from the backend response
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
        const response = await fetch(`${API_BASE_URL}/auth/google/callback?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || t('auth.oauth.loginFailed'))
        }

        // Store tokens
        const tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          user: data.user,
        }

        TokenManager.setTokens(tokens)

        // Update AuthContext state immediately
        _setUser(data.user)
        _setSession(tokens)

        // Clear session storage
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_redirect')

        setStatus('success')

        // Redirect to home page or stored redirect
        const redirect = sessionStorage.getItem('oauth_redirect') || '/'
        setTimeout(() => {
          router.push(redirect)
        }, 500)
      } catch (error: any) {
        console.error('Google OAuth callback error:', error)
        setStatus('error')
        setErrorMessage(error.message || t('auth.oauth.loginFailed'))
        toast({
          variant: 'destructive',
          title: t('auth.toast.googleLoginFailed'),
          description: error.message || t('auth.toast.pleaseTryAgain'),
        })

        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, toast, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-semibold">{t('auth.oauth.completingGoogleLogin')}</h2>
            <p className="text-muted-foreground">{t('auth.oauth.processingLoginInfo')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">{t('auth.oauth.loginSuccess')}</h2>
            <p className="text-muted-foreground">{t('auth.oauth.redirecting')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">{t('auth.oauth.loginFailedTitle')}</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">{t('auth.oauth.redirectingToLogin')}</p>
          </>
        )}
      </div>
    </div>
  )
}
