"use client"

import type { Layer, EnvironmentSettings, RenderSettings, LayerProps } from "./types"
import { SlidersHorizontal, Layers, Settings2 } from "lucide-react"
import { Input } from "@/components/ui/base/input"
import { Label } from "@/components/ui/base/label"
import { Slider } from "@/components/ui/base/slider"

interface PropertiesPanelProps {
  selectedLayer: Layer | null
  envSettings: EnvironmentSettings
  renderSettings: RenderSettings
  layerProps: LayerProps
  onEnvSettingsChange: (settings: EnvironmentSettings) => void
  onRenderSettingsChange: (settings: RenderSettings) => void
  onLayerPropsChange: (props: LayerProps) => void
}

export function PropertiesPanel({
  selectedLayer,
  envSettings,
  renderSettings,
  layerProps,
  onEnvSettingsChange,
  onRenderSettingsChange,
  onLayerPropsChange,
}: PropertiesPanelProps) {
  const handleLayerPropChange = (key: keyof LayerProps, value: string | number) => {
    onLayerPropsChange({ ...layerProps, [key]: value })
  }

  return (
    <div className="w-80 border-l border-border bg-background overflow-auto">
      <div className="p-6 space-y-6">
        {/* Section 1: 基础环境 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">基础环境</h3>
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
                  value={envSettings.width}
                  onChange={(e) =>
                    onEnvSettingsChange({ ...envSettings, width: Number(e.target.value) })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm text-muted-foreground">
                  高度
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={envSettings.height}
                  onChange={(e) =>
                    onEnvSettingsChange({ ...envSettings, height: Number(e.target.value) })
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style" className="text-sm text-muted-foreground">
                风格
              </Label>
              <select
                id="style"
                value={envSettings.style}
                onChange={(e) =>
                  onEnvSettingsChange({ ...envSettings, style: e.target.value })
                }
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="realistic">写实风格</option>
                <option value="anime">动漫风格</option>
                <option value="oil">油画风格</option>
                <option value="watercolor">水彩风格</option>
                <option value="sketch">素描风格</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighting" className="text-sm text-muted-foreground">
                光影
              </Label>
              <select
                id="lighting"
                value={envSettings.lighting}
                onChange={(e) =>
                  onEnvSettingsChange({ ...envSettings, lighting: e.target.value })
                }
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="natural">自然光</option>
                <option value="studio">摄影棚</option>
                <option value="golden">黄金时刻</option>
                <option value="dramatic">戏剧性</option>
                <option value="soft">柔和光</option>
              </select>
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
                <Label htmlFor="layer-label" className="text-sm text-muted-foreground">
                  标签
                </Label>
                <Input
                  id="layer-label"
                  value={layerProps.label}
                  onChange={(e) => handleLayerPropChange("label", e.target.value)}
                  className="h-9"
                  placeholder="输入图层标签..."
                />
              </div>

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
                <Label htmlFor="layer-zindex" className="text-sm text-muted-foreground">
                  层级: {layerProps.zIndex}
                </Label>
                <Slider
                  id="layer-zindex"
                  value={[layerProps.zIndex]}
                  onValueChange={([value]) => handleLayerPropChange("zIndex", value)}
                  min={0}
                  max={20}
                  step={1}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: 渲染控制 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Settings2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">渲染控制</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="steps" className="text-sm text-muted-foreground">
                采样步数: {renderSettings.steps}
              </Label>
              <Slider
                id="steps"
                value={[renderSettings.steps]}
                onValueChange={([value]) =>
                  onRenderSettingsChange({ ...renderSettings, steps: value })
                }
                min={1}
                max={50}
                step={1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground/60">
                步数越多，生成质量越高，但耗时越长
              </p>
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
