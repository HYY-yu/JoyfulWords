"use client"

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">页面暂时不可用</h1>
            <p className="text-sm text-muted-foreground">请稍后重试。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => unstable_retry()}
          >
            重试
          </button>
        </main>
      </body>
    </html>
  )
}
