"use client"

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TaskType, type TaskListItem } from '@/lib/api/taskcenter/types'
import { taskCenterClient } from '@/lib/api/taskcenter/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/base/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/base/table'
import { Badge } from '@/components/ui/base/badge'
import { Spinner } from '@/components/ui/custom/spinner'
import { Button } from '@/components/ui/base/button'
import { Alert, AlertDescription } from '@/components/ui/base/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/base/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/base/dialog'
import { XIcon } from 'lucide-react'
import { TaskDetailResponse } from '@/lib/api/taskcenter/types'

type TaskDetailTrigger = Pick<TaskListItem, 'id' | 'type' | 'status'>

// 任务类型显示文本
const taskTypeLabels: Record<string, string> = {
  [TaskType.ARTICLE]: '文章',
  [TaskType.IMAGE]: '图片',
  [TaskType.MATERIAL]: '素材',
  [TaskType.POST_CRAWL]: '社交帖子',
  [TaskType.MINDMAP]: '思维导图',
  [TaskType.INFOGRAPHIC]: '信息图'
}

// 任务状态显示文本和样式
const taskStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  create: { label: '创建', variant: 'default' },
  edit: { label: '编辑', variant: 'default' },
  pending: { label: '待处理', variant: 'default' },
  processing: { label: '处理中', variant: 'secondary' },
  completed: { label: '已完成', variant: 'default' },
  failed: { label: '失败', variant: 'destructive' },
  doing: { label: '处理中', variant: 'secondary' },
  done: { label: '已完成', variant: 'default' },
  executing: { label: '执行中', variant: 'secondary' },
  querying: { label: '查询中', variant: 'secondary' }
}

