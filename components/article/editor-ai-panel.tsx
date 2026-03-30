"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  PencilIcon,
  ImageIcon,
  FileTextIcon,
  RefreshCwIcon,
  PaletteIcon,
  ClipboardListIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { ArticleAIHelpDialog } from "./article-ai-help-dialog"
import { EditorTaskProgress, type TaskItem, type TaskType } from "./editor-task-progress"
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state"
import { taskCenterClient } from "@/lib/api/taskcenter/client"
import { TaskType as TaskCenterTaskType } from "@/lib/api/taskcenter/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/base/dialog"
import { Badge } from "@/components/ui/base/badge"
import { Alert, AlertDescription } from "@/components/ui/base/alert"
import { Spinner } from "@/components/ui/custom/spinner"
import { CreatorMode } from "@/components/image-generator/creator-mode"
import { InversionMode } from "@/components/image-generator/modes/inversion-mode"
import { StyleMode } from "@/components/image-generator/modes/style-mode"

type ActiveDialog =
  | "ai-edit"
  | "create-image"
  | "ai-generate"
  | "reversal-mode"
  | "image-style"
  | null

interface FeatureButton {
  id: ActiveDialog
  labelKey: string
  icon: React.ElementType
  bgColor: string
  colSpan?: boolean
}

const FEATURE_BUTTONS: FeatureButton[] = [
  {
    id: "ai-edit",
    labelKey: "tiptapEditor.aiPanel.aiEdit",
    icon: PencilIcon,
    bgColor: "bg-blue-50",
  },
  {
    id: "create-image",
    labelKey: "tiptapEditor.aiPanel.createImage",
    icon: ImageIcon,
    bgColor: "bg-indigo-50",
  },
  {
    id: "ai-generate",
    labelKey: "tiptapEditor.aiPanel.aiGenerate",
    icon: FileTextIcon,
    bgColor: "bg-green-50",
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
    colSpan: true,
  },
]

interface EditorAIPanelProps {
  aiEditTasks: Map<string, AIEditState>
  activeExecId: string | null
  onSetActiveExecId: (execId: string | null) => void
  onAddTask: (task: AIEditState) => void
  onRemoveTask: (execId: string) => void
}

