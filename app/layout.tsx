import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import "./globals.css"
import { APP_URL } from "@/lib/config"
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo"
import { getHtmlLang, isLocale } from "@/lib/i18n/route-locale"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} - AI Content Creation Workspace`,
    template: `%s`,
  },
  description: "AI content creation workspace for writing, visuals, material management, and SEO optimization.",
  generator: "v0.app",
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const requestHeaders = await headers()
  const requestLocale = requestHeaders.get("x-locale")
  const initialLocale = isLocale(requestLocale) ? requestLocale : "zh"
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: APP_URL,
    email: "support@joyword.link",
  }

  return (
    <html lang={getHtmlLang(initialLocale)} className="h-full" suppressHydrationWarning>
      <body className="font-sans antialiased h-full">
        <Script
          id="joyfulwords-organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <I18nProvider initialLocale={initialLocale}>
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
