"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/base/button"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { PasswordStrength } from "./password-strength"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

interface VerifyCodeFormProps {
  mode: "signup" | "reset"
  email: string
  onSuccess?: () => void
}

export function VerifyCodeForm({ mode, email, onSuccess }: VerifyCodeFormProps) {
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { verifySignupCode, verifyPasswordReset, requestSignupCode, requestPasswordReset } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

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

    setLoading(true)

    try {
      if (mode === "signup") {
        await verifySignupCode(email, code, password)
        toast({
          title: t("auth.signupComplete"),
          description: t("auth.toast.loginWithCredentials"),
        })
      } else {
        await verifyPasswordReset(email, code, password)
        toast({
          title: t("auth.passwordResetComplete"),
          description: t("auth.toast.loginWithNewPassword"),
        })
      }

      onSuccess?.()
    } catch (error: any) {
      // Toast is already shown in the auth context
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return

    setResendLoading(true)

    try {
      if (mode === "signup") {
        await requestSignupCode(email)
      } else {
        await requestPasswordReset(email)
      }

      // Start 60 second countdown
      setCountdown(60)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      // Toast is already shown in the auth context
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          验证码已发送至 <span className="font-medium">{email}</span>
        </p>
      </div>

      {/* Verification Code */}
      <div className="space-y-2">
        <Label htmlFor="code">验证码</Label>
        <Input
          id="code"
          type="text"
          placeholder="请输入6位验证码"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          disabled={loading}
          maxLength={6}
          pattern="\d{6}"
          className="text-center text-lg tracking-widest"
        />
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">有效期15分钟</span>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading || countdown > 0}
            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading
              ? "发送中..."
              : countdown > 0
              ? `${countdown}秒后重新发送`
              : "重新发送"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">新密码</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="至少8位字符"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
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
        <Label htmlFor="confirmPassword">确认密码</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
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

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "signup" ? "验证并注册" : "重置密码"}
      </Button>

      {/* Back to Login */}
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
