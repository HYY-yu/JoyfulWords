"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = require("@/lib/supabase/client").createClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
      toast({
        title: t("auth.resetEmailSent"),
        description: t("auth.resetEmailSentDescription"),
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.resetError"),
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("auth.checkYourEmail")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("auth.resetEmailSent")}
          </p>
        </div>
        <Button asChild className="w-full" variant="outline">
          <Link href="/auth/login">{t("auth.backToLogin")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.sendResetLink")}
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
