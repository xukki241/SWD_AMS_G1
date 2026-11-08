import en, { type Dictionary, type TranslationKey } from "./messages/en"
import vi from "./messages/vi"
import { getActiveLocale, INTL_LOCALE } from "./locale"

export type { TranslationKey }

function lookup(dictionary: Dictionary, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((current, part) => {
      if (current && typeof current === "object" && part in current) {
        return (current as Record<string, unknown>)[part]
      }
      return undefined
    }, dictionary)
}

/**
 * Translate a dot-path key. Safe outside React (format helpers, error mappers)
 * because the active locale lives in a module-level store.
 */
export function translate(
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const dictionary = getActiveLocale() === "vi" ? vi : en
  const value = lookup(dictionary, key) ?? lookup(en, key)
  if (typeof value !== "string") return key
  if (!vars) return value
  return Object.entries(vars).reduce(
    (text, [name, replacement]) => text.split(`{${name}}`).join(String(replacement)),
    value
  )
}

export function formatDate(
  value?: string | number | Date | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(INTL_LOCALE[getActiveLocale()], options).format(date)
}

export function formatDateTime(
  value?: string | number | Date | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return formatDate(value, options)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[getActiveLocale()], options).format(value)
}
