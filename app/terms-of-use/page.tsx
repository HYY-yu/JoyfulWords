import type { Metadata } from "next"
import { TermsOfUsePageContent } from "@/components/legal/terms-of-use-page-content"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "使用条款",
  description:
    "查看 JoyfulWords 的使用条款，了解服务范围、用户责任、知识产权、责任限制与其他适用规则。",
  path: "/terms-of-use",
  keywords: ["JoyfulWords使用条款", "服务条款", "Terms of Use", "使用协议"],
})

export default function TermsOfUsePage() {
  return <TermsOfUsePageContent />
}

