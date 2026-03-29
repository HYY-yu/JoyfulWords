"use client"

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/hooks/use-toast'
import { webSocketService } from '@/lib/websocket/websocket-service'

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, loading } = useAuth()
  const toast = useToast()

  console.log('WebSocketProvider - 用户状态:', { user: !!user, loading })
  console.log('WebSocketProvider - Toast 实例:', !!toast)

  useEffect(() => {
    // 当用户登录且加载完成时，初始化 WebSocket 连接
    if (!loading && user) {
      console.log('WebSocketProvider - 初始化 WebSocket 连接')
      const token = localStorage.getItem('access_token')
      console.log('WebSocketProvider - Token 存在:', !!token)
      console.log('WebSocketProvider - Toast 对象:', toast)
      console.log('WebSocketProvider - Toast 函数存在:', typeof toast.toast === 'function')
      if (token && toast.toast) {
        webSocketService.init(token, toast.toast)
      }
    } else if (!loading && !user) {
      console.log('WebSocketProvider - 用户未登录，不初始化 WebSocket')
    }

    // 组件卸载时关闭 WebSocket 连接
    return () => {
      console.log('WebSocketProvider - 关闭 WebSocket 连接')
      webSocketService.close()
    }
  }, [user, loading, toast])

  return <>{children}</>
}
