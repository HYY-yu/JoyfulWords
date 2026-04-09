"use client"

import { useState, useEffect, type ReactNode } from "react"
import {
  PencilIcon,
  NetworkIcon,
  ImageIcon,
  RefreshCwIcon,
  PaletteIcon,
  ClipboardListIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { EditorTaskProgress, type TaskItem, type TaskType } from "./editor-task-progress"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import { TaskType as TaskCenterTaskType } from "@/lib/api/taskcenter/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/base/dialog"
import { Badge } from "@/components/ui/base/badge"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Spinner } from "@/components/ui/custom/spinner"
import { imageGenerationClient } from "@/lib/api/image-generation/client"
import { CreatorMode } from "@/components/image-generator/creator-mode"
import { InversionMode } from "@/components/image-generator/modes/inversion-mode"
import { StyleMode } from "@/components/image-generator/modes/style-mode"
import { InfographicDialog } from "./infographic-dialog"

type ActiveDialog =
  | "ai-edit"
  | "mindmap"
  | "create-image"
  | "reversal-mode"
  | "image-style"
  | "infographic"
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
}

const FEATURE_BUTTONS: FeatureButton[] = [
  {
    id: "ai-edit",
    labelKey: "tiptapEditor.aiPanel.aiEdit",
    icon: PencilIcon,
    bgColor: "bg-blue-50",
  },
  {
    id: "mindmap",
    labelKey: "tiptapEditor.aiPanel.mindmap",
    icon: NetworkIcon,
    bgColor: "bg-emerald-50",
  },
  {
    id: "create-image",
    labelKey: "tiptapEditor.aiPanel.createImage",
    icon: ImageIcon,
    bgColor: "bg-indigo-50",
  },
  {
    id: "reversal-mode",
    labelKey: "tiptapEditor.aiPanel.reversalMode",
    icon: RefreshCwIcon,
    bgColor: "bg-pink-50",
  },
  {
    id: "image-style",
    labelKey: "tiptapEditor.aiPanel.imageStyle",
    icon: PaletteIcon,
    bgColor: "bg-amber-50",
  },
  {
    id: "infographic",
    labelKey: "tiptapEditor.aiPanel.infographic",
    icon: ClipboardListIcon,
    bgColor: "bg-cyan-50",
  },
]

interface EditorAIPanelProps {
  articleId?: number | null
  aiEditTasks: Map<string, AIEditState>
  activeExecId: string | null
  onSetActiveExecId: (execId: string | null) => void
  onAddTask: (task: AIEditState) => void
  onRemoveTask: (execId: string) => void
}

