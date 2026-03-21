"use client"

import { useEffect, useRef, useCallback } from 'react'
import { articlesClient } from '@/lib/api/articles/client'
import { isAIEditExpired, AI_EDIT_MAX_WAIT_MS } from './use-ai-edit-state'
import type { AIEditState } from './use-ai-edit-state'

const INITIAL_INTERVAL_MS = 3_000   // 3 秒
const MAX_INTERVAL_MS = 30_000      // 上限 30 秒

interface UseAIEditStatusPollerOptions {
    state: AIEditState | null
    onSuccess: (responseText: string) => void
    onError: (message: string) => void
    onExpired: () => void
}

/**
 * 指数退避轮询 Hook
 *
 * 当 state.status === 'waiting' 时启动轮询，轮询 /article/edit/status/:exec_id。
 * - 成功：调用 onSuccess 并停止
 * - 失败：调用 onError 并停止
 * - 超过 5 分钟：调用 onExpired 并停止
 * - 组件卸载：清理定时器
 */
export function useAIEditStatusPoller({
    state,
    onSuccess,
    onError,
    onExpired,
}: UseAIEditStatusPollerOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = useRef<number>(INITIAL_INTERVAL_MS)
    const isActiveRef = useRef<boolean>(false)

    // 使用稳定引用避免 useEffect 重复触发
    const onSuccessRef = useRef(onSuccess)
    const onErrorRef = useRef(onError)
    const onExpiredRef = useRef(onExpired)
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
    onExpiredRef.current = onExpired

    const stop = useCallback(() => {
        isActiveRef.current = false
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        intervalRef.current = INITIAL_INTERVAL_MS
    }, [])

    const poll = useCallback((execId: string, startedAt: number) => {
        if (!isActiveRef.current) return

        // 超时检查
        const elapsed = Date.now() - startedAt
        if (elapsed >= AI_EDIT_MAX_WAIT_MS) {
            stop()
            onExpiredRef.current()
            return
        }

        articlesClient.getEditStatus(execId).then((result) => {
            if (!isActiveRef.current) return

            if ('error' in result) {
                stop()
                onErrorRef.current(result.error ?? '请求失败')
                return
            }

            if (result.status === 'success') {
                stop()
                onSuccessRef.current(result.data || '')
                return
            }

            if (result.status === 'failed') {
                stop()
                onErrorRef.current(result.error ?? '编辑失败')
                return
            }

            // pending：指数退避，下次重试
            const nextInterval = Math.min(intervalRef.current * 2, MAX_INTERVAL_MS)
            intervalRef.current = nextInterval

            // 确保下次轮询时间不会超过剩余等待时间
            const remaining = AI_EDIT_MAX_WAIT_MS - (Date.now() - startedAt)
            const delay = Math.min(nextInterval, remaining)

            timerRef.current = setTimeout(() => {
                poll(execId, startedAt)
            }, delay)
        }).catch(() => {
            if (!isActiveRef.current) return
            // 网络错误时也进行指数退避重试
            const nextInterval = Math.min(intervalRef.current * 2, MAX_INTERVAL_MS)
            intervalRef.current = nextInterval
            timerRef.current = setTimeout(() => {
                poll(execId, startedAt)
            }, nextInterval)
        })
    }, [stop])

    useEffect(() => {
        if (!state || state.status !== 'waiting') {
            stop()
            return
        }

        // 检查是否已超时
        if (isAIEditExpired(state)) {
            onExpiredRef.current()
            return
        }

        // 启动轮询
        isActiveRef.current = true
        intervalRef.current = INITIAL_INTERVAL_MS

        // 立即开始第一次轮询
        timerRef.current = setTimeout(() => {
            poll(state.exec_id, state.started_at)
        }, INITIAL_INTERVAL_MS)

        return () => {
            stop()
        }
    }, [state, poll, stop])

    return { stop }
}
