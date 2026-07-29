export interface AdaptivePollingPolicy {
  fastIntervalMs: number
  fastWindowMs: number
  standardIntervalMs: number
  standardWindowMs: number
  slowIntervalMs: number
  maxErrorIntervalMs: number
  timeoutMs: number
  jitterRatio: number
}

export interface AdaptivePollingDelayInput {
  elapsedMs: number
  consecutiveErrors: number
  requestedDelayMs?: number
}

export const DEFAULT_ADAPTIVE_POLLING_POLICY: AdaptivePollingPolicy = {
  fastIntervalMs: 3000,
  fastWindowMs: 15_000,
  standardIntervalMs: 5000,
  standardWindowMs: 60_000,
  slowIntervalMs: 10_000,
  maxErrorIntervalMs: 30_000,
  timeoutMs: 5 * 60 * 1000,
  jitterRatio: 0.1,
}

export function mergeAdaptivePollingPolicy(
  policy?: Partial<AdaptivePollingPolicy>
): AdaptivePollingPolicy {
  return {
    ...DEFAULT_ADAPTIVE_POLLING_POLICY,
    ...policy,
  }
}

export function getAdaptivePollingDelay(
  input: AdaptivePollingDelayInput,
  policy: AdaptivePollingPolicy = DEFAULT_ADAPTIVE_POLLING_POLICY,
  random: () => number = Math.random
): number {
  let baseDelay = input.requestedDelayMs

  if (typeof baseDelay !== "number") {
    if (input.elapsedMs < policy.fastWindowMs) {
      baseDelay = policy.fastIntervalMs
    } else if (input.elapsedMs < policy.standardWindowMs) {
      baseDelay = policy.standardIntervalMs
    } else {
      baseDelay = policy.slowIntervalMs
    }
  }

  if (input.consecutiveErrors > 0) {
    baseDelay = Math.min(
      baseDelay * 2 ** input.consecutiveErrors,
      policy.maxErrorIntervalMs
    )
  }

  const jitterOffset = baseDelay * policy.jitterRatio * (random() * 2 - 1)
  return Math.max(250, Math.round(baseDelay + jitterOffset))
}
