"use client"

/**
 * AI 编辑状态持久化 Hook
 *
 * 将等待中的 AI 编辑任务保存到 localStorage，支持页面刷新后继续轮询。
 * 用 cut_text 而非 from/to 来定位编辑器位置，避免用户编辑其他文本后位置漂移。
 */

export interface AIEditState {
    status: 'idle' | 'waiting'
    exec_id: string
    article_id: number
    cut_text: string      // 被选中的原始文本，用于实时匹配编辑器位置
    started_at: number    // timestamp(ms)，超过 5 分钟自动释放
}

const STORAGE_KEY_PREFIX = 'joyfulwords-ai-edit-state'
const MAX_WAIT_MS = 5 * 60 * 1000 // 5 分钟

function getStorageKey(userId: number | string): string {
    return `${STORAGE_KEY_PREFIX}-${userId}`
}

export function loadAIEditState(userId: number | string): AIEditState | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(getStorageKey(userId))
        if (!raw) return null
        const state: AIEditState = JSON.parse(raw)
        // 超时检查
        if (Date.now() - state.started_at > MAX_WAIT_MS) {
            localStorage.removeItem(getStorageKey(userId))
            return null
        }
        return state
    } catch {
        return null
    }
}

export function saveAIEditState(userId: number | string, state: AIEditState): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
}

export function clearAIEditState(userId: number | string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(getStorageKey(userId))
}

export function isAIEditExpired(state: AIEditState): boolean {
    return Date.now() - state.started_at > MAX_WAIT_MS
}

export const AI_EDIT_MAX_WAIT_MS = MAX_WAIT_MS
