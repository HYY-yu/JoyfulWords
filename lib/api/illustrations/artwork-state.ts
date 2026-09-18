import type { ArtworkRecord } from "./types"

export function isArtworkPending(record: ArtworkRecord): boolean {
  return ["pending", "analyzing", "submitting", "processing"].includes(record.status)
}
export function artworkCards(record?: ArtworkRecord): ArtworkRecord[] {
  if (!record) return []
  return record.is_batch ? record.cards ?? [] : [record]
}
