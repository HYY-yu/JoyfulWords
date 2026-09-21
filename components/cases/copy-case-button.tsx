"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/base/button"
import { casesClient } from "@/lib/api/cases/client"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"

export function CopyCaseButton({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const pending = useRef(false)
  const [copying, setCopying] = useState(false)

  async function copy() {
    if (pending.current) return
    pending.current = true
    setCopying(true)
    try {
      const result = await casesClient.copy(slug)
      if ("error" in result) throw result
      toast({ title: t("cases.copySuccess") })
      router.push(`/articles/${result.article_id}/edit`)
    } catch (error) {
      console.warn("[Cases] Copy failed", { slug, error })
      toast({ title: t("cases.copyFailed"), variant: "destructive" })
      pending.current = false
      setCopying(false)
    }
  }

  return <Button size="sm" variant="outline" className="h-9 w-[142px] rounded-md" disabled={copying} onClick={copy}>
    {copying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
    {t(copying ? "cases.copying" : "cases.copy")}
  </Button>
}
