import { useEffect, useRef, useCallback, useState } from 'react'
import { imageGenerationClient } from '@/lib/api/image-generation/client'
import type {
  TaskResultResponse,
  GenerationTaskStorage,
  PollingConfig,
} from '@/lib/api/image-generation/types'
import { DEFAULT_POLLING_CONFIG } from '@/lib/api/image-generation/types'

// 指数退避睡眠函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  const config: PollingConfig = {
    ...DEFAULT_POLLING_CONFIG,
    ...customConfig,
  }

  // 使用 useState 而不是 useRef 以提供响应式状态
  const [isPolling, setIsPolling] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  const shouldStopRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    if (isPolling) {
      // DEBUG: 停止轮询 - 用户主动停止或组件卸载
      console.debug('[ImageGeneration] Stopping polling:', {
        taskId: currentTaskId,
      })

      shouldStopRef.current = true
      setIsPolling(false)

      // 取消进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [isPolling, currentTaskId])

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

      setIsPolling(true)
      shouldStopRef.current = false
      setCurrentTaskId(taskId)
      abortControllerRef.current = new AbortController()

      let delay = config.minDelay
      let attemptCount = 0
      const startTime = Date.now()

      try {
        // 初始延迟（给后端足够时间提交任务）
        await sleep(config.initialDelay)

        while (!shouldStopRef.current && attemptCount < config.maxAttempts) {
          // 检查超时
          const elapsed = Date.now() - startTime
          if (elapsed > config.timeout) {
            // ERROR: 轮询超时 - 任务执行时间过长
            console.error('[ImageGeneration] Polling timeout:', {
              taskId,
              elapsedSeconds: Math.floor(elapsed / 1000),
              attemptCount,
            })

            clearTaskFromStorage(config)
            onTimeout?.()
            break
          }

          attemptCount++

          try {
            // 调用 API 获取任务结果，传递 signal 以支持取消
            const result = await imageGenerationClient.getTaskResult(
              taskId,
              abortControllerRef.current?.signal
            )

            // 检查是否需要停止
            if (shouldStopRef.current) {
              break
            }

            // 根据任务状态处理
            if (result.status === 'success') {
              // INFO: 任务完成 - 轮询成功
              console.info('[ImageGeneration] Task completed successfully:', {
                taskId,
                imageUrl: result.image_url,
                elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
                attemptCount,
              })

              clearTaskFromStorage(config)
              onSuccess?.(result)
              break
            } else if (result.status === 'failed') {
              // ERROR: 任务失败 - 后端返回失败状态
              console.error('[ImageGeneration] Task failed:', {
                taskId,
                errorMessage: result.error_message,
                elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
                attemptCount,
              })

              clearTaskFromStorage(config)
              onError?.(new Error(result.error_message))
              break
            } else if (result.status === 'processing' || result.status === 'pending') {
              // DEBUG: 任务处理中 - 继续轮询
              console.debug('[ImageGeneration] Task status:', {
                taskId,
                status: result.status as 'processing' | 'pending',  // 记录实际状态（pending 或 processing）
                attemptCount,
                elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
                nextDelaySeconds: Math.floor(delay / 1000),
              })

              onProgress?.(result)

              // 等待下次轮询（指数退避）
              await sleep(delay)

              // 更新延迟时间（指数退避，最大不超过 maxDelay）
              delay = Math.min(delay * 2, config.maxDelay)
            }
          } catch (error) {
            // ERROR: 网络错误或 API 错误 - 继续重试
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('[ImageGeneration] Polling attempt failed:', {
              taskId,
              attemptCount,
              error: errorMessage,
            })

            // 如果是用户主动停止，不重试
            if (shouldStopRef.current) {
              break
            }

            // 等待后重试
            await sleep(delay)
            delay = Math.min(delay * 2, config.maxDelay)
          }
        }

        // 检查是否达到最大尝试次数
        if (
          !shouldStopRef.current &&
          attemptCount >= config.maxAttempts
        ) {
          // ERROR: 达到最大尝试次数 - 轮询失败
          console.error('[ImageGeneration] Max polling attempts reached:', {
            taskId,
            attemptCount,
            elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
          })

          clearTaskFromStorage(config)
          onError?.(new Error('Polling timeout: max attempts reached'))
        }
      } finally {
        // TRACE: 轮询退出 - 清理状态
        setIsPolling(false)
        setCurrentTaskId(null)
        abortControllerRef.current = null

        console.debug('[ImageGeneration] Polling stopped:', {
          taskId,
          reason: shouldStopRef.current ? 'user cancelled' : 'completed or failed',
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, onProgress, onSuccess, onError, onTimeout, isPolling]
  )

  // 组件卸载时自动停止轮询
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    startPolling,
    stopPolling,
    isPolling,
    currentTaskId,
  }
}
