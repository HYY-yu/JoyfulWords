export interface Version {
  id: number
  article_id: number
  version_data: string
  detail: string
  is_del: number
  created_at: string
}

export interface CreateVersionRequest {
  article_id: number
  article: {
    title: string
    content: string
    status: string
    category: string
    tags: string
  }
  detail: string
}

export type MessageResponse = {
  message: string
}

export type ErrorResponse = {
  error: string
  status?: number
}