"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Checkbox } from "@/components/ui/base/checkbox"
import { VerifyCodeForm } from "./verify-code-form"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export function SignupForm() {
  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsError, setTermsError] = useState<string>("")
  const { requestSignupCode } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate terms agreement
    if (!agreedToTerms) {
      setTermsError(t("auth.termsRequired"))
      toast({
        variant: "destructive",
        title: t("auth.toast.pleaseTryAgain"),
        description: t("auth.termsRequired"),
      })
      return
    }

    setTermsError("")
    setLoading(true)

    try {
      // Log terms agreement for audit trail
      console.info("[Signup] Terms agreed", {
        email,
        timestamp: new Date().toISOString(),
        termsAgreed: true,
      })

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
          ← {t("auth.back")}
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
          {t("auth.sendCodeHint")}
        </p>
      </div>

      {/* Terms Agreement Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => {
            setAgreedToTerms(checked === true)
            if (checked) {
              setTermsError("")
            }
          }}
          disabled={loading}
        />
        <label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-tight cursor-pointer"
        >
          {t("auth.agreeToTerms")}{" "}
          <Link
            href="/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {t("legal.termsOfUse")}
          </Link>
          {" "}{t("auth.and")}{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {t("legal.privacyPolicy")}
          </Link>
        </label>
      </div>

      {termsError && (
        <p className="text-sm text-destructive">{termsError}</p>
      )}

      {/* Send Code Button */}
      <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.sendVerificationCode")}
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
