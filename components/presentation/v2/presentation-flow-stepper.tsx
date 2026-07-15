import { CheckCircle2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PresentationFlowStepperProps {
  currentStep: number
  labels: string[]
  highestReachableStep: number
  onStepChange: (step: number) => void
}

export function PresentationFlowStepper({
  currentStep,
  labels,
  highestReachableStep,
  onStepChange,
}: PresentationFlowStepperProps) {
  return (
    <ol className="flex flex-col gap-2 border-b bg-background px-4 py-3 sm:flex-row sm:px-6">
      {labels.map((label, index) => {
        const complete = index < currentStep
        const active = index === currentStep
        const reachable = index <= highestReachableStep

        return (
          <li
            key={label}
            className={cn(
              "min-w-0 flex-1",
              !reachable && "cursor-not-allowed"
            )}
          >
            <button
              type="button"
              onClick={() => onStepChange(index)}
              disabled={!reachable}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors",
                complete
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                  : active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : reachable
                      ? "border-border bg-background text-muted-foreground hover:bg-muted/50"
                      : "border-border bg-background text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold",
                  complete && "border-emerald-500/40 text-emerald-700",
                  active && "border-primary/40 text-primary"
                )}
              >
                {complete ? <CheckCircle2Icon className="size-4" /> : index + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
