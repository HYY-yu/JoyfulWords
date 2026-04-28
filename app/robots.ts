import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/zh", "/zh/", "/en", "/en/"],
        disallow: [
          "/auth/",
          "/articles",
          "/taskcenter",
          "/payment/",
          "/blog",
          "/privacy-policy",
          "/cookie-policy",
          "/terms-of-use",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
