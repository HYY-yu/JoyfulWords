"use client"

/* eslint-disable @next/next/no-img-element */

import { Loader2Icon } from "lucide-react"
import type { PresentationPreviewManifest } from "@/lib/api/presentations/types"
import { cn } from "@/lib/utils"

interface PresentationSvgPreviewProps {
  preview?: PresentationPreviewManifest | null
  loading?: boolean
  waitingLabel: string
  emptyLabel: string
  className?: string
}

export function PresentationSvgPreview({
  preview,
  loading = false,
  waitingLabel,
  emptyLabel,
  className,
}: PresentationSvgPreviewProps) {
  const slides = Array.isArray(preview?.slides) ? preview.slides : []

  if (loading) {
    return (
      <div className={cn("flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground", className)}>
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        <span>{waitingLabel}</span>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className={cn("flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-muted-foreground", className)}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {slides.map((slide) => (
        <figure
          key={slide.slide_number}
          className="overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{ aspectRatio: "16 / 9" }}
        >
          <img
            src={slide.url}
            alt={`Slide ${slide.slide_number}`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  )
}
