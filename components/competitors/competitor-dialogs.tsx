"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ScheduleConfig, ScheduledTask } from "@/lib/api/competitors/types"

interface PlatformConfig {
  label: string
  placeholder: string
}

interface CompetitorDialogsProps {
  // Schedule Dialog
  showScheduleDialog: boolean
  setShowScheduleDialog: (show: boolean) => void
  editingIntervalTaskId: number | null
  scheduleConfig: ScheduleConfig
  setScheduleConfig: (config: ScheduleConfig | ((prev: ScheduleConfig) => ScheduleConfig)) => void
  onScheduleSubmit: () => void
  onScheduleCancel: () => void

  // Delete Dialog
  deleteTaskId: number | null
  setDeleteTaskId: (id: number | null) => void
  onDeleteConfirm: (taskId: number) => void

  // Common
  loading: boolean
  profileUrl: string
  currentPlatform: PlatformConfig
  t: (key: string) => string
}

export function CompetitorDialogs({
  showScheduleDialog,
  setShowScheduleDialog,
  editingIntervalTaskId,
  scheduleConfig,
  setScheduleConfig,
  onScheduleSubmit,
  onScheduleCancel,
  deleteTaskId,
  setDeleteTaskId,
  onDeleteConfirm,
  loading,
  profileUrl,
  currentPlatform,
  t,
}: CompetitorDialogsProps) {
  return (
    <>
      {/* Schedule Dialog */}
      <Dialog
        open={showScheduleDialog || !!editingIntervalTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setShowScheduleDialog(false)
            onScheduleCancel()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntervalTaskId ? t("contentWriting.competitors.dialog.editInterval") : t("contentWriting.competitors.dialog.configTask")}
            </DialogTitle>
            <DialogDescription>
              {editingIntervalTaskId ? t("contentWriting.competitors.dialog.editDesc") : t("contentWriting.competitors.dialog.configDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingIntervalTaskId && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.platform")}</label>
                  <Input value={currentPlatform.label} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.url")}</label>
                  <Input value={profileUrl} disabled className="bg-muted" />
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("contentWriting.competitors.table.interval")}</label>
              <RadioGroup
                value={scheduleConfig.mode}
                onValueChange={(value) => setScheduleConfig({ ...scheduleConfig, mode: value as "simple" | "custom" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.dialog.modeSimple")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer">
                    {t("contentWriting.competitors.dialog.modeCron")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {scheduleConfig.mode === "simple" && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">{t("contentWriting.competitors.dialog.intervalNum")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={scheduleConfig.simpleInterval}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, simpleInterval: Number.parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-muted-foreground">{t("contentWriting.competitors.dialog.unit")}</label>
                  <Select
                    value={scheduleConfig.simpleUnit}
                    onValueChange={(value) => setScheduleConfig({ ...scheduleConfig, simpleUnit: value as "hours" | "days" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">{t("contentWriting.competitors.dialog.unitHours")}</SelectItem>
                      <SelectItem value="days">{t("contentWriting.competitors.dialog.unitDays")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {scheduleConfig.mode === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cron 表达式</label>
                <Input
                  placeholder="0 0 * * *"
                  value={scheduleConfig.cronExpression}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, cronExpression: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onScheduleCancel} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onScheduleSubmit} disabled={loading}>
              {t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contentWriting.competitors.dialog.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contentWriting.competitors.dialog.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskId && onDeleteConfirm(deleteTaskId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
