"use client"

import { Suspense } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { SignupForm } from "@/components/auth/signup-form"
import { useTranslation } from "@/lib/i18n/i18n-context"

export default function SignupPage() {
  const { t } = useTranslation()

  return (
    <AuthCard
      title={t("auth.createAccount")}
      subtitle={t("auth.signupSubtitle")}
    >
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthCard>
  )
}
