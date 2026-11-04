"use client"

import React from "react"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "./I18nProvider"
import { LOCALES, type Locale } from "./locale"

const LABELS: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t("common.language.label")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-card p-0.5 shadow-sm",
        className
      )}
    >
      <Globe className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          title={t("common.language.switchTo", {
            language:
              code === "vi" ? t("common.language.vietnamese") : t("common.language.english"),
          })}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
            locale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
