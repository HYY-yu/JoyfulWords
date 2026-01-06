"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const router = useRouter()

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword.length < 8) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await apiClient.changePassword(oldPassword, newPassword)

      if ("error" in result) {
        toast({
          title: t("auth.error"),
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("auth.success"),
          description: t("auth.passwordChanged"),
        })

        // Close dialog
        onOpenChange(false)

        // Clear form
        setOldPassword("")
        setNewPassword("")

        // Sign out and redirect to login
        await signOut()
        router.push("/auth/login")
      }
    } catch (error: any) {
      toast({
        title: t("auth.error"),
        description: error.message || t("auth.unknownError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear form when closing
      setOldPassword("")
      setNewPassword("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("auth.profile")}</DialogTitle>
          <DialogDescription>
            {t("auth.changePasswordDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Display */}
          <div className="space-y-2">
            <Label>{t("auth.email")}</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{user?.email || t("auth.noEmail")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Old Password */}
            <div className="space-y-2">
              <Label htmlFor="old-password">{t("auth.oldPassword")}</Label>
              <div className="relative">
                <Input
                  id="old-password"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("auth.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
