"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoaderIcon } from "lucide-react"
import { articlesClient } from "@/lib/api/articles/client"

interface ArticleSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (articleData: { title: string; category?: string; tags: string[] }) => void
  content?: string  // 新增：文章内容
}

export function ArticleSaveDialog({
  open,
  onOpenChange,
  onSave,
  content = "",
}: ArticleSaveDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    // Validation: Title is required
    if (!title.trim()) {
      toast({
        variant: "destructive",
        description: t("contentWriting.saveDialog.titleRequired"),
      })
      return
    }

    setIsSaving(true)

    try {
      // 调用真实 API: POST /article
      const tagArray = tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const result = await articlesClient.createArticle({
        title: title.trim(),
        content: content,  // 保存当前编辑器内容
        category: category || undefined,
        tags: tagArray.join(",") || undefined,
      })

      if ("error" in result) {
        throw new Error(result.error)
      }

      // 保存成功
      onSave({
        title: title.trim(),
        category: category || undefined,
        tags: tagArray,
      })

      toast({
        description: t("contentWriting.saveDialog.success"),
      })

      // Reset form
      setTitle("")
      setCategory("")
      setTags("")
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("contentWriting.saveDialog.saveFailed")
      toast({
        variant: "destructive",
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contentWriting.saveDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("contentWriting.saveDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("contentWriting.saveDialog.titleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("contentWriting.saveDialog.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("contentWriting.saveDialog.categoryLabel")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t("contentWriting.saveDialog.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="技术文章">技术文章</SelectItem>
                <SelectItem value="营销文章">营销文章</SelectItem>
                <SelectItem value="职业发展">职业发展</SelectItem>
                <SelectItem value="创作教程">创作教程</SelectItem>
                <SelectItem value="效率工具">效率工具</SelectItem>
                <SelectItem value="商业模式">商业模式</SelectItem>
                <SelectItem value="电商运营">电商运营</SelectItem>
                <SelectItem value="技术优化">技术优化</SelectItem>
                <SelectItem value="法律知识">法律知识</SelectItem>
                <SelectItem value="前沿技术">前沿技术</SelectItem>
                <SelectItem value="音频创作">音频创作</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("contentWriting.saveDialog.tagsLabel")}</Label>
            <Input
              id="tags"
              placeholder={t("contentWriting.saveDialog.tagsPlaceholder")}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              用逗号分隔多个标签，例如：AI, 内容创作, 技术
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("contentWriting.saveDialog.cancelBtn")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin" />
                {t("contentWriting.saveDialog.saving")}
              </>
            ) : (
              t("contentWriting.saveDialog.saveBtn")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
