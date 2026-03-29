"use client"

import { useToast } from '@/hooks/use-toast'

// WebSocket 消息类型
export enum WebSocketMessageType {
  PING = 'ping',
  WELCOME = 'welcome',
  PONG = 'pong',
  TASK_UPDATE = 'task_update',
  TASK_COMPLETE = 'task_complete',
  TASK_FAILED = 'task_failed'
}

// WebSocket 消息接口
export interface WebSocketMessage {
  type: WebSocketMessageType
  payload: any
}

// 任务状态更新接口
export interface TaskUpdatePayload {
  task_id: number
  task_type: string
  status: string
  outputs: string[] | null
  error: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null
  private toast: ((props: any) => any) | null = null
  private notificationSound: HTMLAudioElement | null = null

  // 初始化 WebSocket 服务
  init(token: string, toastInstance: any) {
    console.log('初始化 WebSocket 服务，token:', token.substring(0, 20) + '...')
    this.toast = toastInstance
    console.log('Toast 实例:', !!toastInstance)
    console.log('Toast 实例类型:', typeof toastInstance)
    this.initNotificationSound()
    this.connect(token)
  }

  // 初始化通知声音
  private initNotificationSound() {
    try {
      this.notificationSound = new Audio('/lib/websocket/tips.mp3')
      console.log('通知声音初始化成功')
    } catch (error) {
      console.error('初始化通知声音失败:', error)
      this.notificationSound = null
    }
  }

  // 播放通知声音
  private playNotificationSound() {
    if (this.notificationSound) {
      try {
        this.notificationSound.currentTime = 0 // 重置音频
        this.notificationSound.play().catch(error => {
          // 忽略用户交互错误，这是浏览器的自动播放限制
          if (error.name !== 'NotAllowedError') {
            console.error('播放通知声音失败:', error)
          }
        })
      } catch (error) {
        console.error('播放通知声音失败:', error)
      }
    }
  }

  // 连接 WebSocket
  private connect(token: string) {
    try {
      const wsUrl = `ws://localhost:8080/ws/connect?token=${token}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket 连接成功')
        this.reconnectAttempts = 0
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event)
      }

      this.ws.onerror = (error) => {
        // 检查 error 是否是浏览器的信任事件对象，如果是则忽略
        if (error && typeof error === 'object' && error.isTrusted) {
          return // 忽略浏览器信任的事件对象
        }
        
        // 检查 error 是否是空对象或无意义的对象
        let errorMessage = '未知错误'
        if (error) {
          if (error instanceof Error && error.message) {
            errorMessage = error.message
          } else if (typeof error === 'string') {
            errorMessage = error
          } else {
            // 尝试将对象转换为字符串，检查是否为空对象
            const errorStr = JSON.stringify(error)
            if (errorStr !== '{}') {
              errorMessage = errorStr
            }
          }
        }
        console.error('WebSocket 错误:', errorMessage)
      }

      this.ws.onclose = () => {
        console.log('WebSocket 连接关闭')
        this.stopHeartbeat()
        this.reconnect()
      }
    } catch (error) {
      // 检查 error 是否是空对象
      const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0
      console.error('WebSocket 连接失败:', error instanceof Error ? error.message : (isEmptyObject ? '未知错误' : String(error)) || '未知错误')
      this.reconnect()
    }
  }

  // 处理接收到的消息
  private handleMessage(event: MessageEvent) {
    console.log('收到 WebSocket 消息事件:', event)
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      console.log('解析后的 WebSocket 消息:', message)

      switch (message.type) {
        case WebSocketMessageType.TASK_COMPLETE:
          console.log('处理任务完成消息')
          this.handleTaskComplete(message.payload)
          break
        case WebSocketMessageType.TASK_FAILED:
          console.log('处理任务失败消息')
          this.handleTaskFailed(message.payload)
          break
        case WebSocketMessageType.TASK_UPDATE:
          console.log('处理任务更新消息')
          this.handleTaskUpdate(message.payload)
          break
        case WebSocketMessageType.WELCOME:
          console.log('欢迎消息:', message.payload)
          break
        case WebSocketMessageType.PONG:
          console.log('心跳响应')
          break
        default:
          console.log('未知消息类型:', message.type)
      }
    } catch (error) {
      // 检查 error 是否是空对象
      const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0
      console.error('解析 WebSocket 消息失败:', error instanceof Error ? error.message : (isEmptyObject ? '未知错误' : String(error)) || '未知错误')
    }
  }

  // 处理任务完成通知
  private handleTaskComplete(payload: TaskUpdatePayload) {
    console.log('收到任务完成通知:', payload)
    console.log('Toast 实例可用:', !!this.toast)
    if (this.toast && typeof this.toast === 'function') {
      console.log('触发任务完成弹窗')
      this.playNotificationSound()
      this.toast({
        title: '任务完成',
        description: `任务 ${payload.task_id} 已成功完成`,
        variant: 'default',
        onClick: () => {
          // 跳转到任务详情页面
          console.log('点击任务完成通知，跳转到任务详情')
          // 先导航到任务中心页面，然后触发任务详情查看
          window.location.href = `/dashboard?tab=taskcenter&taskId=${payload.task_id}&taskType=${payload.task_type}`
        }
      })
    } else {
      console.error('Toast 实例不可用或不是函数')
    }
  }

  // 处理任务失败通知
  private handleTaskFailed(payload: TaskUpdatePayload) {
    console.log('收到任务失败通知:', payload)
    console.log('Toast 实例可用:', !!this.toast)
    if (this.toast && typeof this.toast === 'function') {
      console.log('触发任务失败弹窗')
      this.playNotificationSound()
      this.toast({
        title: '任务失败',
        description: `任务 ${payload.task_id} 失败: ${payload.error}`,
        variant: 'destructive',
        onClick: () => {
          // 跳转到任务详情页面
          console.log('点击任务失败通知，跳转到任务详情')
          // 先导航到任务中心页面，然后触发任务详情查看
          window.location.href = `/dashboard?tab=taskcenter&taskId=${payload.task_id}&taskType=${payload.task_type}`
        }
      })
    } else {
      console.error('Toast 实例不可用或不是函数')
    }
  }

  // 处理任务状态更新
  private handleTaskUpdate(payload: TaskUpdatePayload) {
    // 可以在这里添加任务状态更新的逻辑
    console.log('任务状态更新:', payload)
  }

  // 发送心跳
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: WebSocketMessageType.PING,
          payload: {}
        })
      }
    }, 30000) // 30秒发送一次心跳
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 重新连接
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
          this.connect(token)
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.log('WebSocket 重连失败，已达到最大尝试次数，将在 30 秒后再次尝试...')
      // 30 秒后重置尝试次数并再次尝试连接
      setTimeout(() => {
        this.reconnectAttempts = 0
        const token = localStorage.getItem('access_token')
        if (token) {
          this.connect(token)
        }
      }, 30000) // 30 秒后再次尝试
    }
  }

  // 发送消息
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  // 关闭连接
  close() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// 导出单例
export const webSocketService = new WebSocketService()