export function EditorAIPanel({
  articleId,
  aiEditTasks,
  activeExecId,
  onSetActiveExecId,
  onAddTask,
  onRemoveTask,
}: EditorAIPanelProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null)
  const [taskCenterTasks, setTaskCenterTasks] = useState<TaskItem[]>([])
  const [loadingTaskCenter, setLoadingTaskCenter] = useState(false)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [taskDetail, setTaskDetail] = useState<any>(null)
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)
  const [copyingToMaterials, setCopyingToMaterials] = useState(false)
  const [copyToMaterialsError, setCopyToMaterialsError] = useState<string | null>(null)
  const [copyToMaterialsSuccess, setCopyToMaterialsSuccess] = useState<string | null>(null)
  const [isCreateImageOpen, setIsCreateImageOpen] = useState(false)
  const [isReversalModeOpen, setIsReversalModeOpen] = useState(false)
  const [isImageStyleOpen, setIsImageStyleOpen] = useState(false)
  const [isInfographicOpen, setIsInfographicOpen] = useState(false)
  const [selectedInfographicText, setSelectedInfographicText] = useState("")

  const getSelectedEditorText = () => {
    if (typeof window === "undefined") return ""

    const selectionGetter = (window as typeof window & {
      getJoyfulWordsSelectedText?: () => string
    }).getJoyfulWordsSelectedText

    if (typeof selectionGetter !== "function") {
      return ""
    }

    try {
      return selectionGetter()
    } catch (error) {
      console.warn("[EditorAIPanel] Failed to read editor selection:", error)
      return ""
    }
  }

  // 获取任务中心任务
  const fetchTaskCenterTasks = async () => {
    try {
      setLoadingTaskCenter(true)
      // 获取所有类型的任务，过滤掉material类型
      const taskTypes = Object.values(TaskCenterTaskType).filter(type => type !== 'material')
      const allTasks: any[] = []

      for (const type of taskTypes) {
        const tasks = await taskCenterClient.getTasks({ type })
        if (Array.isArray(tasks)) {
          allTasks.push(...tasks)
        }
      }

      // 转换为TaskItem格式
      const taskItems: TaskItem[] = allTasks.map(task => {
        let label = `任务中心 - ${task.type}`;
        
        // 处理图片任务的特殊标签
        if (task.type === 'image') {
          // 尝试从任务数据中获取gen_mode
          let genMode: string | undefined;
          if (task.details?.gen_mode) {
            genMode = task.details.gen_mode;
          } else if (task.detail?.gen_mode) {
            genMode = task.detail.gen_mode;
          } else if (task.gen_mode) {
            genMode = task.gen_mode;
          }
          switch (genMode) {
            case 'split_images':
              label = '拆分图片图层任务';
              break;
            case 'creator':
              label = '创作图片任务';
              break;
            case 'style':
              label = '风格化图片任务';
              break;
            default:
              label = '图片任务';
          }
        } else if (task.type === 'article') {
          // 处理文章任务的特殊标签
          if (task.status === 'init') {
            label = 'AI执行中';
          } else if (task.status === 'draft') {
            label = 'AI已完成';
          } else {
            label = '文章任务';
          }
        } else if (task.type === 'mindmap') {
          label = '思维导图任务';
        } else if (task.type === 'infographic') {
          label = '信息图任务';
        }
        
        // 处理任务状态
        let taskStatus: TaskStatus = "pending";
        if (task.type === 'article') {
          if (task.status === 'draft') {
            taskStatus = "completed";
          } else if (task.status === 'failed') {
            taskStatus = "failed";
          } else {
            taskStatus = "pending";
          }
        } else {
          taskStatus = task.status === "completed" || task.status === "success" || task.status === "done" ? "completed" : 
                     task.status === "failed" ? "failed" : "pending";
        }

        return {
          id: `${task.type}-${task.id.toString()}`,
          type: "task-center" as TaskType,
          status: taskStatus,
          label,
          description: '',
          startedAt: new Date(task.created_at).getTime(),
          taskCenterData: task,
          originalType: task.type
        };
      })

      // 只保留最近的10个任务
      taskItems.sort((a, b) => b.startedAt - a.startedAt)
      setTaskCenterTasks(taskItems.slice(0, 10))
    } catch (error) {
      console.error('获取任务中心任务失败:', error)
    } finally {
      setLoadingTaskCenter(false)
    }
  }

  // 初始加载任务中心任务
  useEffect(() => {
    fetchTaskCenterTasks()
  }, [])

  // 轮询任务中心任务
  useEffect(() => {
    // 检查是否有未完成的任务
    const hasPendingTasks = taskCenterTasks.some(task => task.status === 'pending')
    
    let pollingInterval: NodeJS.Timeout | null = null
    
    // 只有当有未完成任务时才轮询
    if (hasPendingTasks) {
      console.log('发现未完成任务，开始轮询')
      // 每20秒刷新一次任务中心任务
      pollingInterval = setInterval(() => {
        console.log('轮询任务中心任务')
        fetchTaskCenterTasks()
      }, 20000)
    }
    
    // 组件卸载时清除定时器
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [taskCenterTasks])
  
  // 监听任务创建事件
  useEffect(() => {
    const handleTaskCreated = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TASK_CREATED') {
        console.log('收到任务创建事件，刷新任务列表')
        fetchTaskCenterTasks()
      }
    }
    
    window.addEventListener('message', handleTaskCreated)
    
    return () => {
      window.removeEventListener('message', handleTaskCreated)
    }
  }, [])

  // 获取任务详情
  const fetchTaskDetail = async (task: TaskItem) => {
    if (!task.taskCenterData) return

    try {
      setLoadingTaskDetail(true)
      setTaskDetailError(null)
      setSelectedTask(task)
      // 重置加入素材库的状态
      setCopyToMaterialsError(null)
      setCopyToMaterialsSuccess(null)
      // 使用taskCenterData中的原始id，而不是修改后的id
      const data = await taskCenterClient.getTaskDetail(task.taskCenterData.type, task.taskCenterData.id)
      const imageTaskDetail = "gen_mode" in data && "image_urls" in data ? data : null
      // 打印任务详情数据结构，以便调试
      console.log('任务详情数据:', {
        type: task.taskCenterData.type,
        id: task.taskCenterData.id,
        hasImageUrls: !!imageTaskDetail?.image_urls,
        imageUrlsType: typeof imageTaskDetail?.image_urls,
        imageUrlsValue: imageTaskDetail?.image_urls,
        hasReferenceImageUrls: !!imageTaskDetail?.reference_image_urls,
        referenceImageUrlsType: typeof imageTaskDetail?.reference_image_urls,
        referenceImageUrlsValue: imageTaskDetail?.reference_image_urls
      });
      setTaskDetail(data)
      setIsTaskDetailOpen(true)
    } catch (error) {
      setTaskDetailError('获取任务详情失败，请稍后重试')
      console.error('获取任务详情失败:', error)
    } finally {
      setLoadingTaskDetail(false)
    }
  }

  // 加入素材库
  const copyToMaterials = async () => {
    if (!selectedTask || !selectedTask.taskCenterData) return

    try {
      setCopyingToMaterials(true)
      setCopyToMaterialsError(null)
      setCopyToMaterialsSuccess(null)

      const taskId = selectedTask.taskCenterData.id
      const result = await imageGenerationClient.copyToMaterials(taskId, articleId ?? undefined)
      if ('error' in result) {
        throw new Error(String(result.error))
      }

      setCopyToMaterialsSuccess('成功加入素材库')
      console.log('加入素材库成功:', {
        taskId,
        articleId,
        count: result.count,
        materialIds: result.material_ids,
      })
    } catch (error) {
      setCopyToMaterialsError('加入素材库失败，请稍后重试')
      console.error('加入素材库失败:', error)
    } finally {
      setCopyingToMaterials(false)
    }
  }

  function handleOpenDialog(id: ActiveDialog) {
    if (id === 'ai-edit') {
      window.dispatchEvent(new CustomEvent('joyfulwords-open-ai-edit'))
    } else if (id === 'mindmap') {
      window.dispatchEvent(new CustomEvent('joyfulwords-open-ai-mindmap'))
    } else if (id === 'create-image') {
      setIsCreateImageOpen(true)
    } else if (id === 'reversal-mode') {
      setIsReversalModeOpen(true)
    } else if (id === 'image-style') {
      setIsImageStyleOpen(true)
    } else if (id === "infographic") {
      const selectedText = getSelectedEditorText().trim()

      if (!selectedText) {
        toast({
          variant: "destructive",
          title: t("infographicDialog.toast.selectTextFirst"),
          description: t("infographicDialog.toast.selectTextFirstDesc"),
        })
        return
      }

      setSelectedInfographicText(selectedText)
      setIsInfographicOpen(true)
    } else {
      // 其他功能使用普通对话框
      setActiveDialog(id)
    }
  }

  function handleCloseDialog() {
    setActiveDialog(null)
  }

  function renderImageFeatureDialog(
    open: boolean,
    onOpenChange: (nextOpen: boolean) => void,
    title: string,
    content: ReactNode
  ) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/75"
          className="flex h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:max-w-none sm:rounded-xl sm:border sm:border-border sm:shadow-2xl"
        >
          <div className="flex h-full min-h-0 flex-col bg-background">
            <div className="flex items-center justify-between border-b bg-background px-4 py-4">
              <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-muted"
                title="关闭"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-background">
              {content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t("tiptapEditor.aiPanel.title")}
        </h3>
      </div>

      {/* Feature Buttons */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 auto-rows-fr gap-2">
          {FEATURE_BUTTONS.map((btn) => {
            const Icon = btn.icon
            return (
              <button
                key={btn.id}
                onClick={() => handleOpenDialog(btn.id)}
                className={`
                  flex min-h-24 h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg bg-white p-3
                  shadow-sm
                  hover:shadow-md hover:bg-blue-50/50
                  transition-all duration-150 cursor-pointer
                `}
              >
                <span className={`p-1.5 rounded-md ${btn.bgColor}`}>
                  <Icon className="w-4 h-4 text-foreground/70" />
                </span>
                <span className="text-xs text-foreground/80 text-center leading-tight">
                  {t(btn.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Task Progress Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("tiptapEditor.aiPanel.taskProgress")}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EditorTaskProgress
            aiEditTasks={aiEditTasks}
            taskCenterTasks={taskCenterTasks}
            onRemoveTask={(id: string, type: TaskType) => {
              if (type === "ai-edit") {
                onRemoveTask(id)
              } else if (type === "task-center") {
                // 处理任务中心任务的删除
                const task = taskCenterTasks.find(t => t.id === id)
                if (task && task.taskCenterData) {
                  taskCenterClient.deleteTask(task.taskCenterData.type, task.taskCenterData.id)
                    .then(() => {
                      // 删除成功后刷新任务列表
                      fetchTaskCenterTasks()
                    })
                    .catch(error => {
                      console.error('删除任务失败:', error)
                    })
                }
              }
            }}
            onClickTask={(task: TaskItem) => {
              if (task.type === "ai-edit") {
                onSetActiveExecId(task.id)
              } else if (task.type === "task-center") {
                // 打开任务详情弹窗
                fetchTaskDetail(task)
              }
            }}
          />
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {selectedTask ? selectedTask.label : ''}
            </DialogDescription>
          </DialogHeader>
          {loadingTaskDetail ? (
            <div className="flex justify-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : taskDetailError ? (
            <div className="py-8">
              <Alert variant="destructive">
                <AlertDescription>{taskDetailError}</AlertDescription>
              </Alert>
            </div>
          ) : taskDetail ? (
            <>
              {/* 内容区域，可滚动 */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">任务类型</p>
                    <p>{selectedTask?.taskCenterData?.type || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">状态</p>
                    <p>{selectedTask?.taskCenterData?.status || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">创建时间</p>
                    <p>{taskDetail.created_at ? new Date(taskDetail.created_at).toLocaleString('zh-CN') : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">结算状态</p>
                    <p>{taskDetail.is_settle ? '已结算' : '未结算'}</p>
                  </div>
                </div>
                
                {/* 任务结果可视化展示 */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">任务结果</p>
                  
                  {/* 检查是否有图片结果 */}
                  {(taskDetail.image_urls && typeof taskDetail.image_urls === 'string' && taskDetail.image_urls.trim() !== '') ? (
                    <div className="space-y-4">
                      <p className="text-sm font-medium">生成的图片</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          let urls: string[] = [];
                          try {
                            // 尝试解析JSON字符串
                            const parsed = JSON.parse(taskDetail.image_urls);
                            if (Array.isArray(parsed)) {
                              urls = parsed;
                            } else if (typeof parsed === 'string') {
                              urls = [parsed];
                            }
                          } catch (e) {
                            // 如果解析失败，尝试按逗号拆分
                            urls = taskDetail.image_urls.split(',');
                          }
                          
                          return urls.map((imageUrl: string, index: number) => {
                            // 清理URL：去除反引号、空格和可能的引号
                            let cleanedUrl = imageUrl.trim()
                              .replace(/[`"']/g, '') // 去除反引号和引号
                              .trim();
                            
                            return cleanedUrl ? (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={cleanedUrl} 
                                  alt={`生成的图片 ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                  }}
                                />
                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            ) : null;
                          }).filter(Boolean);
                        })()}
                      </div>
                    </div>
                  ) : (
                    // 检查是否有其他输出结果
                    taskDetail.outputs && Array.isArray(taskDetail.outputs) && taskDetail.outputs.length > 0 ? (
                      <div className="space-y-3">
                        {taskDetail.outputs.map((output: string, index: number) => (
                          <div key={index} className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">结果 {index + 1}</p>
                            <p className="mt-1 text-sm">{output}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">暂无输出结果</p>
                      </div>
                    )
                  )}
                  
                  {/* 检查是否有参考图片 */}
                  {taskDetail.reference_image_urls && typeof taskDetail.reference_image_urls === 'string' && taskDetail.reference_image_urls.trim() !== '' ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium">参考图片</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          let urls: string[] = [];
                          try {
                            // 尝试解析JSON字符串
                            const parsed = JSON.parse(taskDetail.reference_image_urls);
                            if (Array.isArray(parsed)) {
                              urls = parsed;
                            } else if (typeof parsed === 'string') {
                              urls = [parsed];
                            }
                          } catch (e) {
                            // 如果解析失败，尝试按逗号拆分
                            urls = taskDetail.reference_image_urls.split(',');
                          }
                          
                          return urls.map((imageUrl: string, index: number) => {
                            // 清理URL：去除反引号、空格和可能的引号
                            let cleanedUrl = imageUrl.trim()
                              .replace(/[`"']/g, '') // 去除反引号和引号
                              .trim();
                            
                            return cleanedUrl ? (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={cleanedUrl} 
                                  alt={`参考图片 ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                  }}
                                />
                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                  参考 {index + 1}
                                </div>
                              </div>
                            ) : null;
                          }).filter(Boolean);
                        })()}
                      </div>
                    </div>
                  ) : null}
                  
                  {/* 检查是否有错误信息 */}
                  {taskDetail.error && taskDetail.error !== '' ? (
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-700">错误信息</p>
                      <p className="mt-1 text-sm text-red-600">{taskDetail.error}</p>
                    </div>
                  ) : null}
                  

                </div>
              </div>
              
              {/* 底部操作区域，固定显示 */}
              {selectedTask?.taskCenterData?.type === 'image' && (
                <div className="border-t border-border pt-4 mt-2">
                  {copyToMaterialsSuccess && (
                    <div className="mb-3 bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700">{copyToMaterialsSuccess}</p>
                    </div>
                  )}
                  {copyToMaterialsError && (
                    <div className="mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">{copyToMaterialsError}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={copyToMaterials}
                    disabled={copyingToMaterials}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copyingToMaterials ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        加入中...
                      </>
                    ) : (
                      '加入素材库'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {renderImageFeatureDialog(
        isCreateImageOpen,
        setIsCreateImageOpen,
        t('tiptapEditor.aiPanel.createImage'),
        <CreatorMode articleId={articleId} />
      )}

      {renderImageFeatureDialog(
        isReversalModeOpen,
        setIsReversalModeOpen,
        t('tiptapEditor.aiPanel.reversalMode'),
        <InversionMode articleId={articleId} />
      )}

      {renderImageFeatureDialog(
        isImageStyleOpen,
        setIsImageStyleOpen,
        t('tiptapEditor.aiPanel.imageStyle'),
        <StyleMode articleId={articleId} />
      )}

      <InfographicDialog
        open={isInfographicOpen}
        onOpenChange={setIsInfographicOpen}
        articleId={articleId}
        selectedText={selectedInfographicText}
      />
    </div>
  )
}
