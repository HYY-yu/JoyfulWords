"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { GoogleOAuthButton } from "./google-oauth-button"
import { PasswordStrength } from "./password-strength"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export function SignupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("auth.passwordMismatch"),
        description: t("auth.passwordMismatchDescription"),
      })
      return
    }

    if (!agreeToTerms) {
      toast({
        variant: "destructive",
        title: t("auth.termsRequired"),
        description: t("auth.termsRequiredDescription"),
      })
      return
    }

    setLoading(true)

    try {
      await signUpWithEmail(email, password, fullName)
      toast({
        title: t("auth.signupSuccess"),
        description: t("auth.verifyEmailSent"),
      })
      router.push("/auth/verify-email")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.signupError"),
        description: error.message || t("auth.signupErrorDescription"),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.oauthError"),
        description: error.message,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("auth.fullName")}</Label>
        <Input
          id="fullName"
          type="text"
          placeholder={t("auth.fullNamePlaceholder")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

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
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreeToTerms}
          onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
          {t("auth.agreeToTerms")}{" "}
          <Link href="/terms" className="text-primary hover:underline">
            {t("auth.termsOfService")}
          </Link>{" "}
          {t("auth.and")}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t("auth.privacyPolicy")}
          </Link>
        </Label>
      </div>

      {/* Sign Up Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.signup")}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t("auth.continueWith")}
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton
        onClick={handleGoogleSignUp}
        loading={loading}
        type="signup"
      />

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
