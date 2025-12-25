"use client"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { useTranslation } from "@/lib/i18n/i18n-context"

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <AuthCard
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
    >
      <LoginForm />
    </AuthCard>
  )
}
