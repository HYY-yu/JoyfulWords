"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Server, ShieldCheck, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/base/alert"
import { Badge } from "@/components/ui/base/badge"
import { Button } from "@/components/ui/base/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base/card"
import { useAuth } from "@/lib/auth/auth-context"
import { normalizeAuthRedirect } from "@/lib/auth/redirect"
import {
  getMCPOAuthMissingFields,
  mcpOAuthClient,
  readMCPOAuthAuthorizationRequest,
  type MCPOAuthAuthorizationDetail,
} from "@/lib/api/mcp-oauth/client"
import type { ErrorResponse } from "@/lib/api/types"
import { useTranslation } from "@/lib/i18n/i18n-context"

const SCOPE_TRANSLATION_KEYS: Record<string, string> = {
  "article.read": "auth.mcpOAuth.scopes.articleRead",
  "article.create": "auth.mcpOAuth.scopes.articleCreate",
  "article.update": "auth.mcpOAuth.scopes.articleUpdate",
}

function isErrorResponse(result: MCPOAuthAuthorizationDetail | ErrorResponse): result is ErrorResponse {
  return "error" in result
}

function MCPOAuthAuthorizeContent() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authorization, setAuthorization] = useState<MCPOAuthAuthorizationDetail | null>(null)
  const [error, setError] = useState<ErrorResponse | null>(null)
  const [loadingAuthorization, setLoadingAuthorization] = useState(false)
  const [action, setAction] = useState<"approve" | "deny" | null>(null)

  const request = useMemo(() => {
    return readMCPOAuthAuthorizationRequest(searchParams)
  }, [searchParams])

  const missingFields = useMemo(() => getMCPOAuthMissingFields(request), [request])

  const returnPath = useMemo(() => {
    const query = searchParams.toString()
    return query ? `/oauth/authorize?${query}` : "/oauth/authorize"
  }, [searchParams])

  useEffect(() => {
    if (authLoading || user) {
      return
    }

    const params = new URLSearchParams({ redirect: normalizeAuthRedirect(returnPath) })
    router.replace(`/auth/login?${params.toString()}`)
  }, [authLoading, returnPath, router, user])

  const loadAuthorization = useCallback(async () => {
    if (!user || missingFields.length > 0) {
      setAuthorization(null)
      setError(null)
      return
    }

    setLoadingAuthorization(true)
    setError(null)

    const result = await mcpOAuthClient.getAuthorization(request)

    if (isErrorResponse(result)) {
      console.warn("[MCPOAuth] Failed to load authorization", {
        status: result.status,
        reason: result.reason,
        error: result.error,
        errorDescription: result.error_description,
      })
      setAuthorization(null)
      setError(result)
    } else {
      setAuthorization(result)
    }

    setLoadingAuthorization(false)
  }, [missingFields.length, request, user])

  useEffect(() => {
    void loadAuthorization()
  }, [loadAuthorization])

  const handleAction = async (nextAction: "approve" | "deny") => {
    if (missingFields.length > 0) {
      return
    }

    setAction(nextAction)
    setError(null)

    const result = nextAction === "approve"
      ? await mcpOAuthClient.approveAuthorization(request)
      : await mcpOAuthClient.denyAuthorization(request)

    if ("error" in result) {
      console.warn("[MCPOAuth] Authorization action failed", {
        action: nextAction,
        status: result.status,
        reason: result.reason,
        error: result.error,
        errorDescription: result.error_description,
      })
      setError(result)
      setAction(null)
      return
    }

    window.location.href = result.redirect_uri
  }

  const errorDescription = error?.error_description || error?.error

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {t("auth.mcpOAuth.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.mcpOAuth.subtitle")}
          </p>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("auth.mcpOAuth.authorizationRequest")}
            </CardTitle>
            <CardDescription>{t("auth.mcpOAuth.authorizationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {authLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.mcpOAuth.checkingLogin")}
              </div>
            )}

            {missingFields.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("auth.mcpOAuth.invalidRequestTitle")}</AlertTitle>
                <AlertDescription>
                  {t("auth.mcpOAuth.invalidRequestDescription", {
                    fields: missingFields.join(", "),
                  })}
                </AlertDescription>
              </Alert>
            )}

            {missingFields.length === 0 && loadingAuthorization && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.mcpOAuth.loadingAuthorization")}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("auth.mcpOAuth.errorTitle")}</AlertTitle>
                <AlertDescription>{errorDescription}</AlertDescription>
              </Alert>
            )}

            {authorization && (
              <div className="space-y-5">
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{t("auth.mcpOAuth.clientName")}</span>
                    <span className="font-medium">{authorization.client_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">{t("auth.mcpOAuth.resourceName")}</span>
                    <span className="flex items-center gap-2 font-medium">
                      <Server className="h-4 w-4" />
                      {authorization.resource_name}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">{t("auth.mcpOAuth.redirectUri")}</span>
                    <span className="break-all font-mono text-xs text-foreground">
                      {authorization.redirect_uri}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">{t("auth.mcpOAuth.permissions")}</div>
                  <div className="flex flex-wrap gap-2">
                    {authorization.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="font-mono">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {authorization.scopes.map((scope) => (
                      <p key={scope}>
                        {SCOPE_TRANSLATION_KEYS[scope]
                          ? t(SCOPE_TRANSLATION_KEYS[scope])
                          : t("auth.mcpOAuth.scopes.unknown", { scope })}
                      </p>
                    ))}
                  </div>
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertTitle>{t("auth.mcpOAuth.callbackTitle")}</AlertTitle>
                  <AlertDescription>{t("auth.mcpOAuth.callbackDescription")}</AlertDescription>
                </Alert>

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
                    {t("auth.mcpOAuth.deny")}
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
                    {t("auth.mcpOAuth.authorizeClient", {
                      clientName: authorization.client_name,
                    })}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function MCPOAuthAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <MCPOAuthAuthorizeContent />
    </Suspense>
  )
}
