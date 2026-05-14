"use client"

import { Suspense, useEffect, useState } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { useTranslation } from "@/lib/i18n/i18n-context"

function LoginFormMountGate() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-9 rounded-md border border-border bg-muted/30" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-14 rounded bg-muted" />
          <div className="h-9 rounded-md border border-border bg-muted/30" />
        </div>
        <div className="h-9 rounded-md bg-muted" />
        <div className="h-9 rounded-md border border-border bg-muted/20" />
      </div>
    )
  }

  return <LoginForm />
}

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <AuthCard
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
    >
      <Suspense fallback={null}>
        <LoginFormMountGate />
      </Suspense>
    </AuthCard>
  )
}
