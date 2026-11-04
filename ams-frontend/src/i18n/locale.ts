export type Locale = "en" | "vi"

export const LOCALES: readonly Locale[] = ["en", "vi"] as const
export const LOCALE_STORAGE_KEY = "ams_locale"

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  vi: "vi-VN",
}

let activeLocale: Locale = "en"

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale
}

export function getActiveLocale(): Locale {
  return activeLocale
}

export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null
  const lower = value.toLowerCase()
  if (lower.startsWith("vi")) return "vi"
  if (lower.startsWith("en")) return "en"
  return null
}
