import { materialsClient } from "@/lib/api/materials/client"
import { waitForMaterialRequest } from "@/lib/api/materials/polling"
import type { ClueBoardExpandResult } from "@/lib/api/materials/types"
import type { ExpandMaterialClueResponse } from "./types"

function normalizeExpandResponse(response: ExpandMaterialClueResponse): ExpandMaterialClueResponse {
  return {
    query: response.query,
    markdown: response.markdown,
    images: Array.isArray(response.images)
      ? response.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      : [],
  }
}

export function createClueExpansionSubmitError(
  message: string,
  signal?: AbortSignal
): Error {
  if (signal?.aborted) {
    const abortError = new Error("Material clue expansion aborted")
    abortError.name = "AbortError"
    return abortError
  }
  return new Error(message || "failed to expand clue")
}

export async function expandMaterialClue(
  query: string,
  signal?: AbortSignal
): Promise<ExpandMaterialClueResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new Error("query is required")
  }

  console.info("[MaterialClueBoard] requesting clue expansion", { query: trimmed })
  // TODO(observability): add clue-board API latency metrics and trace attributes.
  const accepted = await materialsClient.expandClueBoard(trimmed, signal)
  if ("error" in accepted) {
    if (signal?.aborted) {
      throw createClueExpansionSubmitError(accepted.error, signal)
    }
    console.warn("[MaterialClueBoard] clue expansion submit failed", {
      query: trimmed,
      error: accepted.error,
      status: accepted.status,
    })
    throw createClueExpansionSubmitError(accepted.error, signal)
  }

  console.info("[MaterialClueBoard] clue expansion accepted", {
    query: trimmed,
    requestId: accepted.id,
    jobId: accepted.job_id,
  })
  const result = await waitForMaterialRequest<ClueBoardExpandResult>(accepted, {
    signal,
    onStatusChange: (request) => {
      console.debug("[MaterialClueBoard] clue expansion status changed", {
        query: trimmed,
        requestId: request.id,
        status: request.status,
      })
    },
  })

  return normalizeExpandResponse(result)
}
