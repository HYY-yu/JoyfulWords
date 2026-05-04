import { BookOpenTextIcon, SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface BrandLogoProps {
  showWordmark?: boolean
  compact?: boolean
  className?: string
}

export function BrandLogo({
  showWordmark = true,
  compact = false,
  className,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "jw-brand-mark relative flex shrink-0 items-center justify-center rounded-xl border",
          compact ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <BookOpenTextIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        <span className="jw-brand-spark absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full shadow-sm">
          <SparklesIcon className="h-2.5 w-2.5" />
        </span>
      </div>
      {showWordmark ? (
        <span className="text-base font-bold tracking-tight text-[var(--jw-heading)]">
          JoyfulWords
        </span>
      ) : null}
    </div>
  )
}
