import { API_BASE_URL } from "@/lib/config"
import { authenticatedApiRequest, getLanguageHeader } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import { tokenStore } from "@/lib/tokens/token-store"
import type {
  TaskCenterTaskDetailResponse,
  TaskCenterTaskListItem,
  TaskCenterTaskReference,
  TaskCenterTasksQuery,
} from "./types"

const inFlightTaskListRequests = new Map<
  string,
  Promise<TaskCenterTaskListItem[] | ErrorResponse>
>()

function buildTaskListRequestKey(params: TaskCenterTasksQuery): string {
  return JSON.stringify({
    type: params.type ?? null,
    article_id: params.article_id ?? null,
    status: params.status ?? null,
  })
}

export function isTaskCenterErrorResponse(result: unknown): result is ErrorResponse {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return false
  }

  const candidate = result as Record<string, unknown>
  return typeof candidate.error === "string" && !("id" in candidate)
}

export const taskCenterClient = {
  async getTasks(
    params: TaskCenterTasksQuery = {}
  ): Promise<TaskCenterTaskListItem[] | ErrorResponse> {
    const searchParams = new URLSearchParams()

    if (params.type) searchParams.set("type", params.type)
    if (typeof params.article_id === "number") {
      searchParams.set("article_id", String(params.article_id))
    }
    if (params.status) searchParams.set("status", params.status)

    const query = searchParams.toString()
    const endpoint = query ? `/api/taskcenter/tasks?${query}` : "/api/taskcenter/tasks"
    const requestKey = buildTaskListRequestKey(params)
    const inFlightRequest = inFlightTaskListRequests.get(requestKey)

    if (inFlightRequest) {
      return inFlightRequest
    }

    const requestPromise = authenticatedApiRequest<TaskCenterTaskListItem[]>(endpoint, {
      signal: params.signal,
    }).finally(() => {
      inFlightTaskListRequests.delete(requestKey)
    })

    inFlightTaskListRequests.set(requestKey, requestPromise)
    return requestPromise
  },

  async getTaskDetail(
    type: TaskCenterTaskReference["type"],
    id: TaskCenterTaskReference["id"],
    signal?: AbortSignal
  ): Promise<TaskCenterTaskDetailResponse | ErrorResponse> {
    return authenticatedApiRequest<TaskCenterTaskDetailResponse>(`/api/taskcenter/task/${type}/${id}`, {
      signal,
    })
  },

  async deleteTask(
    type: TaskCenterTaskReference["type"],
    id: TaskCenterTaskReference["id"],
    signal?: AbortSignal
  ): Promise<ErrorResponse | null> {
    const accessToken = tokenStore.getAccessToken()
    const response = await fetch(`${API_BASE_URL}/api/taskcenter/task/${type}/${id}`, {
      method: "DELETE",
      signal,
      headers: {
        "Accept-Language": getLanguageHeader(),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })

    if (response.status === 204) {
      return null
    }

    const responseText = await response.text()
    let parsedPayload: Record<string, unknown> | null = null
    if (responseText) {
      try {
        parsedPayload = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        parsedPayload = null
      }
    }

    if (!response.ok) {
      const errorMessage =
        (parsedPayload && typeof parsedPayload.error === "string" && parsedPayload.error) ||
        (parsedPayload && typeof parsedPayload.message === "string" && parsedPayload.message) ||
        (responseText ? responseText : "Request failed")

      return {
        error: errorMessage,
        status: response.status,
      }
    }

    return null
  },
}
