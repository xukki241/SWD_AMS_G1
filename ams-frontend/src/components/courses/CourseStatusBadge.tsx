"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n, type TranslationKey } from "@/i18n"
import type { CourseDifficulty, CourseStatus } from "@/types"

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { t } = useI18n()
  const key: TranslationKey =
    status === "PUBLISHED" ? "common.status.published" : "common.status.draft"
  return (
    <Badge variant={status === "PUBLISHED" ? "success" : "secondary"}>
      {t(key)}
    </Badge>
  )
}

export function DifficultyBadge({ level }: { level: CourseDifficulty }) {
  const { t } = useI18n()
  return (
    <Badge variant="outline" className="font-medium">
      {t(`courses.difficulty.${level}` as TranslationKey)}
    </Badge>
  )
}
