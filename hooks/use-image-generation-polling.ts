import { useRef, useCallback, useState, useMemo } from 'react'
import { imageGenerationClient } from '@/lib/api/image-generation/client'
import type {
  TaskResultResponse,
  GenerationTaskStorage,
  PollingConfig,
} from '@/lib/api/image-generation/types'
import { DEFAULT_POLLING_CONFIG } from '@/lib/api/image-generation/types'
import { useAdaptivePolling } from '@/lib/hooks/use-adaptive-polling'

/**
 * 保存任务到 localStorage
 * @param storage - 任务存储对象
 * @param config - 轮询配置
 */
export function saveTaskToStorage(
  storage: GenerationTaskStorage,
  config: PollingConfig
): void {
  try {
    // TRACE: localStorage 写入 - 记录任务持久化
    console.debug('[ImageGeneration] Saving task to localStorage:', {
      taskId: storage.task_id,
      status: storage.status,
      hasPrompt: !!storage.prompt,
      hasConfig: !!storage.config,
    })

    localStorage.setItem(config.storageKey, JSON.stringify(storage))
  } catch (error) {
    // WARN: localStorage 写入失败 - 不影响主流程
    console.warn('[ImageGeneration] Failed to save task to localStorage:', error)
  }
}

/**
 * 从 localStorage 加载任务
 * @param config - 轮询配置
 * @returns 任务存储对象或 null（如果不存在或已过期）
 */
export function loadTaskFromStorage(
  config: PollingConfig
): GenerationTaskStorage | null {
  try {
    const data = localStorage.getItem(config.storageKey)
    if (!data) {
      return null
    }

    const storage: GenerationTaskStorage = JSON.parse(data)

    // 检查任务是否过期（1小时）
    const createdAt = new Date(storage.created_at).getTime()
    const now = Date.now()
    const isExpired = now - createdAt > config.taskExpiry

    if (isExpired) {
      // DEBUG: 任务过期 - 自动清理
      console.debug('[ImageGeneration] Task expired, removing from localStorage:', {
        taskId: storage.task_id,
        createdAt: storage.created_at,
        ageMinutes: Math.floor((now - createdAt) / 60000),
      })

      clearTaskFromStorage(config)
      return null
    }

    // TRACE: localStorage 读取 - 记录任务恢复
    console.debug('[ImageGeneration] Loaded task from localStorage:', {
      taskId: storage.task_id,
      status: storage.status,
      ageMinutes: Math.floor((now - createdAt) / 60000),
    })

    return storage
  } catch (error) {
    // WARN: localStorage 读取失败 - 清理可能损坏的数据
    console.warn('[ImageGeneration] Failed to load task from localStorage:', error)
    clearTaskFromStorage(config)
    return null
  }
}

/**
 * 清除 localStorage 中的任务
 * @param config - 轮询配置
 */
export function clearTaskFromStorage(config: PollingConfig): void {
  try {
    localStorage.removeItem(config.storageKey)
  } catch (error) {
    // WARN: localStorage 清除失败 - 不影响主流程
    console.warn('[ImageGeneration] Failed to clear task from localStorage:', error)
  }
}

/**
 * 图片生成轮询 Hook 参数
 */
export interface UseImageGenerationPollingParams {
  /** 轮询配置（可选，默认使用 DEFAULT_POLLING_CONFIG） */
  config?: Partial<PollingConfig>
  /** 进度回调（轮询中）*/
  onProgress?: (result: TaskResultResponse) => void
  /** 成功回调 */
  onSuccess?: (result: TaskResultResponse & { status: 'success' }) => void
  /** 失败回调 */
  onError?: (error: Error) => void
  /** 超时回调 */
  onTimeout?: () => void
}

/**
 * 图片生成轮询 Hook 返回值
 */
export interface UseImageGenerationPollingReturn {
  /** 开始轮询 */
  startPolling: (taskId: string, storage?: Omit<GenerationTaskStorage, 'task_id' | 'created_at'>) => Promise<void>
  /** 停止轮询 */
  stopPolling: () => void
  /** 是否正在轮询 */
  isPolling: boolean
  /** 当前任务 ID */
  currentTaskId: string | null
}

/**
 * 图片生成轮询 Hook
 *
 * 使用指数退避策略轮询图片生成任务结果
 *
 * @param params - Hook 参数
 * @returns 轮询控制对象
 *
 * @example
 * const { startPolling, stopPolling, isPolling } = useImageGenerationPolling({
 *   onSuccess: (result) => {
 *     console.log('Image generated:', result.image_url)
 *   },
 *   onError: (error) => {
 *     console.error('Generation failed:', error.message)
 *   },
 * })
 *
 * // 开始轮询
 * await startPolling('img_abc123', {
 *   status: 'pending',
 *   prompt: 'A beautiful landscape',
 * })
 */