export function EditorAIPanel({
  aiEditTasks,
  activeExecId,
  onSetActiveExecId,
  onAddTask,
  onRemoveTask,
}: EditorAIPanelProps) {
  const { t } = useTranslation()
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

  // 获取任务中心任务
  useEffect(() => {
    const fetchTaskCenterTasks = async () => {
      try {
        setLoadingTaskCenter(true)
        // 获取所有类型的任务
        const taskTypes = Object.values(TaskCenterTaskType)
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
            // 打印任务数据结构，以便调试
            console.log('图片任务数据:', {
              taskId: task.id,
              hasDetails: !!task.details,
              hasDetail: !!task.detail,
              hasGenMode: !!task.gen_mode,
              detailsGenMode: task.details?.gen_mode,
              detailGenMode: task.detail?.gen_mode,
              genMode: task.gen_mode
            });
            if (task.details?.gen_mode) {
              genMode = task.details.gen_mode;
            } else if (task.detail?.gen_mode) {
              genMode = task.detail.gen_mode;
            } else if (task.gen_mode) {
              genMode = task.gen_mode;
            }
            console.log('获取到的genMode:', genMode);
            switch (genMode) {
              case 'split_images':
                label = '反向模式';
                break;
              case 'creator':
                label = '创作模式';
                break;
              case 'style':
                label = '风格模式';
                break;
              default:
                label = '图片任务';
            }
          }
          
          return {
            id: `${task.type}-${task.id.toString()}`,
            type: "task-center" as TaskType,
            status: task.status === "completed" || task.status === "success" ? "completed" : 
                   task.status === "failed" ? "failed" : "pending",
            label,
            description: `任务 ID: ${task.id}`,
            startedAt: new Date(task.created_at).getTime(),
            taskCenterData: task
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

    fetchTaskCenterTasks()
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
      // 打印任务详情数据结构，以便调试
      console.log('任务详情数据:', {
        type: task.taskCenterData.type,
        id: task.taskCenterData.id,
        hasImageUrls: !!data.image_urls,
        imageUrlsType: typeof data.image_urls,
        imageUrlsValue: data.image_urls,
        hasReferenceImageUrls: !!data.reference_image_urls,
        referenceImageUrlsType: typeof data.reference_image_urls,
        referenceImageUrlsValue: data.reference_image_urls
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
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('未登录或token过期')
      }

      const taskId = selectedTask.taskCenterData.id
      const response = await fetch(`http://localhost:8080/image-generation/logs/${taskId}/copy-to-materials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error('加入素材库失败')
      }

      const data = await response.json()
      setCopyToMaterialsSuccess('成功加入素材库')
      console.log('加入素材库成功:', data)
    } catch (error) {
      setCopyToMaterialsError('加入素材库失败，请稍后重试')
      console.error('加入素材库失败:', error)
    } finally {
      setCopyingToMaterials(false)
    }
  }

  function handleOpenDialog(id: ActiveDialog) {
    // 对于图片相关的功能，使用滑入窗口
    if (id === 'create-image') {
      setIsCreateImageOpen(true)
    } else if (id === 'reversal-mode') {
      setIsReversalModeOpen(true)
    } else if (id === 'image-style') {
      setIsImageStyleOpen(true)
    } else {
      // 其他功能使用普通对话框
      setActiveDialog(id)
    }
  }

  function handleCloseDialog() {
    setActiveDialog(null)
  }

  function handleCloseCreateImage() {
    setIsCreateImageOpen(false)
  }

  function handleCloseReversalMode() {
    setIsReversalModeOpen(false)
  }

  function handleCloseImageStyle() {
    setIsImageStyleOpen(false)
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
      <div className="px-3 py-3 border-b">
        <div className="grid grid-cols-2 gap-2">
          {FEATURE_BUTTONS.map((btn) => {
            const Icon = btn.icon
            return (
              <button
                key={btn.id}
                onClick={() => handleOpenDialog(btn.id)}
                className={`
                  flex flex-col items-center justify-center gap-1.5 p-3
                  bg-white border border-border rounded-lg
                  hover:border-blue-400 hover:bg-blue-50/50
                  transition-colors duration-150 cursor-pointer
                  ${btn.colSpan ? "col-span-2" : ""}
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
        <div className="px-4 py-2 border-b">
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
              }
              // 任务中心任务不支持删除
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

      {/* AI Generate Article Dialog */}
      <ArticleAIHelpDialog
        open={activeDialog === "ai-generate"}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog()
        }}
        onArticleCreated={() => {
          handleCloseDialog()
        }}
      />

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {selectedTask ? `${selectedTask.label} - ID: ${selectedTask.id}` : ''}
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
                  
                  {/* 检查是否有其他重要信息 */}
                  {taskDetail.cost && typeof taskDetail.cost === 'string' ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-muted-foreground">成本信息</p>
                      <p className="mt-1 text-sm">{taskDetail.cost}</p>
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

      {/* 创作图片弹窗 */}
      {createPortal(
        <div className={`fixed top-0 right-0 h-full bg-background/95 shadow-2xl z-500 transition-transform duration-300 ease-in-out ${isCreateImageOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '80vw', maxWidth: '1200px' }}>
          <div className="flex flex-col h-full">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-semibold">{t('tiptapEditor.aiPanel.createImage')}</h3>
              <button
                type="button"
                onClick={handleCloseCreateImage}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="关闭"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 p-0 overflow-hidden">
              <CreatorMode />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 反向模式弹窗 */}
      {createPortal(
        <div className={`fixed top-0 right-0 h-full bg-background/95 shadow-2xl z-500 transition-transform duration-300 ease-in-out ${isReversalModeOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '80vw', maxWidth: '1200px' }}>
          <div className="flex flex-col h-full">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-semibold">{t('tiptapEditor.aiPanel.reversalMode')}</h3>
              <button
                type="button"
                onClick={handleCloseReversalMode}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="关闭"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 p-0 overflow-hidden">
              <InversionMode />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 图片风格弹窗 */}
      {createPortal(
        <div className={`fixed top-0 right-0 h-full bg-background/95 shadow-2xl z-500 transition-transform duration-300 ease-in-out ${isImageStyleOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '80vw', maxWidth: '1200px' }}>
          <div className="flex flex-col h-full">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-semibold">{t('tiptapEditor.aiPanel.imageStyle')}</h3>
              <button
                type="button"
                onClick={handleCloseImageStyle}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="关闭"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 p-0 overflow-hidden">
              <StyleMode />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
