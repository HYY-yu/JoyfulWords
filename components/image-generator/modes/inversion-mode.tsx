"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Split, Download, CheckCircle2, Layers, Clock, AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { uploadImageToR2 } from "@/lib/tiptap-image-upload"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/base/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/base/card"
import {
  Button,
  ButtonProps,
} from "@/components/ui/base/button"
import {
  Input,
  InputProps,
} from "@/components/ui/base/input"
import {
  Label,
  LabelProps,
} from "@/components/ui/base/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/base/table"
import {
  Skeleton,
} from "@/components/ui/base/skeleton"
import {
  Badge,
  BadgeProps,
} from "@/components/ui/base/badge"
import {
  ScrollArea,
} from "@/components/ui/base/scroll-area"

const POLLING_INTERVAL = 5000 // 5秒

type LayerImage = {
  id: string
  name: string
  nameEn: string
  imageUrl: string
  description: string
  index: number
}

type SplitStatus = "idle" | "uploading" | "splitting" | "completed" | "error"

export function InversionMode() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  // 标签页状态
  const [activeTab, setActiveTab] = useState("split")

  // 图片拆分状态
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [splitStatus, setSplitStatus] = useState<SplitStatus>("idle")
  const [layerImages, setLayerImages] = useState<LayerImage[]>([])
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [taskOutputs, setTaskOutputs] = useState<string[]>([])

  // Wavespeed 任务管理状态
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [generatingMessage, setGeneratingMessage] = useState("")
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // 先显示本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // 上传到CDN
      const cdnUrl = await uploadImageToR2(file)
      setImageUrl(cdnUrl)
      setLayerImages([])
      setSelectedLayers(new Set())
      setSplitStatus("idle")
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error instanceof Error ? error.message : "图片上传失败，请稍后重试",
      })
    }
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleSplit = useCallback(() => {
    if (!uploadedImage) return

    setSplitStatus("splitting")
    setIsProcessing(true)

    // 模拟 API 拆分过程
    setTimeout(() => {
      // 生成模拟的拆分层，使用翻译键
      const mockLayers: LayerImage[] = [
        {
          id: "layer-1",
          name: t("imageGeneration.inversionMode.layers.mainSubject.name"),
          nameEn: t("imageGeneration.inversionMode.layers.mainSubject.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.mainSubject.description"),
          index: 0
        },
        {
          id: "layer-2",
          name: t("imageGeneration.inversionMode.layers.background.name"),
          nameEn: t("imageGeneration.inversionMode.layers.background.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.background.description"),
          index: 1
        },
        {
          id: "layer-3",
          name: t("imageGeneration.inversionMode.layers.details.name"),
          nameEn: t("imageGeneration.inversionMode.layers.details.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.details.description"),
          index: 2
        },
        {
          id: "layer-4",
          name: t("imageGeneration.inversionMode.layers.lighting.name"),
          nameEn: t("imageGeneration.inversionMode.layers.lighting.name"),
          imageUrl: uploadedImage,
          description: t("imageGeneration.inversionMode.layers.lighting.description"),
          index: 3
        }
      ]

      setLayerImages(mockLayers)
      setSplitStatus("completed")
      setIsProcessing(false)
    }, 3000)
  }, [uploadedImage, t])

  const handleToggleLayer = (layerId: string) => {
    setSelectedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedLayers.size === layerImages.length) {
      setSelectedLayers(new Set())
    } else {
      setSelectedLayers(new Set(layerImages.map(l => l.id)))
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedLayers.size === 0) return

    // 下载选中的图层
    for (const layerId of selectedLayers) {
      const layer = layerImages.find(l => l.id === layerId)
      if (layer) {
        const link = document.createElement("a")
        link.href = layer.imageUrl
        link.download = `${layer.nameEn.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
        link.click()
        // 添加延迟避免浏览器阻止多次下载
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setLayerImages([])
    setSelectedLayers(new Set())
    setSplitStatus("idle")
    setIsProcessing(false)
  }

  // 创建任务
  const handleCreateTask = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "请先登录",
        description: "需要登录才能使用图片拆分功能",
      })
      // 跳转到登录页面
      window.location.href = '/auth/login?redirect=/dashboard'
      return
    }

    if (!imageUrl) {
      toast({
        variant: "destructive",
        title: "请输入图片 URL",
        description: "请提供要拆分的图片 URL",
      })
      return
    }

    try {
      setIsCreatingTask(true)
      setSplitStatus("splitting")
      const result = await imageGenerationClient.createWavespeedTask({ image_url: imageUrl })
      
      if ('error' in result) {
        console.error('Failed to create task:', result.error)
        toast({
          variant: "destructive",
          title: "创建任务失败",
          description: result.error as string,
        })
        setSplitStatus("idle")
        return
      }

      const taskId = result.task_id
      setCurrentTaskId(taskId)
      setGeneratingMessage("任务已创建，正在处理中...")
      setIsPolling(true)
      
      // 开始轮询
      startPolling(taskId)
      
      toast({
        title: "任务创建成功",
        description: "正在处理图片拆分，请稍候",
      })
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        variant: "destructive",
        title: "创建任务失败",
        description: "网络错误，请稍后重试",
      })
      setSplitStatus("idle")
    } finally {
      setIsCreatingTask(false)
    }
  }

  // 开始轮询
  const startPolling = (taskId: string) => {
    // 清除之前的轮询
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
    }

    // 立即查询一次
    checkTaskStatus(taskId)

    // 设置轮询
    pollingTimerRef.current = setInterval(() => {
      checkTaskStatus(taskId)
    }, POLLING_INTERVAL)
  }

  // 检查任务状态
  const checkTaskStatus = async (taskId: string) => {
    try {
      const result = await imageGenerationClient.getWavespeedTaskStatus(taskId)
      
      if ('error' in result) {
        console.error('Failed to check task status:', result.error)
        stopPolling()
        setIsPolling(false)
        setCurrentTaskId(null)
        toast({
          variant: "destructive",
          title: "查询任务状态失败",
          description: result.error as string,
        })
        return
      }

      if (result.status === 'completed') {
        // 任务完成，直接使用响应中的outputs
        setTaskOutputs(result.outputs)
        setGeneratingMessage("")
        setSplitStatus("completed")
        stopPolling()
        setIsPolling(false)
        
        toast({
          title: "任务完成",
          description: `成功拆分为 ${result.outputs.length} 个子图`,
        })
      } else if (result.status === 'failed') {
        // 任务失败
        stopPolling()
        setIsPolling(false)
        setCurrentTaskId(null)
        toast({
          variant: "destructive",
          title: "任务失败",
          description: "图片拆分失败，请稍后重试",
        })
      }
    } catch (error) {
      console.error('Error checking task status:', error)
    }
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }

  // 组件卸载时清除轮询
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])



  return (
    <div className="flex-1 p-8 overflow-hidden flex flex-col">
      {/* 标题 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">图片拆分</h2>
        <p className="text-muted-foreground">上传图片并使用 Wavespeed AI 进行拆分</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：上传和预览区 */}
        <div className="w-96 border-r border-border/50 bg-muted/30 flex flex-col">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              上传图片
            </h3>
            <p className="text-xs text-muted-foreground">
              输入图片 URL 或拖拽上传图片文件
            </p>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            {/* 图片 URL 输入 */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="image-url">图片 URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isCreatingTask || isPolling}
              />
            </div>

            {/* 上传区域 */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (isCreatingTask || isPolling) return
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
              className={`
                relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center cursor-pointer overflow-hidden
                ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : uploadedImage
                    ? "border-transparent"
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                }
                ${isCreatingTask || isPolling ? "cursor-not-allowed opacity-60" : ""}
              `}
            >
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className={`
                    p-4 rounded-full mb-3 transition-all duration-300
                    ${isDragging ? "bg-primary/20 scale-110" : "bg-muted"}
                  `}>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    拖拽图片到这里
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    或点击选择文件
                  </p>
                </>
              )}

              {/* 拖拽时的高亮效果 */}
              {isDragging && !uploadedImage && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* 操作按钮 */}
            {(uploadedImage || imageUrl) && splitStatus === "idle" && !isPolling && !isCreatingTask && (
              <button
                onClick={handleCreateTask}
                disabled={isCreatingTask || isPolling}
                className={`
                  mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                  font-medium transition-all duration-200
                  ${
                    isCreatingTask || isPolling
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  }
                `}
              >
                <Split className="w-5 h-5" />
                开始拆分
              </button>
            )}

            {/* 拆分中状态 */}
            {(splitStatus === "splitting" || isPolling) && (
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">
                      处理中
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                    {generatingMessage || '正在处理图片拆分，请稍候...'}
                  </p>
                  </div>
                </div>
              </div>
            )}

            {/* 拆分完成状态 */}
            {splitStatus === "completed" && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      拆分完成
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                    {taskOutputs ? `成功拆分为 ${taskOutputs.length} 个子图` : '图片拆分成功'}
                  </p>
                  </div>
                </div>
              </div>
            )}

            {/* 重置按钮 */}
            {(uploadedImage || imageUrl) && (
              <button
                onClick={() => {
                  handleReset()
                  setImageUrl("")
                  setTaskOutputs([])
                }}
                disabled={isCreatingTask || isPolling}
                className={`
                  mt-auto pt-4 text-sm text-muted-foreground hover:text-destructive
                  transition-colors ${isCreatingTask || isPolling ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                重新上传
              </button>
            )}
          </div>

          {/* 底部提示 */}
          <div className="p-4 border-t border-border/50 bg-background/50">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
              <Layers className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                上传图片后，系统会使用 Wavespeed AI 进行拆分，生成多个子图
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：结果展示区 */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
          {/* 头部 */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  拆分结果
                </span>
                {taskOutputs.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {taskOutputs.length} 个子图
                  </span>
                )}
              </div>

              {/* 批量操作按钮 */}
              {taskOutputs.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    {selectedLayers.size === taskOutputs.length
                      ? "取消全选"
                      : "全选"
                    }
                  </button>
                  {selectedLayers.size > 0 && (
                    <button
                      onClick={handleDownloadSelected}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载选中
                      {selectedLayers.size > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-primary-foreground/20 rounded-full">
                          {selectedLayers.size}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 结果展示 */}
          <div className="flex-1 overflow-y-auto p-6">
            {taskOutputs.length === 0 ? (
              /* 空状态 */
              <div className="h-full flex flex-col items-center justify-center">
                <div className="p-6 rounded-full bg-muted/50 mb-4">
                  <Layers className="w-16 h-16 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  等待拆分结果
                </p>
                <p className="text-sm text-muted-foreground/60 text-center max-w-md">
                  上传图片并点击开始拆分按钮
                </p>
              </div>
            ) : (
              /* 拆分结果 */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {taskOutputs.map((output, index) => {
                  const isSelected = selectedLayers.has(`output-${index}`)
                  return (
                    <div
                      key={index}
                      onClick={() => handleToggleLayer(`output-${index}`)}
                      className={`
                        relative group rounded-xl overflow-hidden cursor-pointer
                        transition-all duration-300 border-2
                        ${
                          isSelected
                            ? "border-primary shadow-lg scale-[1.02]"
                            : "border-border/50 hover:border-primary/50 hover:shadow-md"
                        }
                      `}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {/* 图片 */}
                      <div className="aspect-square bg-muted">
                        <img
                          src={output}
                          alt={`子图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* 覆盖层 */}
                        <div className={`
                          absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300
                          ${isSelected ? "bg-primary/10" : ""}
                        `} />
                      </div>

                      {/* 图片信息 */}
                      <div className="p-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary">
                                #{index + 1}
                              </span>
                              <h4 className="text-sm font-semibold text-foreground truncate">
                                子图 {index + 1}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              从原始图片拆分而来
                            </p>
                          </div>

                          {/* 选择指示器 */}
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                            transition-all duration-200 ml-2 flex-shrink-0
                            ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-border group-hover:border-primary/50"
                            }
                          `}>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 选中标记 */}
                      {isSelected && (
                        <div className="absolute top-3 left-3">
                          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                            已选择
                          </div>
                        </div>
                      )}

                      {/* 悬浮时显示预览按钮 */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // 可以添加预览功能
                          }}
                          className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 底部统计栏 */}
          {taskOutputs.length > 0 && (
            <div className="p-4 border-t border-border/50 bg-background/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  已选择: {selectedLayers.size} / {taskOutputs.length}
                </span>
                {selectedLayers.size > 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    下载选中
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 加载覆盖层 */}
      {isPolling && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-xl max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h3 className="text-lg font-medium mb-2">处理中</h3>
            <p className="text-muted-foreground mb-4">{generatingMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}
