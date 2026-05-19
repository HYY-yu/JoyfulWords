"use client"

import { useEffect, useMemo, useState } from "react"
import { ImageIcon, SparklesIcon } from "lucide-react"

import { CreatorMode } from "@/components/image-generator/creator-mode"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { billingClient } from "@/lib/api/billing/client"
import { DEFAULT_POLLING_CONFIG } from "@/lib/api/image-generation/types"
import type { PollingConfig } from "@/lib/api/image-generation/types"
import { toolboxClient } from "@/lib/api/toolbox/client"
import { TOOLBOX_GUEST_MODEL, TOOLBOX_IMAGE_MODELS } from "@/lib/api/toolbox/types"

const TOOLBOX_IMAGE_POLLING_CONFIG: PollingConfig = {
  ...DEFAULT_POLLING_CONFIG,
  initialDelay: 2_000,
  storageKey: "joyfulwords-toolbox-image-generation-task",
}

export function ToolboxCreateImage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const preferAuth = loading || Boolean(user)
  const modelOptions = useMemo(() => [...TOOLBOX_IMAGE_MODELS], [])

  useEffect(() => {
    if (!user) {
      setCreditBalance(null)
      setIsLoadingBalance(false)
      return
    }

    let isCancelled = false

    const refreshBalance = async () => {
      setIsLoadingBalance(true)

      try {
        const result = await billingClient.refreshBalance()

        if (isCancelled) return

        if ("error" in result) {
          console.warn("[Toolbox] Failed to refresh account credit balance", {
            userId: user.id,
            error: result.error,
          })
          setCreditBalance(null)
          return
        }

        console.info("[Toolbox] Account credit balance refreshed", {
          userId: user.id,
          balanceCents: result.balance_cents,
          isCached: result.is_cached,
        })

        setCreditBalance(result.balance_cents)
      } catch (error) {
        if (isCancelled) return

        console.warn("[Toolbox] Unexpected balance refresh error", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        })
        setCreditBalance(null)
      } finally {
        if (!isCancelled) {
          setIsLoadingBalance(false)
        }
      }
    }

    void refreshBalance()

    return () => {
      isCancelled = true
    }
  }, [user])

  const client = useMemo(
    () => ({
      createGenerationTask: (request: Parameters<typeof toolboxClient.createImageTask>[0]) =>
        toolboxClient.createImageTask(request, { preferAuth }),
      getTaskResult: (taskId: string, signal?: AbortSignal) =>
        toolboxClient.getImageTask(taskId, { preferAuth, signal }),
    }),
    [preferAuth]
  )

  const uploadReferenceImage = async (file: File) => {
    const result = await toolboxClient.uploadReferenceImage(file, { preferAuth })

    if ("error" in result) {
      throw new Error(String(result.error))
    }

    return result.file_url
  }

  const handleModelChangeRequest = (model: string, currentModel: string) => {
    if (!user && model !== TOOLBOX_GUEST_MODEL) {
      toast({
        title: t("imageGeneration.model.loginRequiredTitle"),
        description: t("imageGeneration.model.loginRequiredDescription"),
      })
      return currentModel
    }

    return model
  }

  return (
    <section className="tools-image-workbench">
      <div className="tools-image-workbench-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tools-image-workbench-icon">
            <ImageIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="tools-tool-category">{t("toolsPage.tools.image-generator.category")}</p>
            <h1 className="tools-image-workbench-title">
              {t("toolsPage.tools.image-generator.title")}
            </h1>
          </div>
        </div>
        <div className="tools-image-workbench-status">
          <SparklesIcon className="size-4" />
          <span>
            {loading
              ? t("toolsPage.imageGenerator.authChecking")
              : user
                ? isLoadingBalance
                  ? t("toolsPage.imageGenerator.balanceLoading")
                  : creditBalance === null
                    ? t("toolsPage.imageGenerator.signedIn")
                    : t("toolsPage.imageGenerator.signedInBalance", {
                        credits: creditBalance.toLocaleString(),
                      })
                : t("toolsPage.imageGenerator.guestTrial")}
          </span>
        </div>
      </div>

      <div className="tools-image-workbench-body">
        <CreatorMode
          client={client}
          modelOptions={modelOptions}
          defaultModel={TOOLBOX_GUEST_MODEL}
          onModelChangeRequest={handleModelChangeRequest}
          pollingConfig={TOOLBOX_IMAGE_POLLING_CONFIG}
          useRealtimeUpdates={false}
          allowSaveToMaterials={false}
          allowReferenceMaterialSelector={false}
          uploadReferenceImage={uploadReferenceImage}
        />
      </div>
    </section>
  )
}