export function useImageGenerationPolling(
  params: UseImageGenerationPollingParams = {}
): UseImageGenerationPollingReturn {
  const {
    config: customConfig,
    onProgress,
    onSuccess,
    onError,
    onTimeout,
  } = params

  // 合并默认配置
  const config = useMemo<PollingConfig>(() => ({
    ...DEFAULT_POLLING_CONFIG,
    ...customConfig,
  }), [customConfig])

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const currentTaskIdRef = useRef<string | null>(null)

  const {
    isPolling,
    startPolling: startAdaptivePolling,
    stopPolling: stopAdaptivePolling,
  } = useAdaptivePolling({
    poll: async ({ attempt, elapsedMs, signal }) => {
      const taskId = currentTaskIdRef.current
      if (!taskId) return 'stop'
      if (attempt >= config.maxAttempts) {
        console.error('[ImageGeneration] Max polling attempts reached:', {
          taskId,
          attemptCount: attempt,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
        })
        clearTaskFromStorage(config)
        currentTaskIdRef.current = null
        setCurrentTaskId(null)
        onError?.(new Error('Polling timeout: max attempts reached'))
        return 'stop'
      }

      const result = await imageGenerationClient.getTaskResult(taskId, signal)
      if (signal.aborted) return 'stop'
      if ('error' in result) {
        console.warn('[ImageGeneration] Polling attempt failed; retrying:', {
          taskId,
          attemptCount: attempt,
          error: result.error,
        })
        throw new Error(String(result.error))
      }

      if (result.status === 'success') {
        console.info('[ImageGeneration] Task completed successfully:', {
          taskId,
          imageUrl: result.image_url,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
          attemptCount: attempt,
        })
        clearTaskFromStorage(config)
        currentTaskIdRef.current = null
        setCurrentTaskId(null)
        onSuccess?.(result)
        return 'stop'
      }
      if (result.status === 'failed') {
        console.error('[ImageGeneration] Task failed:', {
          taskId,
          errorMessage: result.error_message,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
          attemptCount: attempt,
        })
        clearTaskFromStorage(config)
        currentTaskIdRef.current = null
        setCurrentTaskId(null)
        onError?.(new Error(result.error_message))
        return 'stop'
      }

      console.debug('[ImageGeneration] Task status:', {
        taskId,
        status: result.status,
        attemptCount: attempt,
        elapsedSeconds: Math.floor(elapsedMs / 1000),
      })
      onProgress?.(result)
      return 'continue'
    },
    onTimeout: () => {
      console.error('[ImageGeneration] Polling timeout:', {
        taskId: currentTaskIdRef.current,
      })
      clearTaskFromStorage(config)
      currentTaskIdRef.current = null
      setCurrentTaskId(null)
      onTimeout?.()
    },
    policy: {
      fastIntervalMs: config.minDelay,
      standardIntervalMs: Math.min(10_000, config.maxDelay),
      slowIntervalMs: config.maxDelay,
      maxErrorIntervalMs: config.maxDelay,
      timeoutMs: config.timeout,
    },
    debugLabel: 'image-generation-hook',
  })

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    if (isPolling) {
      // DEBUG: 停止轮询 - 用户主动停止或组件卸载
      console.debug('[ImageGeneration] Stopping polling:', {
        taskId: currentTaskId,
      })

      stopAdaptivePolling()
      currentTaskIdRef.current = null
      setCurrentTaskId(null)
    }
  }, [currentTaskId, isPolling, stopAdaptivePolling])

  /**
   * 开始轮询
   */
  const startPolling = useCallback(
    async (
      taskId: string,
      storage?: Omit<GenerationTaskStorage, 'task_id' | 'created_at'>
    ) => {
      if (isPolling) {
        console.warn('[ImageGeneration] Polling already in progress, ignoring new request')
        return
      }

      // TRACE: 轮询入口 - 记录轮询开始
      console.info('[ImageGeneration] Starting polling:', {
        taskId,
        hasPrompt: !!storage?.prompt,
        hasConfig: !!storage?.config,
        initialDelay: config.initialDelay,
      })

      // 保存任务到 localStorage
      if (storage) {
        saveTaskToStorage(
          {
            ...storage,
            task_id: taskId,
            created_at: new Date().toISOString(),
          },
          config
        )
      }

      currentTaskIdRef.current = taskId
      setCurrentTaskId(taskId)
      startAdaptivePolling({ delayMs: config.initialDelay })
    },
    [config, isPolling, startAdaptivePolling]
  )

  return {
    startPolling,
    stopPolling,
    isPolling,
    currentTaskId,
  }
}
