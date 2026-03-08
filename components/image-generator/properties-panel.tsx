"use client"

import type { Layer, MetaSettings, GlobalStyleSettings, CompositionSettings, LayerProps } from "./types"
import { Image as ImageIcon, Palette, Camera, Lightbulb, Layers } from "lucide-react"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Slider } from "@/components/ui/base/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"

interface PropertiesPanelProps {
  selectedLayer: Layer | null
  metaSettings: MetaSettings
  globalStyleSettings: GlobalStyleSettings
  compositionSettings: CompositionSettings
  layerProps: LayerProps
  onMetaSettingsChange: (settings: MetaSettings) => void
  onGlobalStyleSettingsChange: (settings: GlobalStyleSettings) => void
  onCompositionSettingsChange: (settings: CompositionSettings) => void
  onLayerPropsChange: (props: LayerProps) => void
}

export function PropertiesPanel({
  selectedLayer,
  metaSettings,
  globalStyleSettings,
  compositionSettings,
  layerProps,
  onMetaSettingsChange,
  onGlobalStyleSettingsChange,
  onCompositionSettingsChange,
  onLayerPropsChange,
}: PropertiesPanelProps) {
  const handleLayerPropChange = (key: keyof LayerProps, value: string | number) => {
    onLayerPropsChange({ ...layerProps, [key]: value })
  }

  return (
    <div className="w-80 border-l border-border bg-background overflow-auto">
      <div className="p-6 space-y-6">
        {/* Section 1: 元数据设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">元数据</h3>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm text-muted-foreground">
                  宽度
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
                  高度
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
                随机种子
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
                设置为 -1 表示随机种子
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: 选中图层属性 (仅选中时显示) */}
        {selectedLayer && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">选中图层属性</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="layer-desc" className="text-sm text-muted-foreground">
                  描述
                </Label>
                <textarea
                  id="layer-desc"
                  value={layerProps.description}
                  onChange={(e) => handleLayerPropChange("description", e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                  placeholder="输入图层描述..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="layer-ref-image" className="text-sm text-muted-foreground">
                  参考图片 (可选)
                </Label>
                <Input
                  id="layer-ref-image"
                  type="url"
                  value={layerProps.reference_image || ""}
                  onChange={(e) => handleLayerPropChange("reference_image", e.target.value)}
                  className="h-9"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="layer-zindex" className="text-sm text-muted-foreground">
                  层级: {layerProps.z_index}
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
            <h3 className="font-semibold text-foreground">全局样式</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="medium" className="text-sm text-muted-foreground">
                艺术媒介
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
                  <SelectValue placeholder="选择艺术媒介" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Photography">摄影</SelectItem>
                  <SelectItem value="Digital Illustration">数字插画</SelectItem>
                  <SelectItem value="Oil Painting">油画</SelectItem>
                  <SelectItem value="Watercolor">水彩</SelectItem>
                  <SelectItem value="3D Render">3D 渲染</SelectItem>
                  <SelectItem value="Sketch">素描</SelectItem>
                  <SelectItem value="Cyberpunk">赛博朋克</SelectItem>
                  <SelectItem value="Glass">玻璃</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style" className="text-sm text-muted-foreground">
                艺术风格
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
                  <SelectValue placeholder="选择艺术风格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Renaissance">文艺复兴</SelectItem>
                  <SelectItem value="Impressionism">印象派</SelectItem>
                  <SelectItem value="Surrealism">超现实主义</SelectItem>
                  <SelectItem value="Minimalism">极简主义</SelectItem>
                  <SelectItem value="Baroque">巴洛克</SelectItem>
                  <SelectItem value="Ukiyo-e">浮世绘</SelectItem>
                  <SelectItem value="Vaporwave">蒸汽波</SelectItem>
                  <SelectItem value="Ghibli">吉卜力</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_accent" className="text-sm text-muted-foreground">
                色调
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
                  <SelectValue placeholder="选择色调" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monochrome">单色</SelectItem>
                  <SelectItem value="Pastel">粉彩</SelectItem>
                  <SelectItem value="Earth Tones">大地色</SelectItem>
                  <SelectItem value="Neon">霓虹</SelectItem>
                  <SelectItem value="Cinematic Teal & Orange">电影青橙</SelectItem>
                  <SelectItem value="Morandi">莫兰迪</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 4: 构图设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">构图设置</h3>
          </div>

          <div className="space-y-3">
            {/* 相机设置 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">相机</Label>

              <div className="space-y-2">
                <Label htmlFor="camera-angle" className="text-sm text-muted-foreground">
                  拍摄角度
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
                    <SelectValue placeholder="选择拍摄角度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eye Level">水平视角</SelectItem>
                    <SelectItem value="Low Angle">低角度</SelectItem>
                    <SelectItem value="High Angle">高角度</SelectItem>
                    <SelectItem value="Top Down">俯视</SelectItem>
                    <SelectItem value="Dutch Angle">荷兰角</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focal-length" className="text-sm text-muted-foreground">
                  焦距
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
                    <SelectValue placeholder="选择焦距" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14mm">14mm (超广角)</SelectItem>
                    <SelectItem value="35mm">35mm (广角)</SelectItem>
                    <SelectItem value="50mm">50mm (标准)</SelectItem>
                    <SelectItem value="85mm">85mm (人像)</SelectItem>
                    <SelectItem value="200mm">200mm (长焦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depth-of-field" className="text-sm text-muted-foreground">
                  景深
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
                    <SelectValue placeholder="选择景深" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shallow">浅景深</SelectItem>
                    <SelectItem value="Deep">深景深</SelectItem>
                    <SelectItem value="Macro">微距</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 灯光设置 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">灯光</Label>

              <div className="space-y-2">
                <Label htmlFor="lighting-type" className="text-sm text-muted-foreground">
                  灯光类型
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
                    <SelectValue placeholder="选择灯光类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Natural Light">自然光</SelectItem>
                    <SelectItem value="Studio Light">摄影棚</SelectItem>
                    <SelectItem value="Volumetric Lighting">体积光</SelectItem>
                    <SelectItem value="Cinematic Lighting">电影光</SelectItem>
                    <SelectItem value="Neon Light">霓虹灯</SelectItem>
                    <SelectItem value="Rim Lighting">轮廓光</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light-source" className="text-sm text-muted-foreground">
                  光源位置
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
                    <SelectValue placeholder="选择光源位置" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Front">正面</SelectItem>
                    <SelectItem value="Side">侧面</SelectItem>
                    <SelectItem value="Top-down">顶部</SelectItem>
                    <SelectItem value="Bottom-up">底部</SelectItem>
                    <SelectItem value="Backlight">背光</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lighting-intensity" className="text-sm text-muted-foreground">
                  光照强度: {compositionSettings.lighting.intensity.toFixed(1)}
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
            <span className="font-medium text-foreground">提示:</span> 选中画布中的矩形图层可编辑其属性
          </p>
        </div>
      </div>
    </div>
  )
}
