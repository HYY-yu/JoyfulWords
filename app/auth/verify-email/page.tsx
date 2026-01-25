"use client"

import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const { t } = useTranslation()

  return (
    <AuthCard>
      <div className="text-center space-y-4">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold">
          {t("auth.verifyEmailTitle")}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {t("auth.verifyEmailDescription")}
        </p>

        {/* Email Info */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">
            {t("auth.verifyEmailInstructions")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("auth.verifyEmailNote")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <Button asChild className="w-full" variant="outline">
            <Link href="/auth/login">{t("auth.backToLogin")}</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}
