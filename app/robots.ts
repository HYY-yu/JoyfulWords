import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/zh",
          "/zh/",
          "/en",
          "/en/",
          "/blog",
          "/blog/",
          "/privacy-policy",
          "/cookie-policy",
          "/terms-of-use",
        ],
        disallow: ["/auth/", "/articles", "/taskcenter", "/payment/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
