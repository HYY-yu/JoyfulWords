import type {
  CanvasTemplateId,
  CompositionSettings,
  GlobalStyleSettings,
  Layer,
  LayerProps,
  MetaSettings,
} from "./types"

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

type RelativeBox = {
  x: number
  y: number
  width: number
  height: number
  descriptionKey: string
}

type TemplateDefinition = {
  titleKey: string
  descriptionKey: string
  layers: RelativeBox[]
}

export const DEFAULT_META_SETTINGS: MetaSettings = {
  width: 1024,
  high: 1024,
  seed: -1,
}

export const DEFAULT_GLOBAL_STYLE_SETTINGS: GlobalStyleSettings = {
  medium: "Photography",
  style: "Renaissance",
  color_accent: "Cinematic Teal & Orange",
}

export const DEFAULT_COMPOSITION_SETTINGS: CompositionSettings = {
  camera: {
    angle: "Eye Level",
    focal_length: "50mm",
    depth_of_field: "Deep",
  },
  lighting: {
    type: "Natural Light",
    source: "Front",
    intensity: 0.8,
  },
}

export const DEFAULT_LAYER_PROPS: LayerProps = {
  description: "",
  reference_image: undefined,
  z_index: 0,
}

export type ImageSizePresetId = "landscape" | "portrait" | "square"

export const IMAGE_SIZE_PRESETS: Array<{
  id: ImageSizePresetId
  width: number
  high: number
  titleKey: string
}> = [
  {
    id: "landscape",
    width: 1024,
    high: 512,
    titleKey: "imageGeneration.properties.sizePresets.landscape",
  },
  {
    id: "portrait",
    width: 512,
    high: 1024,
    titleKey: "imageGeneration.properties.sizePresets.portrait",
  },
  {
    id: "square",
    width: 1024,
    high: 1024,
    titleKey: "imageGeneration.properties.sizePresets.square",
  },
]

const TEMPLATE_DEFINITIONS: Record<CanvasTemplateId, TemplateDefinition> = {
  sideBySide: {
    titleKey: "imageGeneration.templates.sideBySide.title",
    descriptionKey: "imageGeneration.templates.sideBySide.description",
    layers: [
      {
        x: 0.06,
        y: 0.14,
        width: 0.4,
        height: 0.72,
        descriptionKey: "imageGeneration.templates.sideBySide.layers.primary",
      },
      {
        x: 0.54,
        y: 0.14,
        width: 0.4,
        height: 0.72,
        descriptionKey: "imageGeneration.templates.sideBySide.layers.secondary",
      },
    ],
  },
  nestedRectangles: {
    titleKey: "imageGeneration.templates.nestedRectangles.title",
    descriptionKey: "imageGeneration.templates.nestedRectangles.description",
    layers: [
      {
        x: 0.08,
        y: 0.1,
        width: 0.84,
        height: 0.8,
        descriptionKey: "imageGeneration.templates.nestedRectangles.layers.outer",
      },
      {
        x: 0.58,
        y: 0.2,
        width: 0.24,
        height: 0.28,
        descriptionKey: "imageGeneration.templates.nestedRectangles.layers.inner",
      },
    ],
  },
  stackedRectangles: {
    titleKey: "imageGeneration.templates.stackedRectangles.title",
    descriptionKey: "imageGeneration.templates.stackedRectangles.description",
    layers: [
      {
        x: 0.08,
        y: 0.08,
        width: 0.84,
        height: 0.38,
        descriptionKey: "imageGeneration.templates.stackedRectangles.layers.top",
      },
      {
        x: 0.08,
        y: 0.54,
        width: 0.84,
        height: 0.28,
        descriptionKey: "imageGeneration.templates.stackedRectangles.layers.bottom",
      },
    ],
  },
}

export function getMatchedSizePreset(metaSettings: Pick<MetaSettings, "width" | "high">) {
  return (
    IMAGE_SIZE_PRESETS.find(
      (preset) =>
        preset.width === metaSettings.width && preset.high === metaSettings.high
    )?.id ?? null
  )
}

export function getCanvasTemplateOptions(t: TranslateFn) {
  return Object.entries(TEMPLATE_DEFINITIONS).map(([id, definition]) => ({
    id: id as CanvasTemplateId,
    title: t(definition.titleKey),
    description: t(definition.descriptionKey),
  }))
}

export function buildTemplateLayers(
  templateId: CanvasTemplateId,
  metaSettings: Pick<MetaSettings, "width" | "high">,
  t: TranslateFn
): Layer[] {
  const template = TEMPLATE_DEFINITIONS[templateId]

  return template.layers.map((relativeBox, index) => ({
    id: `${templateId}-${index}-${Date.now()}`,
    type: "rectangle",
    x: Math.round(relativeBox.x * metaSettings.width),
    y: Math.round(relativeBox.y * metaSettings.high),
    width: Math.round(relativeBox.width * metaSettings.width),
    height: Math.round(relativeBox.height * metaSettings.high),
    label: t("imageGeneration.canvas.layerLabel", { number: index + 1 }),
    description: t(relativeBox.descriptionKey),
    reference_image: undefined,
    zIndex: index,
  }))
}
