import type { Metadata } from "next"
import { CookiePolicyPageContent } from "@/components/legal/cookie-policy-page-content"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Cookie 政策",
  description:
    "查看 JoyfulWords 的 Cookie 政策，了解站点使用的必要性 Cookie、分析类 Cookie 以及用户的管理方式。",
  path: "/cookie-policy",
  keywords: ["JoyfulWords Cookie政策", "Cookie政策", "网站Cookie", "隐私设置"],
})

export default function CookiePolicyPage() {
  return <CookiePolicyPageContent />
}