export function TaskCenterContent() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<TaskType>(TaskType.ARTICLE)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [taskDetail, setTaskDetail] = useState<TaskDetailResponse | null>(null)
  const [taskDetailLoading, setTaskDetailLoading] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<TaskDetailTrigger | null>(null)
  const [hasProcessedUrlParams, setHasProcessedUrlParams] = useState(false)

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await taskCenterClient.getTasks({
        type: selectedType,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      })
      // 确保 data 是数组
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('获取任务列表失败，请稍后重试')
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  // 检测URL参数，自动打开任务详情
  useEffect(() => {
    const taskId = searchParams.get('taskId')
    const taskType = searchParams.get('taskType')
    
    console.log('检查URL参数:', { taskId, taskType, currentPath: window.location.href, hasProcessed: hasProcessedUrlParams })
    
    if (taskId && taskType && !hasProcessedUrlParams) {
      console.log('检测到URL参数，自动打开任务详情:', { taskId, taskType })
      // 创建一个临时的TaskListItem对象
      const tempTask: TaskDetailTrigger = {
        id: parseInt(taskId),
        type: taskType as TaskType,
        status: '',
      }
      fetchTaskDetail(tempTask)
      
      // 标记已经处理过URL参数
      setHasProcessedUrlParams(true)
      
      // 清除URL参数，避免刷新页面时再次触发
      const newUrl = window.location.pathname + '?tab=taskcenter'
      console.log('清除URL参数，重定向到:', newUrl)
      window.history.replaceState({}, document.title, newUrl)
    } else if (hasProcessedUrlParams) {
      console.log('已经处理过URL参数，跳过')
    } else {
      console.log('未检测到任务详情URL参数')
    }
  }, [searchParams, hasProcessedUrlParams])

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 解析成本信息
  const getCost = (costString: string) => {
    try {
      // 尝试解析为JSON对象
      const cost = JSON.parse(costString)
      // 检查是否有 total 字段
      if (cost.total) {
        return cost.total
      }
      // 如果是复杂JSON对象，返回0
      return 0
    } catch {
      // 如果解析失败，直接返回原始值（可能是字符串数字）
      return parseInt(costString) || 0
    }
  }

  // 获取任务详情
  const fetchTaskDetail = async (task: TaskDetailTrigger) => {
    try {
      setTaskDetailLoading(true)
      setTaskDetailError(null)
      setCurrentTask(task)
      const data = await taskCenterClient.getTaskDetail(task.type, task.id)
      setTaskDetail(data)
      setIsDetailDialogOpen(true)
    } catch (err) {
      setTaskDetailError('获取任务详情失败，请稍后重试')
      console.error('Error fetching task detail:', err)
    } finally {
      setTaskDetailLoading(false)
    }
  }

  // 删除任务
  const deleteTask = async (task: TaskListItem) => {
    try {
      await taskCenterClient.deleteTask(task.type, task.id)
      // 删除成功后刷新任务列表
      fetchTasks()
    } catch (err) {
      setError('删除任务失败，请稍后重试')
      console.error('Error deleting task:', err)
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">任务列表</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TaskType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskType.ARTICLE}>文章</SelectItem>
              <SelectItem value={TaskType.IMAGE}>图片</SelectItem>
              <SelectItem value={TaskType.MATERIAL}>素材</SelectItem>
              <SelectItem value={TaskType.MINDMAP}>思维导图</SelectItem>
              <SelectItem value={TaskType.INFOGRAPHIC}>信息图</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择任务状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="create">创建</SelectItem>
              <SelectItem value="edit">编辑</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="processing">处理中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="doing">处理中</SelectItem>
              <SelectItem value="done">已完成</SelectItem>
              <SelectItem value="executing">执行中</SelectItem>
              <SelectItem value="querying">查询中</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTasks} disabled={loading}>
            {loading ? <Spinner className="w-4 h-4" /> : '刷新'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>查看您的所有任务及其状态</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">暂无任务</h3>
                <p className="text-muted-foreground">您还没有任何任务</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>成本</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const statusConfig = taskStatusConfig[task.status] || { label: task.status, variant: 'default' }
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Badge variant="outline">{taskTypeLabels[task.type]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(task.created_at)}</TableCell>
                      <TableCell>{getCost(task.cost)} 积分</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchTaskDetail(task)}
                          >
                            查看
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteTask(task)}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 任务详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {currentTask ? `${taskTypeLabels[currentTask.type]}任务` : ''}
            </DialogDescription>
          </DialogHeader>
          {taskDetailLoading ? (
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">任务类型</p>
                  <p>{currentTask ? taskTypeLabels[currentTask.type] : ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">状态</p>
                  <p>{currentTask ? (taskStatusConfig[currentTask.status]?.label || currentTask.status) : ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">创建时间</p>
                  {currentTask?.type === TaskType.ARTICLE && 'log' in taskDetail ? (
                    <p>{taskDetail.log.created_at ? formatDate(taskDetail.log.created_at) : ''}</p>
                  ) : currentTask?.type === TaskType.MINDMAP && 'log' in taskDetail ? (
                    <p>{taskDetail.log.created_at ? formatDate(taskDetail.log.created_at) : ''}</p>
                  ) : (
                    <p>{taskDetail.created_at ? formatDate(taskDetail.created_at) : ''}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">成本</p>
                  {currentTask?.type === TaskType.ARTICLE && 'log' in taskDetail ? (
                    <p>{taskDetail.log.cost} 积分</p>
                  ) : (
                    <p>{typeof taskDetail.cost === 'string' ? taskDetail.cost : getCost(taskDetail.cost)} 积分</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">结算状态</p>
                  {currentTask?.type === TaskType.ARTICLE && 'log' in taskDetail ? (
                    <p>{taskDetail.log.is_settle ? '已结算' : '未结算'}</p>
                  ) : 'is_settle' in taskDetail ? (
                    <p>{taskDetail.is_settle ? '已结算' : '未结算'}</p>
                  ) : (
                    <p>未知</p>
                  )}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">详细信息</p>
                {currentTask?.type === TaskType.ARTICLE && 'log' in taskDetail && 'article' in taskDetail ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">文章信息</p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">标题</p>
                          <p>{taskDetail.article.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">状态</p>
                          <p>{taskDetail.article.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">分类</p>
                          <p>{taskDetail.article.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">标签</p>
                          <p>{taskDetail.article.tags.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">内容</p>
                          <div className="mt-1 p-3 bg-muted rounded-md max-h-40 overflow-auto">
                            <p>{taskDetail.article.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">操作日志</p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">操作类型</p>
                          <p>{taskDetail.log.operate_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">执行ID</p>
                          <p>{taskDetail.log.exec_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">更新时间</p>
                          <p>{taskDetail.log.updated_at ? formatDate(taskDetail.log.updated_at) : ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : currentTask?.type === TaskType.MINDMAP && 'log' in taskDetail ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">卡片数量</p>
                      <p>{taskDetail.log.card_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">语言</p>
                      <p>{taskDetail.log.language}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">卡片样式</p>
                      <p>{taskDetail.log.card_style}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">卡片布局</p>
                      <p>{taskDetail.log.card_layout}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">额外要求</p>
                      <p>{taskDetail.log.extra_requirements}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">思维导图图片</p>
                      <div className="mt-2">
                        <img 
                          src={taskDetail.log.card_url} 
                          alt="思维导图" 
                          className="max-w-full h-auto rounded-lg border" 
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">更新时间</p>
                      <p>{taskDetail.log.updated_at ? formatDate(taskDetail.log.updated_at) : ''}</p>
                    </div>
                  </div>
                ) : currentTask?.type === TaskType.IMAGE ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">提示词</p>
                      <p>{taskDetail.prompt}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">模型名称</p>
                      <p>{taskDetail.model_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">生成图片</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {taskDetail.image_urls && Array.isArray(taskDetail.image_urls) && taskDetail.image_urls.map((url, index) => (
                          <div key={index}>
                            <img 
                              src={url} 
                              alt={`生成图片 ${index + 1}`} 
                              className="w-full h-auto rounded-lg border" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">完成时间</p>
                      <p>{taskDetail.completed_at ? formatDate(taskDetail.completed_at) : ''}</p>
                    </div>
                  </div>
                ) : (
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(taskDetail, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
