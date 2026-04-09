"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { webSocketService } from "@/lib/websocket/websocket-service"

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { toast } = useToast()

  useEffect(() => {
    webSocketService.init(toast)
  }, [toast])

  return <>{children}</>
}
