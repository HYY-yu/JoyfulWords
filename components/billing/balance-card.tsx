"use client"

import { Wallet, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/card'
import type { BalanceResponse } from '@/lib/api/billing/types'

interface BalanceCardProps {
  balance: BalanceResponse | null
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onRecharge: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function BalanceCard({
  balance,
  loading,
  refreshing,
  onRefresh,
  onRecharge,
  t,
}: BalanceCardProps) {
  // 直接使用后端返回的余额值
  const credits = balance ? balance.balance_cents : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('billing.balance.title')}
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {loading && !balance ? '...' : credits.toLocaleString()} {t('billing.balance.credits')}
            </div>
            {balance && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('billing.balance.updatedAt', {
                  time: new Date(balance.updated_at).toLocaleString(),
                })}
                {balance.is_cached && (
                  <span className="ml-1">({t('billing.balance.cached')})</span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('billing.balance.exchangeRate')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {t('billing.balance.refresh')}
            </Button>
            <Button size="sm" onClick={onRecharge}>
              {t('billing.balance.recharge')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
