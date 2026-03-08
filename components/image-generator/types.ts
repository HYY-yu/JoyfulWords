// ============ Schema Enum Types ============

export type MediumType =
  | "Photography"
  | "Digital Illustration"
  | "Oil Painting"
  | "Watercolor"
  | "3D Render"
  | "Sketch"
  | "Cyberpunk"
  | "Glass"

export type StyleType =
  | "Renaissance"
  | "Impressionism"
  | "Surrealism"
  | "Minimalism"
  | "Baroque"
  | "Ukiyo-e"
  | "Vaporwave"
  | "Ghibli"

export type ColorAccent =
  | "Monochrome"
  | "Pastel"
  | "Earth Tones"
  | "Neon"
  | "Cinematic Teal & Orange"
  | "Morandi"

export type CameraAngle =
  | "Eye Level"
  | "Low Angle"
  | "High Angle"
  | "Top Down"
  | "Dutch Angle"

export type FocalLength =
  | "14mm"
  | "35mm"
  | "50mm"
  | "85mm"
  | "200mm"

export type DepthOfField =
  | "Shallow"
  | "Deep"
  | "Macro"

export type LightingType =
  | "Natural Light"
  | "Studio Light"
  | "Volumetric Lighting"
  | "Cinematic Lighting"
  | "Neon Light"
  | "Rim Lighting"

export type LightSource =
  | "Front"
  | "Side"
  | "Top-down"
  | "Bottom-up"
  | "Backlight"

// ============ Component Types ============

export type TabValue = "creation" | "style" | "inversion"

export type ToolType = "select" | "rectangle" | "delete"

// ============ UI Layer Type (for canvas display) ============
export type Layer = {
  id: string
  type: "rectangle"
  x: number
  y: number
  width: number
  height: number
  label: string // UI display label only
  description: string
  reference_image?: string
  zIndex: number
}

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

// ============ Schema Types (matching creator.schema.json) ============

export type CreatorMeta = {
  width: number
  high: number // Note: schema uses "high" not "height"
  seed: number
}

export type CreatorGlobalStyle = {
  medium: MediumType
  style: StyleType
  color_accent: ColorAccent
}

export type CreatorCamera = {
  angle: CameraAngle
  focal_length: FocalLength
  depth_of_field: DepthOfField
}

export type CreatorLighting = {
  type: LightingType
  source: LightSource
  intensity: number // 0.1 - 1.0
}

export type CreatorComposition = {
  camera: CreatorCamera
  lighting: CreatorLighting
}

export type Box2D = [number, number, number, number] // [x, y, width, height]

export type SpatialLayout = {
  box_2d?: Box2D
  z_index: number
}

export type CreatorLayer = {
  id: string
  description: string
  reference_image?: string
  spatial_layout: SpatialLayout
}

export type CreatorConfig = {
  version: string
  meta: CreatorMeta
  global_style: CreatorGlobalStyle
  composition: CreatorComposition
  layers: CreatorLayer[]
}

// ============ Form State Types ============

export type MetaSettings = CreatorMeta

export type GlobalStyleSettings = CreatorGlobalStyle

export type CompositionSettings = CreatorComposition

export type LayerProps = {
  description: string
  reference_image?: string
  z_index: number
}
