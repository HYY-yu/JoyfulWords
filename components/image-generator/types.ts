export type Layer = {
  id: string
  type: "rectangle"
  x: number
  y: number
  width: number
  height: number
  label: string
  description: string
  zIndex: number
}

export type TabValue = "creation" | "style" | "inversion"

export type ToolType = "select" | "rectangle" | "delete"

export type EnvironmentSettings = {
  width: number
  height: number
  style: string
  lighting: string
}

export type RenderSettings = {
  steps: number
}

export type LayerProps = {
  label: string
  description: string
  zIndex: number
}
