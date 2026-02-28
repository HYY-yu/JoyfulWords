"use client"

import { useEffect, useRef, useCallback } from 'react'
import { articlesClient } from '@/lib/api/articles/client'
import { isAIEditExpired, AI_EDIT_MAX_WAIT_MS } from './use-ai-edit-state'
import type { AIEditState } from './use-ai-edit-state'

const INITIAL_INTERVAL_MS = 3_000   // 3 秒
const MAX_INTERVAL_MS = 30_000      // 上限 30 秒

interface PollerState {
  timer: ReturnType<typeof setTimeout> | null
  interval: number
  isActive: boolean
}

interface UseMultipleAIEditPollersOptions {
  tasks: Map<string, AIEditState>
  onSuccess: (execId: string, responseText: string) => void
  onError: (execId: string, message: string) => void
  onExpired: (execId: string) => void
}

/**
 * 多任务 AI 编辑轮询 Hook
 *
 * 为每个 waiting 状态的任务启动独立的轮询
 */
export function useMultipleAIEditPollers({
  tasks,
  onSuccess,
  onError,
  onExpired,
}: UseMultipleAIEditPollersOptions) {
  const pollersRef = useRef<Map<string, PollerState>>(new Map())

  // 使用稳定引用
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onExpiredRef = useRef(onExpired)

  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  onExpiredRef.current = onExpired

  // 停止单个轮询器
  const stopPoller = useCallback((execId: string) => {
    const poller = pollersRef.current.get(execId)
    if (poller?.timer) {
      clearTimeout(poller.timer)
    }
    pollersRef.current.delete(execId)
  }, [])

  // 启动单个轮询器
  const startPoller = useCallback((execId: string, task: AIEditState) => {
    // 先停止已有的轮询器
    stopPoller(execId)

    const poller: PollerState = {
      timer: null,
      interval: INITIAL_INTERVAL_MS,
      isActive: true,
    }

    pollersRef.current.set(execId, poller)

    const poll = (attempt: number) => {
      const poller = pollersRef.current.get(execId)
      if (!poller?.isActive) return

      // 超时检查
      const elapsed = Date.now() - task.started_at
      if (elapsed >= AI_EDIT_MAX_WAIT_MS) {
        stopPoller(execId)
        onExpiredRef.current(execId)
        return
      }

      articlesClient.getEditStatus(execId).then((result) => {
        const poller = pollersRef.current.get(execId)
        if (!poller?.isActive) return

        console.log('[MultiplePollers] Polling result for exec_id:', execId)
        console.log('[MultiplePollers] result.status:', result.status)
        console.log('[MultiplePollers] result.data:', result.data)

        if ('error' in result) {
          stopPoller(execId)
          onErrorRef.current(execId, result.error ?? '请求失败')
          return
        }

        if (result.status === 'success') {
          console.log('[MultiplePollers] Success! data:', result.data)
          console.log('[MultiplePollers] data length:', result.data?.length)
          stopPoller(execId)
          onSuccessRef.current(execId, result.data || '')  // ✅ 使用 data 字段
          return
        }

        if (result.status === 'failed') {
          stopPoller(execId)
          onErrorRef.current(execId, result.error ?? '编辑失败')
          return
        }

        // pending：指数退避，下次重试
        const nextInterval = Math.min(poller.interval * 2, MAX_INTERVAL_MS)
        poller.interval = nextInterval

        const remaining = AI_EDIT_MAX_WAIT_MS - (Date.now() - task.started_at)
        const delay = Math.min(nextInterval, remaining)

        poller.timer = setTimeout(() => {
          poll(attempt + 1)
        }, delay)
      }).catch(() => {
        const poller = pollersRef.current.get(execId)
        if (!poller?.isActive) return

        // 网络错误，指数退避重试
        const nextInterval = Math.min(poller.interval * 2, MAX_INTERVAL_MS)
        poller.interval = nextInterval

        poller.timer = setTimeout(() => {
          poll(attempt + 1)
        }, nextInterval)
      })
    }

    // 立即开始第一次轮询
    poller.timer = setTimeout(() => {
      poll(0)
    }, INITIAL_INTERVAL_MS)
  }, [stopPoller])

  // 监听 tasks 变化，启动/停止轮询器
  useEffect(() => {
    const currentExecIds = new Set(tasks.keys())
    const activeExecIds = new Set(pollersRef.current.keys())

    // 启动新的 waiting 任务
    tasks.forEach((task, execId) => {
      if (task.status === 'waiting' && !activeExecIds.has(execId)) {
        // 检查是否已超时
        if (isAIEditExpired(task)) {
          onExpiredRef.current(execId)
          return
        }
        startPoller(execId, task)
      }
    })

    // 停止已不存在或状态不再是 waiting 的任务
    activeExecIds.forEach(execId => {
      const task = tasks.get(execId)
      if (!task || task.status !== 'waiting') {
        stopPoller(execId)
      }
    })

    // 组件卸载时清理所有轮询器
    return () => {
      pollersRef.current.forEach((_, execId) => {
        stopPoller(execId)
      })
    }
  }, [tasks, startPoller, stopPoller])
}
