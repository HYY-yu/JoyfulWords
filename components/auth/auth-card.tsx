import { ReactNode } from "react"

interface AuthCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
