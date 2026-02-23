import { useCallback, useEffect, useRef, useState } from 'react'
import { articlesClient } from '@/lib/api/articles/client'

/**
 * 自动保存状态
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutoSaveState {
  status: AutoSaveStatus
  lastSavedAt: Date | null
  retryCount: number
}

/**
 * useAutoSave Hook 配置选项
 */
export interface UseAutoSaveOptions {
  articleId: number | null      // 文章 ID（编辑模式必填）
  isEditMode: boolean           // 是否为编辑模式
  delay?: number                // 防抖延迟（默认 3000ms）
  maxRetries?: number           // 最大重试次数（默认 3）
  onSaved?: () => void          // 保存成功回调
  onError?: (error: Error) => void // 保存失败回调
}

/**
 * useAutoSave Hook 返回值
 */
export interface UseAutoSaveReturn {
  saveState: AutoSaveState      // 当前保存状态
  triggerSave: (content: string) => void  // 触发保存
  cancelPendingSave: () => void // 取消待处理保存
  resetSaveState: () => void    // 重置状态
}

/**
 * 重试延迟配置（指数退避：1s → 2s → 4s）
 */
const RETRY_DELAYS = [1000, 2000, 4000]

/**
 * 检查是否为 AbortError
 * 支持多种浏览器和环境的错误格式
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    // 标准 AbortError
    if (error.name === 'AbortError') {
      return true
    }
    // 某些环境的错误代码
    if ((error as any).code === 'ERR_ABORTED') {
      return true
    }
    // 通过消息内容判断
    if (error.message?.includes('abort')) {
      return true
    }
  }
  return false
}

/**
 * 自动保存 Hook
 *
 * 功能：
 * - 智能防抖：每次编辑重置计时器（默认 3 秒）
 * - 竞态条件处理：使用请求版本号，只接受最新响应
 * - 指数退避重试：失败后重试 3 次（1s → 2s → 4s）
 * - 请求取消：使用 AbortController 取消过期请求
 *
 * 可观测性：
 * - 日志前缀：[AutoSave]
 * - 指标收集点：auto_save_attempt, auto_save_success, auto_save_error
 *
 * @example
 * ```tsx
 * const autoSave = useAutoSave({
 *   articleId: 123,
 *   isEditMode: true,
 *   delay: 3000,
 *   onSaved: () => console.log('Saved!')
 * })
 *
 * // 在内容变化时触发
 * onChange={(content) => autoSave.triggerSave(content)}
 * ```
 */
