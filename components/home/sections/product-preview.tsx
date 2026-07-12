import Image from "next/image"
import {
  ArrowRightIcon,
  ChartNoAxesCombinedIcon,
  FileTextIcon,
  NetworkIcon,
  PresentationIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface PosterPreviewProps {
  src: string
  alt: string
  className?: string
  imageClassName?: string
}

export function PosterPreview({ src, alt, className, imageClassName }: PosterPreviewProps) {
  return (
    <div className={cn("relative size-full min-h-48 overflow-hidden bg-[var(--jw-surface-muted)]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, 50vw"
        className={cn("object-cover", imageClassName)}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--jw-heading)_20%,transparent)] via-transparent to-transparent"
        aria-hidden="true"
      />
    </div>
  )
}

interface MindMapPreviewProps {
  label: string
  branches: [string, string, string]
}

export function MindMapPreview({ label, branches: branchLabels }: MindMapPreviewProps) {
  const branches = [
    { label: branchLabels[0], top: "16%", width: "34%" },
    { label: branchLabels[1], top: "41%", width: "38%" },
    { label: branchLabels[2], top: "66%", width: "31%" },
  ]

  return (
    <div className="relative min-h-56 overflow-hidden bg-[var(--jw-surface-muted)] md:min-h-72" role="img" aria-label={label}>
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--jw-accent)_20%,transparent)_1px,transparent_0)] [background-size:20px_20px]" />
      <div className="absolute top-1/2 left-[7%] flex w-[29%] -translate-y-1/2 items-center gap-2 rounded-xl bg-[var(--jw-accent)] px-3 py-3 text-xs font-semibold text-[var(--jw-accent-foreground)] shadow-[var(--jw-soft-shadow)] md:px-4 md:text-sm">
        <NetworkIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {label}
      </div>
      {branches.map((branch) => (
        <div key={branch.label}>
          <span
            className="absolute left-[35%] h-px origin-left bg-[var(--jw-border)]"
            style={{ top: branch.top, width: "17%", transform: `rotate(${branch.top === "16%" ? 26 : branch.top === "66%" ? -24 : 0}deg)` }}
            aria-hidden="true"
          />
          <div
            className="absolute left-[52%] flex h-10 items-center rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-3 text-xs font-medium text-[var(--jw-heading)] shadow-[var(--jw-soft-shadow)] md:text-sm"
            style={{ top: branch.top, width: branch.width }}
          >
            {branch.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export function BeforeAfterPreview({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid min-h-48 grid-cols-2 gap-2 bg-[var(--jw-surface-muted)] p-3 md:min-h-56 md:gap-3 md:p-4" role="img" aria-label={`${before}, ${after}`}>
      <div className="relative overflow-hidden rounded-xl border border-dashed border-[var(--jw-border)] bg-[color-mix(in_srgb,var(--jw-surface-muted)_74%,transparent)] p-3">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--jw-muted)]">
          <SearchIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          {before}
        </div>
        <div className="space-y-2 opacity-70">
          {["42%", "78%", "58%", "86%"].map((width, index) => (
            <div
              key={width}
              className="h-7 rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface-strong)]"
              style={{ width, marginLeft: index % 2 ? "auto" : 0 }}
            />
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-3 shadow-[var(--jw-soft-shadow)]">
        <div className="mb-3 text-xs font-semibold text-[var(--jw-accent)]">{after}</div>
        <div className="grid h-[calc(100%-2rem)] grid-cols-2 gap-2">
          {[FileTextIcon, ChartNoAxesCombinedIcon, PresentationIcon, NetworkIcon].map((Icon, index) => (
            <div key={index} className="grid place-items-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
              <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function OneToManyPreview({ source, outputs }: { source: string; outputs: string[] }) {
  const icons = [ChartNoAxesCombinedIcon, PresentationIcon, NetworkIcon]

  return (
    <div className="grid min-h-56 grid-cols-[0.85fr_auto_1.15fr] items-center gap-2 bg-[var(--jw-surface-muted)] p-4 md:min-h-64 md:gap-4 md:p-6" role="img" aria-label={`${source}: ${outputs.join(", ")}`}>
      <div className="rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] p-4 shadow-[var(--jw-soft-shadow)]">
        <FileTextIcon className="mb-3 size-5 text-[var(--jw-accent)]" strokeWidth={1.6} aria-hidden="true" />
        <div className="mb-2 h-2 w-3/4 rounded-full bg-[color-mix(in_srgb,var(--jw-accent)_28%,transparent)]" />
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-[var(--jw-border)]" />
          <div className="h-1.5 w-5/6 rounded-full bg-[var(--jw-border)]" />
          <div className="h-1.5 w-2/3 rounded-full bg-[var(--jw-border)]" />
        </div>
        <p className="mt-4 text-[11px] font-semibold text-[var(--jw-heading)] md:text-xs">{source}</p>
      </div>
      <ArrowRightIcon className="size-5 text-[var(--jw-accent)]" strokeWidth={1.5} aria-hidden="true" />
      <div className="space-y-2">
        {outputs.map((output, index) => {
          const Icon = icons[index] ?? FileTextIcon
          return (
            <div key={output} className="flex items-center gap-2 rounded-xl border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] px-3 py-2.5 text-xs font-semibold text-[var(--jw-heading)] shadow-[var(--jw-soft-shadow)] md:text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                <Icon className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
              </span>
              {output}
            </div>
          )
        })}
      </div>
    </div>
  )
}
