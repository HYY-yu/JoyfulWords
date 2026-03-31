import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { APP_URL } from "@/lib/config"
import { SITE_NAME } from "@/lib/seo"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} - AI Content Creation Workspace`,
    template: `%s`,
  },
  description: "AI content creation workspace for writing, visuals, material management, and SEO optimization.",
  generator: "v0.app",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
  },
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
import { Toaster } from "@/components/ui/hooks/toaster"
import { OpenTelemetryProvider } from "@/components/otel/client-tracing-provider"
import { InsufficientCreditsRoot } from "@/lib/credits/index"
import { WebSocketProvider } from "@/components/websocket/websocket-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: APP_URL,
    email: "support@joyword.link",
  }

  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}>
        <Script
          id="joyfulwords-organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <I18nProvider>
          <AuthProvider>
            <WebSocketProvider>
              <InsufficientCreditsRoot>
                {children}
                <Toaster />
                <OpenTelemetryProvider />
              </InsufficientCreditsRoot>
            </WebSocketProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
