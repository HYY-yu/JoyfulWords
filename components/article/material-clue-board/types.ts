export interface Point {
  x: number
  y: number
}

export type ClueNodeStatus = "loading" | "ready" | "failed"

export interface MaterialClueNode {
  id: string
  query: string
  x: number
  y: number
  markdown: string
  images?: string[]
  status: ClueNodeStatus
  isRoot?: boolean
  error?: string
}

export interface MaterialClueEdge {
  id: string
  fromNodeId: string
  linkId: string
  toNodeId: string | null
  state: "loading" | "settled"
  from: Point
  to: Point
}

export interface ExpandMaterialClueResponse {
  query: string
  markdown: string
  images?: string[]
}
