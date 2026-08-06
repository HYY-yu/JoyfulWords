import { Suspense } from 'react'
import { Loader2Icon } from 'lucide-react'
import { PaymentCreateFailedContent } from './payment-create-failed-content'

export const dynamic = 'force-dynamic'

export default function PaymentCreateFailedPage() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
        </div>
      )}
    >
      <PaymentCreateFailedContent />
    </Suspense>
  )
}
