import type { Metadata } from "next"
import { PrivacyPolicyPageContent } from "@/components/legal/privacy-policy-page-content"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "隐私政策",
  description:
    "查看 JoyfulWords 的隐私政策，了解我们如何收集、使用、保护和管理用户数据，以及相关隐私权利与联系方式。",
  path: "/privacy-policy",
  keywords: ["JoyfulWords隐私政策", "隐私政策", "数据保护", "用户隐私"],
})

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageContent />
}

