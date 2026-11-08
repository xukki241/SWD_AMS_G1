"use client"

import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n"

/** Keep only a non-negative decimal score that never exceeds `max`. */
export function sanitizeScoreInput(raw: string, max: number): string {
  let next = raw.replace(/[^\d.]/g, "")
  const firstDot = next.indexOf(".")
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) +
      next.slice(firstDot + 1).replace(/\./g, "")
  }
  if (next === "" || next === ".") return next
  const numeric = Number(next)
  if (Number.isNaN(numeric)) return ""
  if (numeric > max) return String(max)
  return next
}

export function ScoreInput({
  value,
  onValueChange,
  max,
  placeholder,
}: {
  value: string
  onValueChange: (v: string) => void
  max: number
  step?: number
  placeholder?: string
}) {
  const { t } = useI18n()
  const valid =
    value !== "" &&
    value !== "." &&
    !Number.isNaN(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= max

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(sanitizeScoreInput(e.target.value, max))}
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData("text")
            onValueChange(sanitizeScoreInput(text, max))
          }}
          className="pr-16"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          / {max}
        </span>
      </div>
      {value !== "" && !valid && (
        <p className="text-xs text-destructive">
          {t("classroom.score.invalidRange", { max })}
        </p>
      )}
    </div>
  )
}

export default ScoreInput
