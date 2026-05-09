import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { APP_URL } from "@/lib/config"

export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host")?.toLowerCase().split(":")[0] ?? ""

  if (host === "console.joyword.link") {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      host: "https://console.joyword.link",
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/zh", "/zh/", "/en", "/en/", "/blog", "/blog/"],
        disallow: [
          "/auth/",
          "/articles",
          "/taskcenter",
          "/payment/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
