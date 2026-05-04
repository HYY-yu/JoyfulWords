export const dynamic = "force-static"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">页面不存在</h1>
        <p className="text-sm text-muted-foreground">请检查链接，或返回首页继续浏览。</p>
      </div>
      <a className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/">
        返回首页
      </a>
    </main>
  )
}
