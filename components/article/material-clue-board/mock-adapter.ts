import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type { ExpandMaterialClueResponse } from "./types"

interface ExpandMaterialClueRequest {
  query: string
}

const inflightExpansions = new Map<string, Promise<ExpandMaterialClueResponse>>()

function isErrorResponse(
  response: ExpandMaterialClueResponse | ErrorResponse
): response is ErrorResponse {
  return "error" in response
}

function normalizeExpandResponse(response: ExpandMaterialClueResponse): ExpandMaterialClueResponse {
  return {
    query: response.query,
    markdown: response.markdown,
    images: Array.isArray(response.images)
      ? response.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      : [],
  }
}

export async function expandMaterialClue(query: string): Promise<ExpandMaterialClueResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new Error("query is required")
  }

  const inflightKey = trimmed.toLowerCase()
  const inflight = inflightExpansions.get(inflightKey)
  if (inflight) {
    console.debug("[MaterialClueBoard] reusing in-flight clue expansion", { query: trimmed })
    return inflight
  }

  console.info("[MaterialClueBoard] requesting clue expansion", { query: trimmed })
  // TODO(observability): add clue-board API latency metrics and trace attributes.
  const request = authenticatedApiRequest<ExpandMaterialClueResponse | ErrorResponse>(
      "/materials/clue-board/expand",
      {
        method: "POST",
        body: JSON.stringify({ query: trimmed } satisfies ExpandMaterialClueRequest),
      }
    )
    .then((response) => {
      if (isErrorResponse(response)) {
        console.warn("[MaterialClueBoard] clue expansion failed", {
          query: trimmed,
          error: response.error,
          status: response.status,
        })
        throw new Error(response.error || "failed to expand clue")
      }

      return normalizeExpandResponse(response)
    })
    .finally(() => {
      inflightExpansions.delete(inflightKey)
    })

  inflightExpansions.set(inflightKey, request)
  return request
}
