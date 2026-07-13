import { SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  accent?: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  centered = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      {eyebrow ? (
        <div
          className={cn(
            "mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--jw-accent)] uppercase",
            centered && "justify-center"
          )}
        >
          <SparklesIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="font-serif text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--jw-heading)] md:text-[2.5rem]">
        {title}
        {accent ? <span className="text-[var(--jw-accent)]">{accent}</span> : null}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-[var(--jw-muted)] md:mt-4 md:text-base md:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  )
}
