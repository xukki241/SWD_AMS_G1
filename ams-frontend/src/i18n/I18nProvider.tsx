"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  setActiveLocale,
  type Locale,
} from "./locale"
import { formatDate, formatDateTime, translate, type TranslationKey } from "./runtime"

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  formatDate: typeof formatDate
  formatDateTime: typeof formatDateTime
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  const applyLocale = useCallback((next: Locale) => {
    setActiveLocale(next)
    setLocaleState(next)
    if (typeof document !== "undefined") {
      document.documentElement.lang = next
    }
  }, [])

  useEffect(() => {
    let initial: Locale = "en"
    try {
      const stored = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
      const browser = normalizeLocale(
        typeof navigator !== "undefined" ? navigator.language : null
      )
      initial = stored ?? browser ?? "en"
    } catch {
      initial = "en"
    }
    applyLocale(initial)
  }, [applyLocale])

  const setLocale = useCallback(
    (next: Locale) => {
      applyLocale(next)
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next)
      } catch {
        // Storage can be unavailable (private mode); the switch still works.
      }
    },
    [applyLocale]
  )

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: translate,
      formatDate,
      formatDateTime,
    }),
    [locale, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>")
  }
  return context
}
