"use client"

/**
 * AI 编辑状态持久化 Hook
 *
 * 将等待中的 AI 编辑任务保存到 localStorage，支持页面刷新后继续轮询。
 * 用 cut_text 而非 from/to 来定位编辑器位置，避免用户编辑其他文本后位置漂移。
 *
 * v2.0: 支持多任务并行存储，key: exec_id
 */

export interface AIEditState {
    status: 'idle' | 'waiting'
    exec_id: string
    article_id: number
    cut_text: string      // 被选中的原始文本，用于实时匹配编辑器位置
    started_at: number    // timestamp(ms)，超过 5 分钟自动释放
    result_text?: string  // 轮询成功后的结果文本（status='idle' 时存在）
}

/**
 * v2.0 多任务存储格式
 */
interface AIEditTasksStorage {
    tasks: Record<string, AIEditState>
    version: '2.0'
    lastUpdated: number
}

/**
 * v1.0 单任务存储格式（用于向后兼容）
 */
interface AIEditStateStorage {
    status: 'idle' | 'waiting'
    exec_id: string
    article_id: number
    cut_text: string
    started_at: number
    result_text?: string
}

const STORAGE_KEY_PREFIX = 'joyfulwords-ai-edit-state'
const MAX_WAIT_MS = 5 * 60 * 1000 // 5 分钟

function getStorageKey(userId: number | string): string {
    return `${STORAGE_KEY_PREFIX}-${userId}`
}

/**
 * 检查任务是否过期
 */
export function isAIEditExpired(state: AIEditState): boolean {
    return Date.now() - state.started_at > MAX_WAIT_MS
}

/**
 * 清理过期任务
 */
function cleanExpiredTasks(tasks: Record<string, AIEditState>): Record<string, AIEditState> {
    const cleaned: Record<string, AIEditState> = {}
    const now = Date.now()

    for (const [execId, task] of Object.entries(tasks)) {
        if (now - task.started_at <= MAX_WAIT_MS) {
            cleaned[execId] = task
        }
    }

    return cleaned
}

/**
 * 从 v1.0 格式迁移到 v2.0 格式
 */
function migrateFromV1(v1Data: AIEditStateStorage): AIEditTasksStorage {
    return {
        tasks: {
            [v1Data.exec_id]: v1Data
        },
        version: '2.0',
        lastUpdated: Date.now()
    }
}

/**
 * 加载所有 AI 编辑任务（v2.0）
 * @returns Map<exec_id, AIEditState>
 */
export function loadAIEditTasks(userId: number | string): Map<string, AIEditState> {
    if (typeof window === 'undefined') return new Map()

    try {
        const raw = localStorage.getItem(getStorageKey(userId))
        if (!raw) return new Map()

        const parsed = JSON.parse(raw)

        // 检测版本并迁移
        if (parsed.version === '2.0') {
            const storage = parsed as AIEditTasksStorage
            // 清理过期任务
            const cleanedTasks = cleanExpiredTasks(storage.tasks)

            // 如果清理后仍有任务，更新存储
            if (Object.keys(cleanedTasks).length > 0) {
                const updatedStorage: AIEditTasksStorage = {
                    tasks: cleanedTasks,
                    version: '2.0',
                    lastUpdated: Date.now()
                }
                localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedStorage))
            } else {
                // 所有任务都过期了，清除存储
                localStorage.removeItem(getStorageKey(userId))
            }

            return new Map(Object.entries(cleanedTasks))
        } else {
            // v1.0 格式，迁移到 v2.0
            const v1Data = parsed as AIEditStateStorage
            if (!isAIEditExpired(v1Data)) {
                const v2Storage = migrateFromV1(v1Data)
                localStorage.setItem(getStorageKey(userId), JSON.stringify(v2Storage))
                return new Map([[v1Data.exec_id, v1Data]])
            } else {
                localStorage.removeItem(getStorageKey(userId))
                return new Map()
            }
        }
    } catch (error) {
        console.error('[AI Edit State] Failed to load tasks:', error)
        return new Map()
    }
}

/**
 * 保存所有任务（v2.0）
 */
export function saveAIEditTasks(userId: number | string, tasks: Map<string, AIEditState>): void {
    if (typeof window === 'undefined') return

    try {
        const storage: AIEditTasksStorage = {
            tasks: Object.fromEntries(tasks.entries()),
            version: '2.0',
            lastUpdated: Date.now()
        }

        localStorage.setItem(getStorageKey(userId), JSON.stringify(storage))
    } catch (error) {
        // localStorage 配额超限，尝试清理旧任务
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('[AI Edit State] Storage quota exceeded, cleaning old tasks...')

            // 按时间排序，删除最旧的一半任务
            const sortedTasks = Array.from(tasks.entries())
                .sort(([, a], [, b]) => a.started_at - b.started_at)

            const halfCount = Math.floor(sortedTasks.length / 2)
            const keptTasks = new Map(sortedTasks.slice(halfCount))

            try {
                const storage: AIEditTasksStorage = {
                    tasks: Object.fromEntries(keptTasks.entries()),
                    version: '2.0',
                    lastUpdated: Date.now()
                }
                localStorage.setItem(getStorageKey(userId), JSON.stringify(storage))
                console.warn('[AI Edit State] Cleaned up old tasks due to storage quota')
            } catch (retryError) {
                console.error('[AI Edit State] Failed to save after cleanup:', retryError)
            }
        } else {
            console.error('[AI Edit State] Failed to save tasks:', error)
        }
    }
}

/**
 * 添加单个任务
 */
export function addAIEditTask(userId: number | string, task: AIEditState): void {
    const tasks = loadAIEditTasks(userId)
    tasks.set(task.exec_id, task)
    saveAIEditTasks(userId, tasks)
}

/**
 * 删除单个任务
 */
export function removeAIEditTask(userId: number | string, execId: string): void {
    const tasks = loadAIEditTasks(userId)
    tasks.delete(execId)

    if (tasks.size > 0) {
        saveAIEditTasks(userId, tasks)
    } else {
        // 没有任务了，直接删除存储
        clearAIEditTasks(userId)
    }
}

/**
 * 清除所有任务
 */
export function clearAIEditTasks(userId: number | string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(getStorageKey(userId))
}

// ========== v1.0 API（已废弃，保留向后兼容） ==========

/**
 * @deprecated 使用 loadAIEditTasks 替代，返回所有任务而非单个任务
 */
export function loadAIEditState(userId: number | string): AIEditState | null {
    const tasks = loadAIEditTasks(userId)
    if (tasks.size === 0) return null

    // 返回第一个任务（按 started_at 排序）
    const sortedTasks = Array.from(tasks.values())
        .sort((a, b) => a.started_at - b.started_at)

    return sortedTasks[0] || null
}

/**
 * @deprecated 使用 addAIEditTask 替代，避免覆盖其他任务
 */
export function saveAIEditState(userId: number | string, state: AIEditState): void {
    addAIEditTask(userId, state)
}

/**
 * @deprecated 使用 clearAIEditTasks 替代
 */
export function clearAIEditState(userId: number | string): void {
    clearAIEditTasks(userId)
}

export const AI_EDIT_MAX_WAIT_MS = MAX_WAIT_MS
