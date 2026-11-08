"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/i18n"
import type { RubricCriterion } from "@/types"
import { Plus, Trash2 } from "lucide-react"

export function RubricCriteriaEditor({
  criteria,
  maxScore,
  onChange,
  disabled = false,
}: {
  criteria: RubricCriterion[]
  maxScore: number
  onChange: (criteria: RubricCriterion[]) => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const total = criteria.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0)

  const update = (index: number, changes: Partial<RubricCriterion>) => {
    onChange(criteria.map((item, i) => i === index ? { ...item, ...changes } : item))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("classroom.rubric.criteriaTitle")}</p>
        <span className={`text-xs ${Math.abs(total - maxScore) <= 0.01 ? "text-emerald-700" : "text-destructive"}`}>
          {t("classroom.rubric.total", { total: total.toFixed(2), max: maxScore })}
        </span>
      </div>
      {criteria.map((criterion, index) => (
        <div key={criterion.id} className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
            <Input
              aria-label={t("classroom.rubric.name")}
              placeholder={t("classroom.rubric.name")}
              value={criterion.name}
              disabled={disabled}
              onChange={(event) => update(index, { name: event.target.value })}
            />
            <Input
              aria-label={t("classroom.rubric.maxScore")}
              type="number"
              min="0.01"
              step="0.01"
              value={criterion.maxScore}
              disabled={disabled}
              onChange={(event) => update(index, { maxScore: Number(event.target.value) })}
            />
            <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={t("classroom.rubric.remove")} onClick={() => onChange(criteria.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            aria-label={t("classroom.rubric.description")}
            placeholder={t("classroom.rubric.description")}
            rows={2}
            value={criterion.description}
            disabled={disabled}
            onChange={(event) => update(index, { description: event.target.value })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...criteria, {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `criterion-${Date.now()}`,
          name: "",
          description: "",
          maxScore: Math.max(0, maxScore - total),
        }])}
      >
        <Plus className="mr-1 h-4 w-4" />{t("classroom.rubric.add")}
      </Button>
    </div>
  )
}
