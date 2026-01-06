import type React from "react"
import { UploadIcon, ImageIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Material, UploadForm, UploadErrors } from "@/lib/hooks/use-materials"

interface MaterialDialogsProps {
  // Edit dialog
  editingMaterial: Material | null
  setEditingMaterial: (material: Material | null) => void
  onSaveEdit: () => void

  // Delete dialog
  deletingId: number | null
  setDeletingId: (id: number | null) => void
  onDelete: (id: number) => void

  // Upload dialog
  showUploadDialog: boolean
  setShowUploadDialog: (show: boolean) => void
  uploadForm: UploadForm
  setUploadForm: (form: UploadForm | ((prev: UploadForm) => UploadForm)) => void
  uploadErrors: UploadErrors
  imagePreview: string
  onUploadSubmit: () => void
  onUploadCancel: () => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void

  // Common
  loading: boolean
  t: (key: string) => string
}

export function MaterialDialogs({
  editingMaterial,
  setEditingMaterial,
  onSaveEdit,
  deletingId,
  setDeletingId,
  onDelete,
  showUploadDialog,
  setShowUploadDialog,
  uploadForm,
  setUploadForm,
  uploadErrors,
  imagePreview,
  onUploadSubmit,
  onUploadCancel,
  onImageChange,
  onRemoveImage,
  loading,
  t,
}: MaterialDialogsProps) {
  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.materials.dialog.editTitle")}</DialogTitle>
            <DialogDescription>{t("contentWriting.materials.dialog.editDesc")}</DialogDescription>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("contentWriting.materials.dialog.nameLabel")}
                </label>
                <Input
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("contentWriting.materials.dialog.linkLabel")}
                </label>
                <Input
                  value={editingMaterial.source_url}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, source_url: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("contentWriting.materials.dialog.contentLabel")}
                </label>
                <textarea
                  value={editingMaterial.content}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, content: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMaterial(null)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onSaveEdit} disabled={loading}>
              {t("contentWriting.materials.dialog.saveBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contentWriting.materials.dialog.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contentWriting.materials.dialog.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && onDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("contentWriting.materials.dialog.uploadTitle")}</DialogTitle>
            <DialogDescription>{t("contentWriting.materials.dialog.uploadDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-name">
                {t("contentWriting.materials.dialog.nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-name"
                placeholder={t("contentWriting.materials.dialog.namePlaceholder")}
                value={uploadForm.name}
                onChange={(e) => {
                  setUploadForm({ ...uploadForm, name: e.target.value })
                  if (uploadErrors.name) {
                    setUploadForm((prev: UploadForm) => ({ ...prev, name: e.target.value }))
                  }
                }}
                className={uploadErrors.name ? "border-destructive" : ""}
              />
              {uploadErrors.name && <p className="text-sm text-destructive">{uploadErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-type">{t("contentWriting.materials.dialog.typeLabel")}</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => {
                  setUploadForm({
                    ...uploadForm,
                    type: value as "Info" | "Image",
                    content: "",
                    imageFile: null,
                    imageUrl: "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">{t("contentWriting.materials.types.info")}</SelectItem>
                  <SelectItem value="Image">{t("contentWriting.materials.types.image")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {uploadForm.type === "Info"
                  ? t("contentWriting.materials.dialog.typeHintInfo")
                  : t("contentWriting.materials.dialog.typeHintImage")}
              </p>
            </div>

            {/* Info 类型：文本输入框 */}
            {uploadForm.type === "Info" && (
              <div className="space-y-2">
                <Label htmlFor="upload-content">
                  {t("contentWriting.materials.dialog.contentLabel")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="upload-content"
                  placeholder={t("contentWriting.materials.dialog.contentPlaceholder")}
                  value={uploadForm.content}
                  onChange={(e) => {
                    setUploadForm({ ...uploadForm, content: e.target.value })
                  }}
                  className={`min-h-[150px] resize-none ${uploadErrors.content ? "border-destructive" : ""}`}
                />
                {uploadErrors.content && <p className="text-sm text-destructive">{uploadErrors.content}</p>}
              </div>
            )}

            {/* Image 类型：图片上传组件 */}
            {uploadForm.type === "Image" && (
              <div className="space-y-2">
                <Label>
                  {t("contentWriting.materials.dialog.imageLabel")} <span className="text-destructive">*</span>
                </Label>

                {/* 上传区域 */}
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {t("contentWriting.materials.dialog.uploadHint")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("contentWriting.materials.dialog.uploadFormatHint")}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={onImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" asChild>
                          <span>
                            <UploadIcon className="w-4 h-4 mr-2" />
                            {t("contentWriting.materials.dialog.selectImageBtn")}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* 预览区域 */
                  <div className="border border-border rounded-lg p-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-contain bg-muted rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        {t("contentWriting.materials.dialog.removeImageBtn")}
                      </Button>
                    </div>
                    {uploadForm.imageFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("contentWriting.materials.dialog.fileName")} {uploadForm.imageFile.name} (
                        {(uploadForm.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {uploadErrors.content && <p className="text-sm text-destructive">{uploadErrors.content}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onUploadCancel} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onUploadSubmit} disabled={loading}>
              {loading ? <UploadIcon className="w-4 h-4 mr-2 animate-spin" /> : <UploadIcon className="w-4 h-4 mr-2" />}
              {t("contentWriting.materials.uploadBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
