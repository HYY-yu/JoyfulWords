"use client"

import type { TaskCenterPresentationTaskDetail } from "@/lib/api/taskcenter/types"
import { getPresentationTaskContract } from "@/lib/api/taskcenter/presentation-adapter"
import { PresentationTaskDetail as LegacyPresentationTaskDetail } from "./presentation/legacy-presentation-task-detail"
import { PresentationTaskDetailV2 } from "./presentation/presentation-task-detail-v2"

interface PresentationTaskDetailProps {
  detail: TaskCenterPresentationTaskDetail
  onContinuePresentation?: (articleId: number) => void
}

export function PresentationTaskDetail(props: PresentationTaskDetailProps) {
  return getPresentationTaskContract(props.detail) === "v2" ? (
    <PresentationTaskDetailV2 {...props} />
  ) : (
    <LegacyPresentationTaskDetail {...props} />
  )
}
