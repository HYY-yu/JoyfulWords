"use client"

import { API_BASE_URL } from "@/lib/config"
import type { TaskCenterTaskType } from "@/lib/api/taskcenter/types"
import { tokenStore } from "@/lib/tokens/token-store"

export enum WebSocketMessageType {
  PING = "ping",
  WELCOME = "welcome",
  PONG = "pong",
  TASK_UPDATE = "task_update",
  TASK_COMPLETE = "task_complete",
  TASK_FAILED = "task_failed",
}

export interface WebSocketMessage {
  type: WebSocketMessageType | string
  payload: unknown
}

export interface TaskUpdatePayload {
  task_id: number
  task_type: TaskCenterTaskType
  article_id?: number
  status: string
  outputs?: Record<string, unknown> | null
  error?: string
}

export interface TaskSocketEvent {
  connectionKey: string
  messageType:
    | WebSocketMessageType.TASK_UPDATE
    | WebSocketMessageType.TASK_COMPLETE
    | WebSocketMessageType.TASK_FAILED
  payload: TaskUpdatePayload
}

type EventCallback = (data: any) => void

interface SocketChannel {
  key: string
  token: string
  articleId?: number
  ws: WebSocket | null
  reconnectAttempts: number
  reconnectTimer: ReturnType<typeof setTimeout> | null
  heartbeatTimer: ReturnType<typeof setInterval> | null
  refCount: number
  hasOpenedOnce: boolean
  manuallyClosed: boolean
  reauthenticating: boolean
}

const HEARTBEAT_INTERVAL_MS = 25_000
const INITIAL_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000
const TASK_EVENT_DEDUPE_WINDOW_MS = 1_500

function buildWebSocketUrl(token: string, articleId?: number): string {
  const url = new URL(API_BASE_URL)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.pathname = "/ws/connect"
  url.search = ""
  url.searchParams.set("token", token)

  if (typeof articleId === "number") {
    url.searchParams.set("article_id", String(articleId))
  }

  return url.toString()
}

function isTaskMessageType(
  type: string
): type is
  | WebSocketMessageType.TASK_UPDATE
  | WebSocketMessageType.TASK_COMPLETE
  | WebSocketMessageType.TASK_FAILED {
  return (
    type === WebSocketMessageType.TASK_UPDATE ||
    type === WebSocketMessageType.TASK_COMPLETE ||
    type === WebSocketMessageType.TASK_FAILED
  )
}

class WebSocketService {
  private channels = new Map<string, SocketChannel>()
  private eventListeners = new Map<string, Set<EventCallback>>()
  private toast: ((props: any) => any) | null = null
  private recentTaskEvents = new Map<string, number>()

  constructor() {
    tokenStore.subscribe((event) => {
      if (event.type === "token:updated") {
        const nextToken = tokenStore.getAccessToken()
        if (!nextToken) return

        this.channels.forEach((channel) => {
          channel.token = nextToken

          if (
            channel.ws &&
            (channel.ws.readyState === WebSocket.OPEN ||
              channel.ws.readyState === WebSocket.CONNECTING)
          ) {
            this.reauthenticateChannel(channel)
          }
        })

        console.info("[WebSocket] Updated channel tokens after refresh", {
          channelCount: this.channels.size,
          source: event.source,
        })
      }

      if (event.type === "token:cleared") {
        console.info("[WebSocket] Closing channels after token cleared", {
          channelCount: this.channels.size,
          source: event.source,
        })
        this.close()
      }
    })
  }

  init(toastInstance?: ((props: any) => any) | null) {
    this.toast = toastInstance ?? null
  }

  connectWebSocket(token: string) {
    this.ensureGlobalConnection(token)
  }

  ensureGlobalConnection(token: string) {
    this.ensureConnection("global", token)
  }

  closeGlobalConnection() {
    this.releaseConnection("global")
  }

  ensureArticleConnection(articleId: number, token: string) {
    this.ensureConnection(this.getArticleChannelKey(articleId), token, articleId)
  }

