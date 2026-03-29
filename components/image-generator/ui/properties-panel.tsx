"use client"

import type { Layer, MetaSettings, GlobalStyleSettings, CompositionSettings, LayerProps } from "../types"
import { Image as ImageIcon, Palette, Camera, Lightbulb, Layers, Cpu } from "lucide-react"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Slider } from "@/components/ui/base/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { ModelSelector } from "./model-selector"
import { MaterialSelectorDialog } from "./material-selector-dialog"
import { useState, useMemo } from "react"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"

interface PropertiesPanelProps {
  selectedLayer: Layer | null
  metaSettings: MetaSettings
  globalStyleSettings: GlobalStyleSettings
  compositionSettings: CompositionSettings
  layerProps: LayerProps
  // 新增
  selectedModel: string
  availableModels: string[]
  isLoadingModels: boolean
  onMetaSettingsChange: (settings: MetaSettings) => void
  onGlobalStyleSettingsChange: (settings: GlobalStyleSettings) => void
  onCompositionSettingsChange: (settings: CompositionSettings) => void
  onLayerPropsChange: (props: LayerProps) => void
  // 新增
  onModelChange: (model: string) => void
}

export function PropertiesPanel({
  selectedLayer,
  metaSettings,
  globalStyleSettings,
  compositionSettings,
  layerProps,
  selectedModel,
  availableModels,
  isLoadingModels,
  onMetaSettingsChange,
  onGlobalStyleSettingsChange,
  onCompositionSettingsChange,
  onLayerPropsChange,
  onModelChange,
}: PropertiesPanelProps) {
  const { t } = useTranslation()

  // 新增：对话框状态
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)

  // 新增：使用无限滚动素材 Hook，只在对话框打开时启用
  const {
    materials,
    isLoading: materialsLoading,
    hasMore: hasMoreMaterials,
    loadMore: loadMoreMaterials,
    observerTarget: materialsObserverTarget,
  } = useInfiniteMaterials({
    type: 'image',
    enabled: showMaterialSelector,
    pageSize: 20,
  })

  // 过滤图片类型素材
  const imageMaterials = useMemo(() => {
    return materials
      .filter(m => m.material_type === 'image' && m.content)
      .map(m => ({
        id: m.id,
        title: m.title,
        source_url: m.content
      }))
  }, [materials])

  // 新增：获取当前选中素材的标题
  const selectedMaterialTitle = useMemo(() => {
    if (!layerProps.reference_image) return null
    const material = imageMaterials.find(m => m.source_url === layerProps.reference_image)
    return material?.title || null
  }, [layerProps.reference_image, imageMaterials])

  const handleLayerPropChange = (key: keyof LayerProps, value: string | number) => {
    onLayerPropsChange({ ...layerProps, [key]: value })
  }

  return (
    <div className="w-80 border-l border-border bg-background overflow-auto">
      <div className="p-6 space-y-6">
        {/* 新增: 模型选择器 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Cpu className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("imageGeneration.model.title")}</h3>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            availableModels={availableModels}
            isLoading={isLoadingModels}
            onModelChange={onModelChange}
          />
        </div>

        {/* Section 1: 元数据设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("imageGeneration.properties.metadata")}</h3>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.width")}
                </Label>
                <Input
                  id="width"
                  type="number"
                  min={1}
                  max={4096}
                  value={metaSettings.width}
                  onChange={(e) =>
                    onMetaSettingsChange({ ...metaSettings, width: Number(e.target.value) })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="high" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.height")}
                </Label>
                <Input
                  id="high"
                  type="number"
                  min={1}
                  max={4096}
                  value={metaSettings.high}
                  onChange={(e) =>
                    onMetaSettingsChange({ ...metaSettings, high: Number(e.target.value) })
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed" className="text-sm text-muted-foreground">
                {t("imageGeneration.properties.seed")}
              </Label>
              <Input
                id="seed"
                type="number"
                value={metaSettings.seed}
                onChange={(e) =>
                  onMetaSettingsChange({ ...metaSettings, seed: Number(e.target.value) })
                }
                className="h-9"
                placeholder="-1"
              />
              <p className="text-xs text-muted-foreground/60">
                {t("imageGeneration.properties.seedHint")}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: 选中图层属性 (仅选中时显示) */}
        {selectedLayer && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("imageGeneration.properties.selectedLayer")}</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="layer-desc" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.description")}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <textarea
                  id="layer-desc"
                  value={layerProps.description}
                  onChange={(e) => handleLayerPropChange("description", e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                  placeholder={t("imageGeneration.properties.descriptionPlaceholder2")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("imageGeneration.properties.descriptionRequired2")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="layer-ref-image" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.referenceImage")} {t("imageGeneration.properties.referenceImageOptional")}
                </Label>

                {/* 选择按钮 */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowMaterialSelector(true)}
                  disabled={materialsLoading}
                >
                  {layerProps.reference_image ? (
                    <span className="truncate">
                      {t("imageGeneration.properties.imageSelected")}{selectedMaterialTitle || layerProps.reference_image}
                    </span>
                  ) : (
                    t("imageGeneration.properties.selectImageFromMaterials")
                  )}
                </Button>

                {/* 预览缩略图 */}
                {layerProps.reference_image && (
                  <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img
                      src={layerProps.reference_image}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleLayerPropChange("reference_image", "")}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                )}

                {/* 获取了所有数据后传递给对话框 */}
                <MaterialSelectorDialog
                  open={showMaterialSelector}
                  onOpenChange={setShowMaterialSelector}
                  materials={imageMaterials}
                  isLoading={materialsLoading}
                  hasMore={hasMoreMaterials}
                  onLoadMore={loadMoreMaterials}
                  observerTarget={materialsObserverTarget}
                  onSelect={(url) => handleLayerPropChange("reference_image", url)}
                  currentUrl={layerProps.reference_image}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="layer-zindex" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.zIndex")}: {layerProps.z_index}
                </Label>
                <Slider
                  id="layer-zindex"
                  value={[layerProps.z_index]}
                  onValueChange={([value]) => handleLayerPropChange("z_index", value)}
                  min={0}
                  max={20}
                  step={1}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: 全局样式 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("imageGeneration.properties.globalStyle")}</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="medium" className="text-sm text-muted-foreground">
                {t("imageGeneration.properties.medium")}
              </Label>
              <Select
                value={globalStyleSettings.medium}
                onValueChange={(value) =>
                  onGlobalStyleSettingsChange({
                    ...globalStyleSettings,
                    medium: value as any,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("imageGeneration.properties.selectMedium")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Photography">{t("imageGeneration.properties.mediums.photography")}</SelectItem>
                  <SelectItem value="Digital Illustration">{t("imageGeneration.properties.mediums.digitalIllustration")}</SelectItem>
                  <SelectItem value="Oil Painting">{t("imageGeneration.properties.mediums.oilPainting")}</SelectItem>
                  <SelectItem value="Watercolor">{t("imageGeneration.properties.mediums.watercolor")}</SelectItem>
                  <SelectItem value="3D Render">{t("imageGeneration.properties.mediums.render3d")}</SelectItem>
                  <SelectItem value="Sketch">{t("imageGeneration.properties.mediums.sketch")}</SelectItem>
                  <SelectItem value="Glass">{t("imageGeneration.properties.mediums.glass")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style" className="text-sm text-muted-foreground">
                {t("imageGeneration.properties.style")}
              </Label>
              <Select
                value={globalStyleSettings.style}
                onValueChange={(value) =>
                  onGlobalStyleSettingsChange({
                    ...globalStyleSettings,
                    style: value as any,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("imageGeneration.properties.selectStyle")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Renaissance">{t("imageGeneration.properties.styles.renaissance")}</SelectItem>
                  <SelectItem value="Impressionism">{t("imageGeneration.properties.styles.impressionism")}</SelectItem>
                  <SelectItem value="Surrealism">{t("imageGeneration.properties.styles.surrealism")}</SelectItem>
                  <SelectItem value="Minimalism">{t("imageGeneration.properties.styles.minimalism")}</SelectItem>
                  <SelectItem value="Baroque">{t("imageGeneration.properties.styles.baroque")}</SelectItem>
                  <SelectItem value="Ukiyo-e">{t("imageGeneration.properties.styles.ukiyoe")}</SelectItem>
                  <SelectItem value="Vaporwave">{t("imageGeneration.properties.styles.vaporwave")}</SelectItem>
                  <SelectItem value="Cyberpunk">{t("imageGeneration.properties.styles.cyberpunk")}</SelectItem>
                  <SelectItem value="Ghibli">{t("imageGeneration.properties.styles.ghibli")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_accent" className="text-sm text-muted-foreground">
                {t("imageGeneration.properties.colorAccent")}
              </Label>
              <Select
                value={globalStyleSettings.color_accent}
                onValueChange={(value) =>
                  onGlobalStyleSettingsChange({
                    ...globalStyleSettings,
                    color_accent: value as any,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("imageGeneration.properties.selectColorAccent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monochrome">{t("imageGeneration.properties.colorAccents.monochrome")}</SelectItem>
                  <SelectItem value="Cool Tones">{t("imageGeneration.properties.colorAccents.coolTones")}</SelectItem>
                  <SelectItem value="Warm Tones">{t("imageGeneration.properties.colorAccents.warmTones")}</SelectItem>
                  <SelectItem value="Morandi">{t("imageGeneration.properties.colorAccents.morandi")}</SelectItem>
                  <SelectItem value="Pastel">{t("imageGeneration.properties.colorAccents.pastel")}</SelectItem>
                  <SelectItem value="Cinematic Teal & Orange">{t("imageGeneration.properties.colorAccents.cinematic")}</SelectItem>
                  <SelectItem value="Neon">{t("imageGeneration.properties.colorAccents.neon")}</SelectItem>
                  <SelectItem value="Earth Tones">{t("imageGeneration.properties.colorAccents.earthTones")}</SelectItem>
                  <SelectItem value="High Contrast">{t("imageGeneration.properties.colorAccents.highContrast")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 4: 构图设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("imageGeneration.properties.composition")}</h3>
          </div>

          <div className="space-y-3">
            {/* 相机设置 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">{t("imageGeneration.properties.camera")}</Label>

              <div className="space-y-2">
                <Label htmlFor="camera-angle" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.angle")}
                </Label>
                <Select
                  value={compositionSettings.camera.angle}
                  onValueChange={(value) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      camera: {
                        ...compositionSettings.camera,
                        angle: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("imageGeneration.properties.selectAngle")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eye Level">{t("imageGeneration.properties.angles.eyeLevel")}</SelectItem>
                    <SelectItem value="Low Angle">{t("imageGeneration.properties.angles.lowAngle")}</SelectItem>
                    <SelectItem value="High Angle">{t("imageGeneration.properties.angles.highAngle")}</SelectItem>
                    <SelectItem value="Top Down">{t("imageGeneration.properties.angles.topDown")}</SelectItem>
                    <SelectItem value="Dutch Angle">{t("imageGeneration.properties.angles.dutchAngle")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focal-length" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.focalLength")}
                </Label>
                <Select
                  value={compositionSettings.camera.focal_length}
                  onValueChange={(value) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      camera: {
                        ...compositionSettings.camera,
                        focal_length: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("imageGeneration.properties.selectFocalLength")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14mm">{t("imageGeneration.properties.focalLengths.14mm")}</SelectItem>
                    <SelectItem value="35mm">{t("imageGeneration.properties.focalLengths.35mm")}</SelectItem>
                    <SelectItem value="50mm">{t("imageGeneration.properties.focalLengths.50mm")}</SelectItem>
                    <SelectItem value="85mm">{t("imageGeneration.properties.focalLengths.85mm")}</SelectItem>
                    <SelectItem value="200mm">{t("imageGeneration.properties.focalLengths.200mm")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depth-of-field" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.depthOfField")}
                </Label>
                <Select
                  value={compositionSettings.camera.depth_of_field}
                  onValueChange={(value) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      camera: {
                        ...compositionSettings.camera,
                        depth_of_field: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("imageGeneration.properties.selectDepthOfField")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shallow">{t("imageGeneration.properties.depths.shallow")}</SelectItem>
                    <SelectItem value="Deep">{t("imageGeneration.properties.depths.deep")}</SelectItem>
                    <SelectItem value="Macro">{t("imageGeneration.properties.depths.macro")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 灯光设置 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">{t("imageGeneration.properties.lighting")}</Label>

              <div className="space-y-2">
                <Label htmlFor="lighting-type" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.type")}
                </Label>
                <Select
                  value={compositionSettings.lighting.type}
                  onValueChange={(value) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      lighting: {
                        ...compositionSettings.lighting,
                        type: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("imageGeneration.properties.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Natural Light">{t("imageGeneration.properties.types.natural")}</SelectItem>
                    <SelectItem value="Studio Light">{t("imageGeneration.properties.types.studio")}</SelectItem>
                    <SelectItem value="Volumetric Lighting">{t("imageGeneration.properties.types.volumetric")}</SelectItem>
                    <SelectItem value="Cinematic Lighting">{t("imageGeneration.properties.types.cinematic")}</SelectItem>
                    <SelectItem value="Neon Light">{t("imageGeneration.properties.types.neon")}</SelectItem>
                    <SelectItem value="Rim Lighting">{t("imageGeneration.properties.types.rim")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light-source" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.source")}
                </Label>
                <Select
                  value={compositionSettings.lighting.source}
                  onValueChange={(value) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      lighting: {
                        ...compositionSettings.lighting,
                        source: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("imageGeneration.properties.selectSource")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Front">{t("imageGeneration.properties.sources.front")}</SelectItem>
                    <SelectItem value="Side">{t("imageGeneration.properties.sources.side")}</SelectItem>
                    <SelectItem value="Top-down">{t("imageGeneration.properties.sources.topDown")}</SelectItem>
                    <SelectItem value="Bottom-up">{t("imageGeneration.properties.sources.bottomUp")}</SelectItem>
                    <SelectItem value="Backlight">{t("imageGeneration.properties.sources.backlight")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lighting-intensity" className="text-sm text-muted-foreground">
                  {t("imageGeneration.properties.intensity")}: {compositionSettings.lighting.intensity.toFixed(1)}
                </Label>
                <Slider
                  id="lighting-intensity"
                  value={[compositionSettings.lighting.intensity]}
                  onValueChange={([value]) =>
                    onCompositionSettingsChange({
                      ...compositionSettings,
                      lighting: {
                        ...compositionSettings.lighting,
                        intensity: value,
                      },
                    })
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            {t("imageGeneration.properties.infoBox")}
          </p>
        </div>
      </div>
    </div>
  )
}
