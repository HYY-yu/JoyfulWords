import Image from "next/image"

import { cn } from "@/lib/utils"

interface BrandLogoProps {
  showWordmark?: boolean
  compact?: boolean
  className?: string
  wordmarkClassName?: string
}

export function BrandLogo({
  showWordmark = true,
  compact = false,
  className,
  wordmarkClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "jw-brand-mark jw-brand-scholar-mark relative flex shrink-0 items-center justify-center rounded-xl border",
          compact ? "h-8 w-8" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
      >
        <span className={cn("jw-brand-scholar", compact ? "is-compact" : "")}>
          <span className="jw-brand-scholar-image jw-scholar-theme-stack">
            {["paper", "blue-white", "black-gold"].map((theme) => (
              <Image
                key={theme}
                src={`/images/landing/scholar-writing-${theme}.png`}
                alt=""
                width={368}
                height={512}
                sizes={compact ? "32px" : "36px"}
                className={`jw-scholar-theme jw-scholar-theme-${theme}`}
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="jw-brand-scholar-brush jw-scholar-theme-stack">
            {["paper", "blue-white", "black-gold"].map((theme) => (
              <Image
                key={theme}
                src={`/images/landing/scholar-writing-${theme}.png`}
                alt=""
                width={368}
                height={512}
                sizes={compact ? "32px" : "36px"}
                className={`jw-scholar-theme jw-scholar-theme-${theme}`}
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="jw-brand-scholar-thought">
            <span />
            <span />
            <span />
          </span>
        </span>
      </div>
      {showWordmark ? (
        <span className={cn("text-[15px] font-bold tracking-tight text-[var(--jw-heading)] sm:text-base", wordmarkClassName)}>
          JoyfulWords
        </span>
      ) : null}
    </div>
  )
}
