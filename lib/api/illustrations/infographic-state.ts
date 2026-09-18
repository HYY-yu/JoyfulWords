import type { InfographicRecord } from "./types"

export function isInfographicPending(record: InfographicRecord): boolean {
  return ["pending", "analyzing", "submitting", "processing"].includes(record.status)
}
export function infographicCards(record?: InfographicRecord): InfographicRecord[] {
  if (!record) return []
  return record.is_batch ? record.cards ?? [] : [record]
}
