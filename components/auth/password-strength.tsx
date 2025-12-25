import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation()

  const calculateStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) {
      return { score: 0, label: "", color: "bg-muted" }
    }

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 1) return { score: 20, label: t("auth.passwordStrength.weak"), color: "bg-red-500" }
    if (score <= 2) return { score: 40, label: t("auth.passwordStrength.fair"), color: "bg-orange-500" }
    if (score <= 3) return { score: 60, label: t("auth.passwordStrength.good"), color: "bg-yellow-500" }
    if (score <= 4) return { score: 80, label: t("auth.passwordStrength.strong"), color: "bg-lime-500" }
    return { score: 100, label: t("auth.passwordStrength.veryStrong"), color: "bg-green-500" }
  }

  const { score, label, color } = calculateStrength(password)

  if (!password) return null

  return (
    <div className="space-y-2">
      <Progress value={score} className={`h-2 ${color}`} />
      <p className="text-xs text-muted-foreground text-right">
        {label}
      </p>
    </div>
  )
}
