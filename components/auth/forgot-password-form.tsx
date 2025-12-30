"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VerifyCodeForm } from "./verify-code-form"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { requestPasswordReset } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setStep("verify")
    } catch (error: any) {
      // Toast is already shown in the auth context
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySuccess = () => {
    // Redirect to login page after successful password reset
    window.location.href = "/auth/login?reset=success"
  }

  const handleBack = () => {
    setStep("email")
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="mb-2"
        >
          ← 返回
        </Button>
        <VerifyCodeForm
          mode="reset"
          email={email}
          onSuccess={handleVerifySuccess}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{t("auth.forgotPassword")}</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t("auth.forgotPasswordDescription")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          我们将向您的邮箱发送6位验证码
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        发送验证码
      </Button>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-primary hover:underline"
        >
          {t("auth.backToLogin")}
        </Link>
      </div>
    </form>
  )
}