export function useAutoSave({
  articleId,
  isEditMode,
  delay = 3000,
  maxRetries = 3,
  onSaved,
  onError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  // 保存状态
  const [saveState, setSaveState] = useState<AutoSaveState>({
    status: 'idle',
    lastSavedAt: null,
    retryCount: 0,
  })

  // 防抖计时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 状态重置计时器
  const statusResetTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 请求版本号（用于竞态条件处理）
  const requestVersionRef = useRef(0)

  // AbortController（用于取消请求）
  const abortControllerRef = useRef<AbortController | null>(null)

  // 保存中的内容（用于重试）
  const savingContentRef = useRef<string | null>(null)

  /**
   * 执行保存到 API
   */
  const performSave = useCallback(async (content: string, attempt: number = 0): Promise<void> => {
    // 只在编辑模式下执行保存
    if (!isEditMode || !articleId) {
      console.debug('[AutoSave] Skipped: not in edit mode or missing articleId')
      return
    }

    // DEBUG: 在链路节点打印
    console.debug('[AutoSave] Triggering save', {
      articleId,
      attempt: attempt + 1,
      maxRetries: maxRetries + 1,
      contentLength: content.length,
    })

    // 更新状态为保存中
    setSaveState(prev => ({
      ...prev,
      status: 'saving',
      retryCount: attempt,
    }))

    // 取消上一个请求
    if (abortControllerRef.current) {
      console.debug('[AutoSave] Aborting previous request')
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    // 记录当前版本号和内容
    const currentVersion = ++requestVersionRef.current
    savingContentRef.current = content

    try {
      // INFO: 关键路径
      console.info('[AutoSave] Saving article', {
        articleId,
        version: currentVersion,
        attempt: attempt + 1,
      })

      // METRIC: auto_save_attempt - 指标标签: status (saving), attempt (0-2)
      await articlesClient.updateArticleContent(articleId, {
        content,
      }, {
        signal: abortControllerRef.current.signal,
      })

      // 只处理最新请求的响应（竞态条件处理）
      if (currentVersion === requestVersionRef.current) {
        console.info('[AutoSave] Save successful', {
          articleId,
          version: currentVersion,
          contentLength: content.length,
        })

        // METRIC: auto_save_success - 指标标签: article_id
        setSaveState({
          status: 'saved',
          lastSavedAt: new Date(),
          retryCount: 0,
        })

        // 触发保存成功回调
        onSaved?.()

        // 清除之前的状态重置计时器
        if (statusResetTimerRef.current) {
          clearTimeout(statusResetTimerRef.current)
        }

        // 3 秒后重置为 idle 状态
        statusResetTimerRef.current = setTimeout(() => {
          setSaveState(prev => {
            // 只有当前状态仍然是 saved 时才重置
            if (prev.status === 'saved') {
              console.debug('[AutoSave] Status reset to idle')
              return { ...prev, status: 'idle' }
            }
            return prev
          })
        }, 3000)
      }
    } catch (error) {
      // 只处理最新请求的错误（竞态条件处理）
      if (currentVersion === requestVersionRef.current) {
        // 检查是否是主动取消的请求
        if (isAbortError(error)) {
          console.debug('[AutoSave] Request aborted')
          return
        }

        // WARN: 可能出错的地方
        console.warn('[AutoSave] Save attempt failed', {
          articleId,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: error instanceof Error ? error.message : String(error),
        })

        // 尝试重试
        if (attempt < maxRetries) {
          const retryDelay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]

          console.info('[AutoSave] Scheduling retry', {
            articleId,
            attempt: attempt + 2,
            delay: retryDelay,
          })

          // 使用指数退避延迟后重试
          setTimeout(() => {
            // 确保内容没有变化
            if (savingContentRef.current === content) {
              performSave(content, attempt + 1)
            } else {
              console.debug('[AutoSave] Content changed, skipping retry')
            }
          }, retryDelay)
        } else {
          // ERROR: 严禁 err 被隐藏
          console.error('[AutoSave] All retry attempts failed', {
            articleId,
            totalAttempts: attempt + 1,
            error,
          })

          // METRIC: auto_save_error - 指标标签: error_type, attempt
          setSaveState(prev => ({
            ...prev,
            status: 'error',
            retryCount: attempt,
          }))

          // 触发错误回调
          if (error instanceof Error) {
            onError?.(error)
          }
        }
      }
    }
  }, [isEditMode, articleId, maxRetries, onSaved, onError])

  /**
   * 触发自动保存（带防抖）
   */
  const triggerSave = useCallback((content: string) => {
    // 只在编辑模式下触发
    if (!isEditMode || !articleId) {
      return
    }

    // 清除之前的防抖计时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 如果内容为空，不触发保存
    if (!content || content.trim() === '') {
      console.debug('[AutoSave] Skipped: empty content')
      return
    }

    // 内容长度预检查（10MB 限制）
    if (content.length > 10 * 1024 * 1024) {
      console.warn('[AutoSave] Skipped: content too large', {
        contentLength: content.length,
        maxSize: 10 * 1024 * 1024,
      })
      return
    }

    console.debug('[AutoSave] Debounced save scheduled', {
      articleId,
      delay,
    })

    // 设置新的防抖计时器
    debounceTimerRef.current = setTimeout(() => {
      performSave(content)
    }, delay)
  }, [isEditMode, articleId, delay, performSave])

  /**
   * 取消待处理的保存
   */
  const cancelPendingSave = useCallback(() => {
    // 清除防抖计时器
    if (debounceTimerRef.current) {
      console.debug('[AutoSave] Cancelling debounced save')
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // 清除状态重置计时器
    if (statusResetTimerRef.current) {
      clearTimeout(statusResetTimerRef.current)
      statusResetTimerRef.current = null
    }

    // 取消进行中的请求
    if (abortControllerRef.current) {
      console.debug('[AutoSave] Aborting in-flight request')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  /**
   * 重置保存状态
   */
  const resetSaveState = useCallback(() => {
    console.debug('[AutoSave] Resetting save state')
    cancelPendingSave()
    setSaveState({
      status: 'idle',
      lastSavedAt: null,
      retryCount: 0,
    })
  }, [cancelPendingSave])

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      console.debug('[AutoSave] Cleanup on unmount')
      cancelPendingSave()
    }
  }, [cancelPendingSave])

  return {
    saveState,
    triggerSave,
    cancelPendingSave,
    resetSaveState,
  }
}
