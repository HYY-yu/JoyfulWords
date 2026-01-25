"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { VerifyCodeForm } from "./verify-code-form"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export function SignupForm() {
  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { requestSignupCode } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await requestSignupCode(email)
      setStep("verify")
    } catch (error: any) {
      // Toast is already shown in the auth context
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySuccess = () => {
    // Redirect to login page after successful signup
    window.location.href = "/auth/login?signup=success"
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
          mode="signup"
          email={email}
          onSuccess={handleVerifySuccess}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleRequestCode} className="space-y-4">
      {/* Email */}
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

      {/* Send Code Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        发送验证码
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </form>
  )
}
