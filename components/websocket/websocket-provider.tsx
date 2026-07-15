"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { webSocketService } from "@/lib/websocket/websocket-service"
import { useTranslation } from "@/lib/i18n/i18n-context"

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    webSocketService.init(toast, t)
  }, [t, toast])

  return <>{children}</>
}
