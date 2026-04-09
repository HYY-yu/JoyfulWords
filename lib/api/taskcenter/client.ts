import { apiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
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

export const taskCenterClient = {
  async getTasks(
    params: TaskCenterTasksQuery = {}
  ): Promise<TaskCenterTaskListItem[] | ErrorResponse> {
    const token = localStorage.getItem("access_token")
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

    const requestPromise = apiRequest<TaskCenterTaskListItem[]>(endpoint, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
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
    const token = localStorage.getItem("access_token")

    return apiRequest<TaskCenterTaskDetailResponse>(`/api/taskcenter/task/${type}/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      signal,
    })
  },
}
