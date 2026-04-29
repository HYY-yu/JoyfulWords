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
          "relative flex shrink-0 items-center justify-center rounded-xl border border-teal-600/15 bg-[#fffdf5] text-teal-700 shadow-[0_10px_24px_-18px_rgba(15,118,110,0.45)]",
          compact ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <BookOpenTextIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ffd66b] text-[#6b4b00] shadow-sm">
          <SparklesIcon className="h-2.5 w-2.5" />
        </span>
      </div>
      {showWordmark ? (
        <span className="text-base font-bold tracking-tight text-[#221f1a]">
          JoyfulWords
        </span>
      ) : null}
    </div>
  )
}
