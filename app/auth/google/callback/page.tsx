'use client'

// 强制动态渲染,因为需要读取 URL 参数中的 OAuth code 和 state
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/i18n-context'
import { tokenStore } from '@/lib/tokens/token-store'
import { useAuth } from '@/lib/auth/auth-context'
import { API_BASE_URL } from '@/lib/config'
import {
  beginOAuthCallbackProcessing,
  clearOAuthCallbackProcessing,
  clearOAuthState,
  validateOAuthState,
} from '@/lib/auth/oauth-state'

function getOAuthErrorMessage(t: (key: string) => string, reason?: string, fallback?: string): string {
  switch (reason) {
    case 'state_expired':
      return t('auth.oauth.stateExpired')
    case 'state_missing':
    case 'missing':
      return t('auth.oauth.stateMissing')
    case 'state_processing':
      return t('auth.oauth.callbackInProgress')
    default:
      return fallback || t('auth.oauth.loginFailed')
  }
}

export default function GoogleCallbackPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { _setUser } = useAuth()
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
      let processingStarted = false
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')

        if (!code || !state) {
          throw new Error(t('auth.oauth.missingParams'))
        }

        const stateValidation = validateOAuthState(state)
        if (!stateValidation.ok) {
          throw new Error(getOAuthErrorMessage(t, stateValidation.reason))
        }

        if (!beginOAuthCallbackProcessing(state)) {
          console.warn('[GoogleOAuth] Callback already processing', { stateLength: state.length })
          return
        }
        processingStarted = true

        // The backend validates the server-side OAuth state, exchanges the code,
        // sets the refresh cookie, and returns the short-lived access token.
        const response = await fetch(`${API_BASE_URL}/auth/google/callback?code=${code}&state=${state}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          console.warn('[GoogleOAuth] Backend callback rejected', {
            status: response.status,
            reason: data.reason,
          })
          if (data.reason === 'state_expired' || data.reason === 'state_missing') {
            clearOAuthState(state)
          }
          throw new Error(getOAuthErrorMessage(t, data.reason, data.error))
        }

        // Store tokens
        const tokens = {
          access_token: data.access_token,
          expires_in: data.expires_in,
        }

        tokenStore.setAccessToken(tokens, 'google_oauth_callback')

        // Update AuthContext state immediately
        _setUser(data.user)

        // Resolve redirect target first
        const redirect = stateValidation.redirect

        clearOAuthState(state)

        setStatus('success')

        // Redirect to stored target or articles page
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
      } finally {
        const urlParams = new URLSearchParams(window.location.search)
        const state = urlParams.get('state')
        if (state && processingStarted) {
          clearOAuthCallbackProcessing(state)
        }
      }
    }

    handleCallback()
  }, [router, toast, t, _setUser])

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