  releaseArticleConnection(articleId: number) {
    this.releaseConnection(this.getArticleChannelKey(articleId))
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)?.add(callback)
  }

  off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event)
    if (!listeners) return

    listeners.delete(callback)
    if (listeners.size === 0) {
      this.eventListeners.delete(event)
    }
  }

  close() {
    Array.from(this.channels.keys()).forEach((key) => {
      this.closeChannel(key)
    })
  }

  private getArticleChannelKey(articleId: number): string {
    return `article:${articleId}`
  }

  private ensureConnection(key: string, token: string, articleId?: number) {
    const existing = this.channels.get(key)
    if (existing) {
      existing.refCount += 1
      existing.token = token
      existing.manuallyClosed = false

      if (
        existing.ws &&
        (existing.ws.readyState === WebSocket.OPEN ||
          existing.ws.readyState === WebSocket.CONNECTING)
      ) {
        return
      }

      this.openChannel(existing)
      return
    }

    const channel: SocketChannel = {
      key,
      token,
      articleId,
      ws: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      heartbeatTimer: null,
      refCount: 1,
      hasOpenedOnce: false,
      manuallyClosed: false,
      reauthenticating: false,
    }

    this.channels.set(key, channel)
    this.openChannel(channel)
  }

  private releaseConnection(key: string) {
    const channel = this.channels.get(key)
    if (!channel) return

    channel.refCount = Math.max(0, channel.refCount - 1)
    if (channel.refCount === 0) {
      this.closeChannel(key)
    }
  }

  private openChannel(channel: SocketChannel) {
    if (
      channel.ws &&
      (channel.ws.readyState === WebSocket.OPEN ||
        channel.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    if (channel.reconnectTimer) {
      clearTimeout(channel.reconnectTimer)
      channel.reconnectTimer = null
    }

    const wsUrl = buildWebSocketUrl(channel.token, channel.articleId)
    console.info("[WebSocket] Connecting", {
      key: channel.key,
      articleId: channel.articleId ?? null,
      url: wsUrl.replace(channel.token, "***"),
    })

    try {
      const ws = new WebSocket(wsUrl)
      channel.ws = ws

      ws.onopen = () => {
        const isReconnect = channel.hasOpenedOnce
        channel.hasOpenedOnce = true
        channel.reconnectAttempts = 0
        this.startHeartbeat(channel)

        console.info("[WebSocket] Connected", {
          key: channel.key,
          articleId: channel.articleId ?? null,
          reconnect: isReconnect,
        })

        this.sendPing(channel)

        if (isReconnect) {
          this.emit("connection:reconnected", { key: channel.key, articleId: channel.articleId ?? null })
          if (typeof channel.articleId === "number") {
            this.emit(`connection:reconnected:article:${channel.articleId}`, {
              key: channel.key,
              articleId: channel.articleId,
            })
          }
          // TODO(observability): add websocket reconnect success metric here.
        }
      }

      ws.onmessage = (event) => {
        this.handleMessage(channel, event)
      }

      ws.onerror = (event) => {
        console.warn("[WebSocket] Socket error", {
          key: channel.key,
          articleId: channel.articleId ?? null,
          event,
        })
      }

      ws.onclose = (event) => {
        const isReauthenticating = channel.reauthenticating
        channel.reauthenticating = false

        console.info("[WebSocket] Closed", {
          key: channel.key,
          articleId: channel.articleId ?? null,
          code: event.code,
          reason: event.reason || null,
          wasClean: event.wasClean,
          manuallyClosed: channel.manuallyClosed,
          reauthenticating: isReauthenticating,
        })

        channel.ws = null
        this.stopHeartbeat(channel)

        if (channel.manuallyClosed || channel.refCount === 0) {
          return
        }

        if (isReauthenticating) {
          this.openChannel(channel)
          return
        }

        this.scheduleReconnect(channel)
      }
    } catch (error) {
      console.error("[WebSocket] Failed to connect", {
        key: channel.key,
        articleId: channel.articleId ?? null,
        error,
      })
      this.scheduleReconnect(channel)
    }
  }

  private scheduleReconnect(channel: SocketChannel) {
    if (channel.refCount === 0) return
    if (channel.reconnectTimer) return

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * 2 ** channel.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS
    )
    channel.reconnectAttempts += 1

    console.warn("[WebSocket] Scheduling reconnect", {
      key: channel.key,
      articleId: channel.articleId ?? null,
      delay,
      attempt: channel.reconnectAttempts,
    })

    // TODO(observability): add websocket reconnect attempt metric here.
    channel.reconnectTimer = setTimeout(() => {
      channel.reconnectTimer = null
      this.openChannel(channel)
    }, delay)
  }

  private reauthenticateChannel(channel: SocketChannel) {
    if (!channel.ws) return

    if (channel.reconnectTimer) {
      clearTimeout(channel.reconnectTimer)
      channel.reconnectTimer = null
    }

    channel.reauthenticating = true
    channel.reconnectAttempts = 0
    this.stopHeartbeat(channel)

    console.info("[WebSocket] Reauthenticating channel after token update", {
      key: channel.key,
      articleId: channel.articleId ?? null,
    })

    channel.ws.close(4001, "token_updated")
  }

  private closeChannel(key: string) {
    const channel = this.channels.get(key)
    if (!channel) return

    channel.manuallyClosed = true
    channel.reauthenticating = false
    channel.refCount = 0

    if (channel.reconnectTimer) {
      clearTimeout(channel.reconnectTimer)
      channel.reconnectTimer = null
    }

    this.stopHeartbeat(channel)

    if (channel.ws) {
      channel.ws.close()
      channel.ws = null
    }

    this.channels.delete(key)
  }

  private startHeartbeat(channel: SocketChannel) {
    this.stopHeartbeat(channel)

    channel.heartbeatTimer = setInterval(() => {
      this.sendPing(channel)
    }, HEARTBEAT_INTERVAL_MS)
  }

  private stopHeartbeat(channel: SocketChannel) {
    if (!channel.heartbeatTimer) return

    clearInterval(channel.heartbeatTimer)
    channel.heartbeatTimer = null
  }

  private sendPing(channel: SocketChannel) {
    if (channel.ws?.readyState !== WebSocket.OPEN) return

    channel.ws.send(
      JSON.stringify({
        type: WebSocketMessageType.PING,
        payload: {},
      } satisfies WebSocketMessage)
    )
  }

  private handleMessage(channel: SocketChannel, event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage

      if (message.type === WebSocketMessageType.WELCOME) {
        console.debug("[WebSocket] Welcome received", {
          key: channel.key,
          articleId: channel.articleId ?? null,
          payload: message.payload,
        })
        return
      }

      if (message.type === WebSocketMessageType.PONG) {
        console.debug("[WebSocket] Pong received", {
          key: channel.key,
          articleId: channel.articleId ?? null,
          payload: message.payload,
        })
        return
      }

      if (!isTaskMessageType(message.type)) {
        console.warn("[WebSocket] Unknown message type", {
          key: channel.key,
          type: message.type,
        })
        return
      }

      const payload = message.payload as TaskUpdatePayload
      if (!payload || typeof payload.task_id !== "number" || !payload.task_type) {
        console.warn("[WebSocket] Invalid task payload", {
          key: channel.key,
          messageType: message.type,
          payload: message.payload,
        })
        return
      }

      if (!this.shouldProcessTaskEvent(message.type, payload)) {
        return
      }

      const taskEvent: TaskSocketEvent = {
        connectionKey: channel.key,
        messageType: message.type,
        payload,
      }

      this.emitTaskEvent(taskEvent)

      if (message.type === WebSocketMessageType.TASK_COMPLETE) {
        this.showTaskToast("success", payload)
      }

      if (message.type === WebSocketMessageType.TASK_FAILED) {
        this.showTaskToast("error", payload)
      }
    } catch (error) {
      console.error("[WebSocket] Failed to parse message", {
        key: channel.key,
        articleId: channel.articleId ?? null,
        error,
        raw: event.data,
      })
    }
  }

  private shouldProcessTaskEvent(
    messageType: TaskSocketEvent["messageType"],
    payload: TaskUpdatePayload
  ): boolean {
    const now = Date.now()

    for (const [key, timestamp] of this.recentTaskEvents.entries()) {
      if (now - timestamp > TASK_EVENT_DEDUPE_WINDOW_MS) {
        this.recentTaskEvents.delete(key)
      }
    }

    const dedupeKey = [
      messageType,
      payload.task_type,
      payload.task_id,
      payload.status,
      payload.article_id ?? "none",
    ].join(":")

    const previousTimestamp = this.recentTaskEvents.get(dedupeKey)
    if (previousTimestamp && now - previousTimestamp <= TASK_EVENT_DEDUPE_WINDOW_MS) {
      console.debug("[WebSocket] Deduped task event", { dedupeKey })
      return false
    }

    this.recentTaskEvents.set(dedupeKey, now)
    return true
  }

  private emitTaskEvent(taskEvent: TaskSocketEvent) {
    const { messageType, payload } = taskEvent

    this.emit("task:event", taskEvent)

    if (messageType === WebSocketMessageType.TASK_UPDATE) {
      this.emit("task:update", payload)
    }

    if (messageType === WebSocketMessageType.TASK_COMPLETE) {
      this.emit("task:complete", payload)
    }

    if (messageType === WebSocketMessageType.TASK_FAILED) {
      this.emit("task:failed", payload)
    }

    if (typeof payload.article_id === "number") {
      this.emit(`task:event:article:${payload.article_id}`, taskEvent)

      if (messageType === WebSocketMessageType.TASK_UPDATE) {
        this.emit(`task:update:article:${payload.article_id}`, payload)
      }

      if (messageType === WebSocketMessageType.TASK_COMPLETE) {
        this.emit(`task:complete:article:${payload.article_id}`, payload)
      }

      if (messageType === WebSocketMessageType.TASK_FAILED) {
        this.emit(`task:failed:article:${payload.article_id}`, payload)
      }
    }

    if (payload.task_type === "image") {
      if (messageType === WebSocketMessageType.TASK_UPDATE) {
        this.emit("image:task:update", payload)
      }

      if (messageType === WebSocketMessageType.TASK_COMPLETE) {
        this.emit("image:task:complete", payload)
      }

      if (messageType === WebSocketMessageType.TASK_FAILED) {
        this.emit("image:task:failed", payload)
      }
    }
  }

  private showTaskToast(kind: "success" | "error", payload: TaskUpdatePayload) {
    if (!this.toast) return

    const locale = this.getLocale()
    const taskTypeLabel = this.getTaskTypeLabel(payload.task_type, locale)
    const title =
      kind === "success"
        ? locale === "zh"
          ? "任务完成"
          : "Task completed"
        : locale === "zh"
        ? "任务失败"
        : "Task failed"
    const description =
      kind === "success"
        ? locale === "zh"
          ? `#${payload.task_id} ${taskTypeLabel}`
          : `#${payload.task_id} ${taskTypeLabel}`
        : payload.error ||
          (locale === "zh"
            ? `#${payload.task_id} ${taskTypeLabel}`
            : `#${payload.task_id} ${taskTypeLabel}`)

    this.toast({
      title,
      description,
      variant: kind === "success" ? "default" : "destructive",
      onClick: () => {
        window.location.href = `/articles?taskCenter=1&taskId=${payload.task_id}&taskType=${payload.task_type}`
      },
    })
  }

  private getLocale(): "zh" | "en" {
    if (typeof window === "undefined") return "en"

    const locale = localStorage.getItem("locale") || navigator.language || "en"
    return locale.toLowerCase().startsWith("zh") ? "zh" : "en"
  }

  private getTaskTypeLabel(taskType: TaskCenterTaskType, locale: "zh" | "en"): string {
    const labels = {
      zh: {
        article: "文章任务",
        image: "图片任务",
        infographic: "信息图任务",
      },
      en: {
        article: "article job",
        image: "image job",
        infographic: "infographic job",
      },
    } as const

    return labels[locale][taskType]
  }

  private emit(event: string, data: unknown) {
    const listeners = this.eventListeners.get(event)
    listeners?.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("[WebSocket] Event listener failed", {
          event,
          error,
        })
      }
    })
  }
}

export const webSocketService = new WebSocketService()
