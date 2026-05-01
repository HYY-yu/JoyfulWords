"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Laptop,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base/card"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { useAuth } from "@/lib/auth/auth-context"
import { normalizeAuthRedirect } from "@/lib/auth/redirect"
import { agentOAuthClient, type AgentOAuthAuthorization, type AgentOAuthStatus } from "@/lib/api/agent-oauth/client"
import type { ErrorResponse } from "@/lib/api/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

function formatUserCode(value: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)
  if (normalized.length <= 4) {
    return normalized
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`
}

function isCompleteUserCode(value: string): boolean {
  return value.replace(/[^a-zA-Z0-9]/g, "").length === 8
}

function getErrorKey(error: ErrorResponse | null): string | null {
  if (!error) return null

  switch (error.reason) {
    case "invalid_user_code":
      return "auth.agentOAuth.errors.invalidUserCode"
    case "authorization_expired":
      return "auth.agentOAuth.errors.authorizationExpired"
    case "authorization_denied":
      return "auth.agentOAuth.errors.authorizationDenied"
    case "already_consumed":
      return "auth.agentOAuth.errors.alreadyConsumed"
    case "invalid_or_expired_token":
      return "auth.agentOAuth.errors.invalidOrExpiredToken"
    default:
      return null
  }
}

function isErrorResponse(result: AgentOAuthAuthorization | ErrorResponse): result is ErrorResponse {
  return "error" in result
}

function AgentOAuthContent() {
  const { user, loading: authLoading } = useAuth()
  const { t, locale } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryUserCode = searchParams.get("user_code")
  const [userCode, setUserCode] = useState(() => formatUserCode(queryUserCode ?? ""))
  const [authorization, setAuthorization] = useState<AgentOAuthAuthorization | null>(null)
  const [error, setError] = useState<ErrorResponse | null>(null)
  const [loadingAuthorization, setLoadingAuthorization] = useState(false)
  const [action, setAction] = useState<"approve" | "deny" | null>(null)

  const completeUserCode = useMemo(() => {
    return isCompleteUserCode(userCode) ? formatUserCode(userCode) : null
  }, [userCode])

  const returnPath = useMemo(() => {
    const params = new URLSearchParams()
    if (completeUserCode || queryUserCode) {
      params.set("user_code", completeUserCode ?? formatUserCode(queryUserCode ?? ""))
    }
    const query = params.toString()
    return query ? `/agent-oauth?${query}` : "/agent-oauth"
  }, [completeUserCode, queryUserCode])

  useEffect(() => {
    if (authLoading || user) {
      return
    }

    const params = new URLSearchParams({ redirect: normalizeAuthRedirect(returnPath) })
    router.replace(`/auth/login?${params.toString()}`)
  }, [authLoading, returnPath, router, user])

  useEffect(() => {
    const formattedQueryCode = formatUserCode(queryUserCode ?? "")
    if (formattedQueryCode) {
      setUserCode(formattedQueryCode)
    }
  }, [queryUserCode])

  const loadAuthorization = useCallback(async () => {
    if (!user || !completeUserCode) {
      setAuthorization(null)
      setError(null)
      return
    }

    setLoadingAuthorization(true)
    setError(null)

    const result = await agentOAuthClient.getAuthorization(completeUserCode)

    if (isErrorResponse(result)) {
      console.warn("[AgentOAuth] Failed to load authorization", {
        status: result.status,
        reason: result.reason,
        error: result.error,
      })
      setAuthorization(null)
      setError(result)
    } else {
      setAuthorization(result)
    }

    setLoadingAuthorization(false)
  }, [completeUserCode, user])

  useEffect(() => {
    void loadAuthorization()
  }, [loadAuthorization])

  const handleAction = async (nextAction: "approve" | "deny") => {
    if (!completeUserCode) {
      return
    }

    setAction(nextAction)
    setError(null)

    const result = nextAction === "approve"
      ? await agentOAuthClient.approveAuthorization(completeUserCode)
      : await agentOAuthClient.denyAuthorization(completeUserCode)

    if ("error" in result) {
      console.warn("[AgentOAuth] Authorization action failed", {
        action: nextAction,
        status: result.status,
        reason: result.reason,
        error: result.error,
      })
      setError(result)
    } else {
      setAuthorization((current) => current ? { ...current, status: result.status } : current)
    }

    setAction(null)
  }

  const expiresAt = authorization?.expires_at
    ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(authorization.expires_at))
    : null

  const status = authorization?.status
  const errorKey = getErrorKey(error)

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {t("auth.agentOAuth.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.agentOAuth.subtitle")}
          </p>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("auth.agentOAuth.authorizationRequest")}
            </CardTitle>
            <CardDescription>{t("auth.agentOAuth.authorizationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="agent-oauth-code">{t("auth.agentOAuth.codeLabel")}</Label>
              <Input
                id="agent-oauth-code"
                value={userCode}
                onChange={(event) => setUserCode(formatUserCode(event.target.value))}
                placeholder="ABCD-EFGH"
                className="font-mono text-lg tracking-wider"
                disabled={authLoading || loadingAuthorization || Boolean(action)}
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">{t("auth.agentOAuth.codeHint")}</p>
            </div>

            {authLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.agentOAuth.checkingLogin")}
              </div>
            )}

            {!completeUserCode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("auth.agentOAuth.enterCodeTitle")}</AlertTitle>
                <AlertDescription>{t("auth.agentOAuth.enterCodeDescription")}</AlertDescription>
              </Alert>
            )}

            {completeUserCode && loadingAuthorization && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.agentOAuth.loadingAuthorization")}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("auth.agentOAuth.errorTitle")}</AlertTitle>
                <AlertDescription>
                  {errorKey ? t(errorKey) : error.error}
                </AlertDescription>
              </Alert>
            )}

            {authorization && (
              <div className="space-y-5">
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{t("auth.agentOAuth.clientName")}</span>
                    <span className="font-medium">{authorization.client_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{t("auth.agentOAuth.deviceName")}</span>
                    <span className="flex items-center gap-2 font-medium">
                      <Laptop className="h-4 w-4" />
                      {authorization.device_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{t("auth.agentOAuth.expiresAt")}</span>
                    <span className="flex items-center gap-2 font-medium">
                      <Clock3 className="h-4 w-4" />
                      {expiresAt}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("auth.agentOAuth.permissions")}</div>
                  <div className="flex flex-wrap gap-2">
                    {authorization.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="font-mono">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{t("auth.agentOAuth.apiFullDescription")}</p>
                </div>

                <StatusMessage status={status} />

                {status === "pending" && (
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAction("deny")}
                      disabled={Boolean(action)}
                    >
                      {action === "deny" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("auth.agentOAuth.deny")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAction("approve")}
                      disabled={Boolean(action)}
                    >
                      {action === "approve" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      {t("auth.agentOAuth.authorizeClient", {
                        clientName: authorization.client_name,
                      })}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function StatusMessage({ status }: { status: AgentOAuthStatus | undefined }) {
  const { t } = useTranslation()
  if (!status || status === "pending") {
    return null
  }

  const statusConfig: Record<Exclude<AgentOAuthStatus, "pending">, { title: string; description: string; destructive?: boolean }> = {
    approved: {
      title: t("auth.agentOAuth.status.approvedTitle"),
      description: t("auth.agentOAuth.status.approvedDescription"),
    },
    denied: {
      title: t("auth.agentOAuth.status.deniedTitle"),
      description: t("auth.agentOAuth.status.deniedDescription"),
      destructive: true,
    },
    expired: {
      title: t("auth.agentOAuth.status.expiredTitle"),
      description: t("auth.agentOAuth.status.expiredDescription"),
      destructive: true,
    },
    consumed: {
      title: t("auth.agentOAuth.status.consumedTitle"),
      description: t("auth.agentOAuth.status.consumedDescription"),
    },
  }

  const config = statusConfig[status]

  return (
    <Alert variant={config.destructive ? "destructive" : "default"}>
      {config.destructive ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>{config.description}</AlertDescription>
    </Alert>
  )
}

export default function AgentOAuthPage() {
  return (
    <Suspense fallback={null}>
      <AgentOAuthContent />
    </Suspense>
  )
}
