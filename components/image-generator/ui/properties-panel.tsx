"use client"

/* eslint-disable @next/next/no-img-element */

import type { Layer, MetaSettings, GlobalStyleSettings, CompositionSettings, LayerProps } from "../types"
import { Image as ImageIcon, Palette, Camera, Lightbulb, Layers, Cpu, Loader2, Upload } from "lucide-react"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Slider } from "@/components/ui/base/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Button } from "@/components/ui/base/button"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { ModelSelector } from "./model-selector"
import { MaterialSelectorDialog } from "./material-selector-dialog"
import { useState, useMemo } from "react"
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials"
import { cn } from "@/lib/utils"
import { getMatchedSizePreset, IMAGE_SIZE_PRESETS } from "../presets"
import { isSupportedImageFile, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/upload-file"

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
  allowReferenceMaterialSelector?: boolean
  uploadReferenceImage?: (file: File) => Promise<string>
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
  allowReferenceMaterialSelector = true,
  uploadReferenceImage,
}: PropertiesPanelProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  // 新增：对话框状态
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [isUploadingReferenceImage, setIsUploadingReferenceImage] = useState(false)

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

  const activeSizePreset = useMemo(
    () => getMatchedSizePreset(metaSettings),
    [metaSettings]
  )

  const handleLayerPropChange = (key: keyof LayerProps, value: string | number) => {
    onLayerPropsChange({ ...layerProps, [key]: value })
  }

  const handleReferenceImageUpload = async (file: File) => {
    if (!isSupportedImageFile(file)) {
      toast({
        variant: "destructive",
        title: t("imageGeneration.toast.error.invalidFileType"),
      })
      return
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      toast({
        variant: "destructive",
        title: t("materials.dialog.imageTooLarge"),
      })
      return
    }

    if (!uploadReferenceImage) return

    setIsUploadingReferenceImage(true)
    try {
      const imageUrl = await uploadReferenceImage(file)
      handleLayerPropChange("reference_image", imageUrl)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[ImageGeneration] Reference image upload failed", {
        error: errorMessage,
      })
      toast({
        variant: "destructive",
        title: t("imageGeneration.properties.referenceUploadFailed"),
        description: errorMessage,
      })
    } finally {
      setIsUploadingReferenceImage(false)
    }
  }

  return (
    <div className="w-[360px] shrink-0 border-l border-border bg-muted/20 overflow-auto">
      <div className="p-4 space-y-4">
        {/* 新增: 模型选择器 */}
        <div className="rounded-lg border border-border bg-background p-4 space-y-4">
          <div className="flex items-center gap-2">
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
        <div className="rounded-lg border border-border bg-background p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{t("imageGeneration.properties.metadata")}</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t("imageGeneration.properties.sizePreset")}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors",
                      activeSizePreset === preset.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:bg-muted"
                    )}
                    onClick={() =>
                      onMetaSettingsChange({
                        ...metaSettings,
                        width: preset.width,
                        high: preset.high,
                      })
                    }
                  >
                    <div className="text-sm font-medium text-foreground">
                      {t(preset.titleKey)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
          </div>
        </div>

        {/* Section 2: 选中图层属性 (仅选中时显示) */}
        {selectedLayer && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
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

                {allowReferenceMaterialSelector ? (
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
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    disabled={isUploadingReferenceImage || !uploadReferenceImage}
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.onchange = (event) => {
                        const file = (event.target as HTMLInputElement).files?.[0]
                        if (file) {
                          void handleReferenceImageUpload(file)
                        }
                      }
                      input.click()
                    }}
                  >
                    {isUploadingReferenceImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="truncate">
                      {layerProps.reference_image
                        ? t("imageGeneration.properties.referenceUploadReplace")
                        : t("imageGeneration.properties.referenceUpload")}
                    </span>
                  </Button>
                )}

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
                {allowReferenceMaterialSelector ? (
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
                ) : null}
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
        <div className="rounded-lg border border-border bg-background p-4 space-y-4">
          <div className="flex items-center gap-2">
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
        <details className="rounded-lg border border-border bg-background p-4">
          <summary className="cursor-pointer font-semibold text-foreground">
            <span className="inline-flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            {t("imageGeneration.properties.composition")}
            </span>
          </summary>

          <div className="mt-4 space-y-3">
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
        </details>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {t("imageGeneration.properties.infoBox")}
          </p>
        </div>
      </div>
    </div>
  )
}
