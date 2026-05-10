import { authenticatedApiRequest } from "@/lib/api/client"
import type { ErrorResponse } from "@/lib/api/types"
import type {
  EChartsLogResponse,
  GenerateEChartsFromArticleRequest,
  GenerateEChartsFromArticleResponse,
  GenerateEChartsRequest,
  ReplaceEChartsSpecRequest,
  UpdateEChartsDisplayRequest,
} from "./types"

export const echartsClient = {
  async generate(
    request: GenerateEChartsRequest
  ): Promise<EChartsLogResponse | ErrorResponse> {
    console.info("[ECharts] Generating chart from prompt", {
      articleId: request.article_id ?? 0,
      promptLength: request.prompt.length,
      theme: request.display?.style?.theme ?? null,
    })

    // TODO(observability): add AI chart generation metrics and trace attributes.
    return authenticatedApiRequest<EChartsLogResponse>("/echarts/generate", {
      method: "POST",
      body: JSON.stringify(request),
    })
  },

  async generateFromArticle(
    request: GenerateEChartsFromArticleRequest
  ): Promise<GenerateEChartsFromArticleResponse | ErrorResponse> {
    console.info("[ECharts] Generating charts from article", {
      articleId: request.article_id,
      maxCharts: request.max_charts ?? null,
      theme: request.display?.style?.theme ?? null,
    })

    // TODO(observability): add article chart extraction counters and task submission timing.
    return authenticatedApiRequest<GenerateEChartsFromArticleResponse>(
      "/echarts/generate-from-article",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )
  },

  async getLog(id: number): Promise<EChartsLogResponse | ErrorResponse> {
    console.debug("[ECharts] Fetching chart log", { logId: id })

    return authenticatedApiRequest<EChartsLogResponse>(`/echarts/logs/${id}`, {
      method: "GET",
    })
  },

  async replaceSpec(
    id: number,
    request: ReplaceEChartsSpecRequest
  ): Promise<EChartsLogResponse | ErrorResponse> {
    console.info("[ECharts] Replacing chart spec", {
      logId: id,
      version: request.version,
      chartType: request.spec.chart?.type ?? null,
    })

    return authenticatedApiRequest<EChartsLogResponse>(`/echarts/logs/${id}/spec`, {
      method: "PUT",
      body: JSON.stringify(request),
    })
  },

  async updateDisplay(
    id: number,
    request: UpdateEChartsDisplayRequest
  ): Promise<EChartsLogResponse | ErrorResponse> {
    console.info("[ECharts] Updating chart display", {
      logId: id,
      version: request.version,
      displayKeys: Object.keys(request.display),
    })

    return authenticatedApiRequest<EChartsLogResponse>(`/echarts/logs/${id}/display`, {
      method: "PATCH",
      body: JSON.stringify(request),
    })
  },
}
