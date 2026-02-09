/**
 * 积分不足弹窗处理器
 *
 * 此文件用于在 API 客户端中触发积分不足弹窗
 * 避免直接导入 React Context 导致的服务端渲染问题
 */

import type { InsufficientCreditsData } from '@/components/credits/insufficient-credits-dialog'

/**
 * 全局回调函数，用于在 React 组件中注册
 */
let showDialogCallback: ((data: InsufficientCreditsData) => void) | null = null

/**
 * 注册弹窗回调函数
 *
 * @example
 * ```tsx
 * // 在根组件中注册
 * registerInsufficientCreditsCallback((data) => {
 *   showInsufficientCredits(data)
 * })
 * ```
 */
export function registerInsufficientCreditsCallback(
  callback: (data: InsufficientCreditsData) => void
) {
  showDialogCallback = callback
}

/**
 * 取消注册弹窗回调函数
 */
export function unregisterInsufficientCreditsCallback() {
  showDialogCallback = null
}

/**
 * 显示积分不足弹窗
 *
 * 此函数由 API 客户端在检测到 402 响应时调用
 *
 * @param data - 积分不足数据
 */
export function showInsufficientCreditsDialog(data: InsufficientCreditsData) {
  if (showDialogCallback) {
    showDialogCallback(data)
  } else {
    console.warn('[InsufficientCredits] Dialog callback not registered', data)
  }
}
