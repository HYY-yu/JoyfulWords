'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { InsufficientCreditsData } from '@/components/credits/insufficient-credits-dialog'

interface InsufficientCreditsContextValue {
  showInsufficientCredits: (data: InsufficientCreditsData) => void
  hideInsufficientCredits: () => void
  isOpen: boolean
  data: InsufficientCreditsData | null
}

const InsufficientCreditsContext = createContext<InsufficientCreditsContextValue | undefined>(
  undefined
)

interface InsufficientCreditsProviderProps {
  children: ReactNode
}

/**
 * 积分不足弹窗 Provider
 *
 * 提供全局的积分不足弹窗管理功能
 *
 * @example
 * ```tsx
 * // 在根布局中
 * <InsufficientCreditsProvider>
 *   {children}
 * </InsufficientCreditsProvider>
 *
 * // 在组件中使用
 * const { showInsufficientCredits } = useInsufficientCredits()
 *
 * showInsufficientCredits({
 *   current_credits: 25,
 *   required_credits: 40,
 *   shortage_credits: 15,
 *   recommended_recharge: 500,
 *   recommended_recharge_usd: '5.00',
 * })
 * ```
 */
export function InsufficientCreditsProvider({
  children,
}: InsufficientCreditsProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<InsufficientCreditsData | null>(null)

  const showInsufficientCredits = useCallback((creditsData: InsufficientCreditsData) => {
    setData(creditsData)
    setIsOpen(true)
  }, [])

  const hideInsufficientCredits = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  return (
    <InsufficientCreditsContext.Provider
      value={{
        showInsufficientCredits,
        hideInsufficientCredits,
        isOpen,
        data,
      }}
    >
      {children}
    </InsufficientCreditsContext.Provider>
  )
}

/**
 * 使用积分不足弹窗 Hook
 *
 * @throws 如果在 InsufficientCreditsProvider 外部使用会抛出错误
 *
 * @example
 * ```tsx
 * const { showInsufficientCredits, hideInsufficientCredits, isOpen, data } = useInsufficientCredits()
 * ```
 */
export function useInsufficientCredits() {
  const context = useContext(InsufficientCreditsContext)

  if (context === undefined) {
    throw new Error(
      'useInsufficientCredits must be used within an InsufficientCreditsProvider'
    )
  }

  return context
}
