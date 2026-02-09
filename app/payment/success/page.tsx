import { Suspense } from 'react'
import { Loader2Icon } from 'lucide-react'
import { PaymentSuccessContent } from './payment-success-content'

// 强制动态渲染,因为需要读取 URL 参数中的订单号
export const dynamic = 'force-dynamic'

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <Loader2Icon className="w-16 h-16 animate-spin text-primary mx-auto" />
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
