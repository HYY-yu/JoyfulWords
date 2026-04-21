import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { buildLocalizedPath, isLocale } from "@/lib/i18n/route-locale"

async function getRequestLocale() {
  const requestLocale = (await headers()).get("x-locale")
  return isLocale(requestLocale) ? requestLocale : "zh"
}

export default async function PrivacyPolicyRedirectPage() {
  redirect(buildLocalizedPath(await getRequestLocale(), "/privacy-policy"))
}
