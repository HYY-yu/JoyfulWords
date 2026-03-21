import { cookies } from "next/headers"
import { en } from "./locales/en"
import { zh } from "./locales/zh"
import { LOCALE_COOKIE_NAME, type Locale } from "./shared"

const dictionaries = { zh, en }

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return locale === "en" ? "en" : "zh"
}

export function getServerDictionary(locale: Locale) {
  return dictionaries[locale]
}
