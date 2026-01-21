'use client'

import { useEffect } from 'react'
import { TallyProvider as BaseTallyProvider } from 'react-tally'

export function TallyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 懒加载策略：仅在组件挂载时注入 Tally 脚本
    // react-tally 会处理脚本去重
  }, [])

  return <BaseTallyProvider>{children}</BaseTallyProvider>
}
