"use client"

import type { TaskCenterPresentationTaskDetail } from "@/lib/api/taskcenter/types"
import { PresentationTaskDetailV2 } from "./presentation/presentation-task-detail-v2"

interface PresentationTaskDetailProps {
  detail: TaskCenterPresentationTaskDetail
  onContinuePresentation?: (articleId: number) => void
}

export function PresentationTaskDetail(props: PresentationTaskDetailProps) {
  return <PresentationTaskDetailV2 {...props} />
}
