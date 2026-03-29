/**
 * AI 文章编辑轮询 Hook
 *
 * 功能：
 * - 指数退避轮询（2s → 4s → 8s → 16s → 30s，最大 30s）
 * - 最多轮询 5 分钟
 * - localStorage 持久化
 * - 页面刷新后恢复轮询
 * - 轮询完成/失败后的回调
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { articlesClient } from '@/lib/api/articles/client'
export interface ArticleEditState {
  execId: string;
  articleId: number;
  editType: string;
  status: 'waiting' | 'completed' | 'failed';
  createdAt: string;
  responseText?: string;
  errorMessage?: string;
}

const POLLING_DELAYS = [2000, 4000, 8000, 16000, 30000] as const
const MAX_DURATION = 5 * 60 * 1000  // 5 分钟

export interface ArticleEditPollingCallbacks {
  onCompleted?: (responseText: string) => void
  onFailed?: (error: string) => void
  onTimeout?: () => void
}

export function useArticleEditPolling(articleId: number) {
  const [editState, setEditState] = useState<ArticleEditState | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // 使用 ref 避免闭包问题
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const attemptRef = useRef(0)
  const isPollingRef = useRef(false)

  // 生成 localStorage key
  const storageKey = `article_edit_${articleId}`

  /**
   * 保存状态到 localStorage
   */
  const saveState = useCallback((state: ArticleEditState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      console.debug('[ArticleEditPolling] State saved', { execId: state.execId, status: state.status })
    } catch (error) {
      console.error('[ArticleEditPolling] Failed to save state', error)
    }
  }, [storageKey])

  /**
   * 从 localStorage 加载状态
   */
  const loadState = useCallback((): ArticleEditState | null => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const state = JSON.parse(saved) as ArticleEditState
      console.debug('[ArticleEditPolling] State loaded', { execId: state.execId, status: state.status })
      return state
    } catch (error) {
      console.error('[ArticleEditPolling] Failed to load state', error)
      return null
    }
  }, [storageKey])

  /**
   * 清除 localStorage 状态
   */
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      console.debug('[ArticleEditPolling] State cleared')
    } catch (error) {
      console.error('[ArticleEditPolling] Failed to clear state', error)
    }
  }, [storageKey])

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    isPollingRef.current = false
    setIsPolling(false)
    console.debug('[ArticleEditPolling] Polling stopped')
  }, [])

  /**
   * 执行单次轮询
   */
  const pollOnce = useCallback(async (
    execId: string,
    attempt: number,
    startTime: number,
    callbacks: ArticleEditPollingCallbacks
  ) => {
    try {
      console.debug('[ArticleEditPolling] Polling attempt', { execId, attempt })

      const result = await articlesClient.getEditStatus(execId)

      if ('error' in result) {
        throw new Error(result.error)
      }

      const { status, data, error } = result

      // 检查是否超时
      const elapsed = Date.now() - startTime
      if (elapsed > MAX_DURATION) {
        console.warn('[ArticleEditPolling] Timeout after 5 minutes', { execId, elapsed })
        stopPolling()
        callbacks.onTimeout?.()
        return
      }

      if (status === 'success') {
        // 轮询成功
        console.info('[ArticleEditPolling] Completed', { execId, duration: elapsed })

        const newState: ArticleEditState = {
          ...loadState()!,
          status: 'completed',
          responseText: data,
        }

        saveState(newState)
        setEditState(newState)
        stopPolling()
        callbacks.onCompleted?.(data || '')
        return
      }

      if (status === 'failed') {
        // 轮询失败
        console.error('[ArticleEditPolling] Failed', { execId, error })

        const newState: ArticleEditState = {
          ...loadState()!,
          status: 'failed',
          errorMessage: error,
        }

        saveState(newState)
        setEditState(newState)
        stopPolling()
        callbacks.onFailed?.(error || 'Unknown error')
        return
      }

      // 继续轮询（status === 'pending'）
      const nextDelay = POLLING_DELAYS[Math.min(attempt, POLLING_DELAYS.length - 1)]
      attemptRef.current = attempt + 1

      console.debug('[ArticleEditPolling] Scheduling next poll', {
        execId,
        nextDelay,
        nextAttempt: attemptRef.current
      })

      pollingTimeoutRef.current = setTimeout(() => {
        if (isPollingRef.current) {
          pollOnce(execId, attemptRef.current, startTime, callbacks)
        }
      }, nextDelay)

    } catch (error) {
      console.error('[ArticleEditPolling] Poll attempt failed', {
        execId,
        attempt,
        error: error instanceof Error ? error.message : String(error)
      })

      // 网络错误，使用指数退避重试
      const nextDelay = POLLING_DELAYS[Math.min(attempt, POLLING_DELAYS.length - 1)]
      attemptRef.current = attempt + 1

      pollingTimeoutRef.current = setTimeout(() => {
        if (isPollingRef.current) {
          pollOnce(execId, attemptRef.current, startTime, callbacks)
        }
      }, nextDelay)
    }
  }, [loadState, saveState, stopPolling])

  /**
   * 开始轮询
   */
  const startPolling = useCallback((
    initialState: ArticleEditState,
    callbacks: ArticleEditPollingCallbacks = {}
  ) => {
    // 停止之前的轮询
    stopPolling()

    console.info('[ArticleEditPolling] Starting', {
      execId: initialState.execId,
      articleId: initialState.articleId,
      editType: initialState.editType
    })

    // 保存初始状态
    saveState(initialState)
    setEditState(initialState)

    // 开始轮询
    isPollingRef.current = true
    setIsPolling(true)
    startTimeRef.current = Date.now()
    attemptRef.current = 0

    // 首次轮询
    pollOnce(initialState.execId, 0, startTimeRef.current, callbacks)
  }, [saveState, stopPolling, pollOnce])

  /**
   * 页面刷新后恢复轮询
   */
  useEffect(() => {
    const savedState = loadState()

    if (savedState && savedState.status === 'waiting') {
      console.info('[ArticleEditPolling] Restoring polling after page refresh', {
        execId: savedState.execId
      })

      setEditState(savedState)
      isPollingRef.current = true
      setIsPolling(true)

      // 恢复轮询（重新计算开始时间以避免超时问题）
      const elapsedSinceCreation = Date.now() - new Date(savedState.createdAt).getTime()
      const remainingTime = MAX_DURATION - elapsedSinceCreation

      if (remainingTime <= 0) {
        console.warn('[ArticleEditPolling] Already timed out before page refresh')
        return
      }

      startTimeRef.current = Date.now()
      attemptRef.current = 0

      // 开始轮询
      pollOnce(savedState.execId, 0, startTimeRef.current, {})
    }
  }, [loadState, pollOnce])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    editState,
    isPolling,
    startPolling,
    stopPolling,
    clearState,
  }
}
