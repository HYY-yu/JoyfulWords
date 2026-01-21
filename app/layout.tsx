import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "创作者工具箱 - Content Creator Tools",
  description: "Professional SAAS toolbox for content creators",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

import { I18nProvider } from "@/lib/i18n/i18n-context"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { OpenTelemetryProvider } from "@/components/otel/client-tracing-provider"
import { TallyFeedbackButton } from "@/components/feedback"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}>
        <I18nProvider>
          <AuthProvider>
            {children}
            <Analytics />
            <Toaster />
            <OpenTelemetryProvider />
            <TallyFeedbackButton />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
