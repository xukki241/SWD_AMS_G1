"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LESSON_TYPE_LABEL } from "@/components/courses/courseFormat"
import { useI18n, type TranslationKey } from "@/i18n"
import type { CourseStatus, Lesson, LessonRequestPayload, LessonType } from "@/types"

export function LessonDialog({
  open,
  onOpenChange,
  lesson,
  moduleTitle,
  submitting = false,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog edits this lesson instead of creating one. */
  lesson?: Lesson | null
  moduleTitle?: string
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: LessonRequestPayload) => void
}) {
  const isEdit = Boolean(lesson)
  const { t } = useI18n()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<LessonType>("VIDEO")
  const [duration, setDuration] = useState("10")
  const [status, setStatus] = useState<CourseStatus>("DRAFT")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setTitle(lesson?.title ?? "")
    setType(lesson?.type ?? "VIDEO")
    setDuration(lesson?.duration != null ? String(lesson.duration) : "10")
    setStatus(lesson?.status ?? "DRAFT")
    setErrors({})
  }, [open, lesson])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = t("errors.validation.lessonTitleRequired")
    else if (title.trim().length > 255)
      next.title = t("errors.validation.lessonTitleTooLong")

    const minutes = Number(duration)
    if (duration.trim() === "") next.duration = t("errors.validation.durationRequired")
    else if (!Number.isInteger(minutes) || minutes < 0)
      next.duration = t("courses.lessonDialog.durationWhole")
    else if (minutes > 6000) next.duration = t("errors.validation.durationTooLarge")

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      title: title.trim(),
      type,
      duration: minutes,
      status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("courses.lessonDialog.editTitle") : t("courses.lessonDialog.addTitle")}</DialogTitle>
          <DialogDescription>
            {moduleTitle ? (
              <>
                {t("courses.lessonDialog.inModule", { module: moduleTitle })}
              </>
            ) : (
              t("courses.lessonDialog.description")
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">
              {t("courses.lessonDialog.titleLabel")}<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="lesson-title"
              autoFocus
              value={title}
              maxLength={255}
              placeholder={t("courses.lessonDialog.titlePlaceholder")}
              aria-invalid={Boolean(errors.title)}
              className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((prev) => ({ ...prev, title: "" }))
              }}
            />
            {errors.title && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lesson-type">{t("courses.lessonDialog.typeLabel")}</Label>
              <Select value={type} onValueChange={(value) => setType(value as LessonType)}>
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LESSON_TYPE_LABEL) as LessonType[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`courses.lessonTypes.${value}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lesson-duration">
                {t("courses.lessonDialog.durationLabel")}<span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                id="lesson-duration"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={duration}
                aria-invalid={Boolean(errors.duration)}
                className={cn(
                  errors.duration && "border-destructive focus-visible:ring-destructive"
                )}
                onChange={(e) => {
                  setDuration(e.target.value)
                  setErrors((prev) => ({ ...prev, duration: "" }))
                }}
              />
              {errors.duration && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.duration}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-status">{t("courses.lessonDialog.statusLabel")}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as CourseStatus)}>
              <SelectTrigger id="lesson-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">{t("courses.lessonDialog.statusDraft")}</SelectItem>
                <SelectItem value="PUBLISHED">{t("courses.lessonDialog.statusPublished")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? t("courses.lessonDialog.save") : t("courses.lessonDialog.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default LessonDialog
