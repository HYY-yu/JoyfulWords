"use client"

import React, { useState, useEffect, useRef } from "react"
import { Layers, Upload, Clock, CheckCircle, AlertCircle, RefreshCw, Image as ImageIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { imageGenerationClient, type WavespeedTask, type WavespeedTaskDetail } from "@/lib/api/image-generation/client"
import { GenerationLoadingOverlay } from "../dialogs/generation-loading-overlay"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/base/tabs"
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

interface WavespeedModeProps {
  className?: string
}

export function WavespeedMode({ className }: WavespeedModeProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  // 状态管理
  const [activeTab, setActiveTab] = useState("upload")
  const [tasks, setTasks] = useState<WavespeedTask[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [currentTaskDetail, setCurrentTaskDetail] = useState<WavespeedTaskDetail | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [generatingMessage, setGeneratingMessage] = useState("")

  // 轮询相关
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true)
      const result = await imageGenerationClient.getWavespeedTasks()
      
      if ('error' in result) {
        console.error('Failed to fetch tasks:', result.error)
        toast({
          variant: "destructive",
          title: "获取任务列表失败",
          description: result.error as string,
        })
        return
      }
      
      setTasks(result)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        variant: "destructive",
        title: "获取任务列表失败",
        description: "网络错误，请稍后重试",
      })
    } finally {
      setIsLoadingTasks(false)
    }
  }

  // 创建任务
  const handleCreateTask = async () => {
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
      const result = await imageGenerationClient.createWavespeedTask({ image_url: imageUrl })
      
      if ('error' in result) {
        console.error('Failed to create task:', result.error)
        toast({
          variant: "destructive",
          title: "创建任务失败",
          description: result.error as string,
        })
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
        // 任务完成，获取详情
        await fetchTaskDetail(taskId)
        stopPolling()
        setIsPolling(false)
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

  // 获取任务详情
  const fetchTaskDetail = async (taskId: string) => {
    try {
      const result = await imageGenerationClient.getWavespeedTaskDetail(taskId)
      
      if ('error' in result) {
        console.error('Failed to fetch task detail:', result.error)
        toast({
          variant: "destructive",
          title: "获取任务详情失败",
          description: result.error as string,
        })
        return
      }

      setCurrentTaskDetail(result)
      setGeneratingMessage("")
      
      toast({
        title: "任务完成",
        description: `成功拆分为 ${result.sub_images.length} 个子图`,
      })
    } catch (error) {
      console.error('Error fetching task detail:', error)
      toast({
        variant: "destructive",
        title: "获取任务详情失败",
        description: "网络错误，请稍后重试",
      })
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

  // 切换到任务列表时获取任务
  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks()
    }
  }, [activeTab, fetchTasks])

  // 状态徽章
  const StatusBadge = ({ status }: { status: string }) => {
    let variant: BadgeProps['variant'] = 'default'
    let label = status

    switch (status) {
      case 'pending':
        variant = 'secondary'
        label = '待处理'
        break
      case 'querying':
        variant = 'default'
        label = '处理中'
        break
      case 'completed':
        variant = 'outline'
        label = '已完成'
        break
      case 'failed':
        variant = 'destructive'
        label = '失败'
        break
    }

    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    )
  }

  return (
    <div className={`flex-1 p-8 overflow-hidden flex flex-col ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upload">上传图片</TabsTrigger>
          <TabsTrigger value="tasks">任务列表</TabsTrigger>
        </TabsList>

        {/* 上传图片标签页 */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                上传图片
              </CardTitle>
              <CardDescription>
                输入图片 URL 进行拆分，系统会将图片拆分为多个子图
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">图片 URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isCreatingTask || isPolling}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCreateTask}
                disabled={isCreatingTask || isPolling}
                className="w-full"
              >
                {isCreatingTask ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    创建任务中...
                  </>
                ) : (
                  "开始拆分"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* 结果展示 */}
          {currentTaskDetail && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  拆分结果
                </CardTitle>
                <CardDescription>
                  原始图片: {currentTaskDetail.image_url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentTaskDetail.sub_images.map((subImage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={subImage} 
                          alt={`子图 ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-center">子图 {index + 1}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 任务列表标签页 */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                任务列表
              </CardTitle>
              <CardDescription>
                查看所有图片拆分任务的状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">暂无任务</h3>
                  <p className="text-muted-foreground mt-2">
                    上传图片开始拆分任务
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>任务 ID</TableHead>
                        <TableHead>图片 URL</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.task_id}>
                          <TableCell className="font-medium">
                            {task.task_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="truncate max-w-[300px]">
                            {task.image_url}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={task.status} />
                          </TableCell>
                          <TableCell>
                            {new Date(task.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={fetchTasks}
                disabled={isLoadingTasks}
                variant="secondary"
              >
                {isLoadingTasks ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    刷新中...
                  </>
                ) : (
                  "刷新列表"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 加载覆盖层 */}
      {isPolling && (
        <GenerationLoadingOverlay
          isOpen={isPolling}
          message={generatingMessage}
          progress={null} // 不确定进度
        />
      )}
    </div>
  )
}
