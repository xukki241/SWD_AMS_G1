"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { courseAiService } from "@/services/course.service"
import {
  DIFFICULTY_LABEL,
  LESSON_TYPE_LABEL,
  formatDuration,
  isTimeoutError,
} from "@/components/courses/courseFormat"
import { getApiErrorMessage, useI18n, type TranslationKey } from "@/i18n"
import type { CourseDifficulty, LessonType, OutlineResponse } from "@/types"

type DraftLesson = { title: string; type: LessonType; duration: number }
type DraftModule = { title: string; lessons: DraftLesson[] }

type Phase = "form" | "loading" | "error" | "preview"

const DEFAULT_MODULE_COUNT = 4

export function AIOutlineDialog({
  courseId,
  open,
  onOpenChange,
  hasExistingContent = false,
  courseTitle,
  onAccepted,
}: {
  courseId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown as a warning: accepted modules are appended to the existing curriculum. */
  hasExistingContent?: boolean
  courseTitle?: string
  onAccepted: () => void
}) {
  const [phase, setPhase] = useState<Phase>("form")
  const { t } = useI18n()
  const [topic, setTopic] = useState("")
  const [level, setLevel] = useState<CourseDifficulty>("BEGINNER")
  const [moduleCount, setModuleCount] = useState(String(DEFAULT_MODULE_COUNT))
  const [draft, setDraft] = useState<DraftModule[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPhase("form")
    setTopic(courseTitle ?? "")
    setLevel("BEGINNER")
    setModuleCount(String(DEFAULT_MODULE_COUNT))
    setDraft([])
    setErrorMessage(null)
    setFormError(null)
  }, [open, courseTitle])

  const generate = useMutation({
    mutationFn: () =>
      courseAiService.generateOutline(courseId, {
        topic: topic.trim() || undefined,
        level,
        moduleCount: Number(moduleCount),
      }),
    onSuccess: (response: OutlineResponse) => {
      setDraft(normalizeOutline(response))
      setPhase("preview")
      setErrorMessage(null)
    },
    onError: (error: unknown) => {
      setErrorMessage(describeAiError(error, t))
      setPhase("error")
    },
  })

  const accept = useMutation({
    mutationFn: () =>
      courseAiService.acceptOutline(
        courseId,
        draft.map((module) => ({
          title: module.title.trim(),
          lessons: module.lessons.map((lesson) => ({
            title: lesson.title.trim(),
            type: lesson.type,
            duration: lesson.duration,
          })),
        }))
      ),
    onSuccess: () => {
      onAccepted()
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, t("courses.ai.saveError")))
      setPhase("error")
    },
  })

  const startGenerate = () => {
    const count = Number(moduleCount)
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      setFormError(t("courses.ai.chooseModules"))
      return
    }
    setFormError(null)
    setPhase("loading")
    generate.mutate()
  }

  const discard = () => {
    if (accept.isPending) return
    onOpenChange(false)
  }

  const stats = useMemo(() => {
    const lessons = draft.reduce((total, module) => total + module.lessons.length, 0)
    const duration = draft.reduce(
      (total, module) =>
        total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
      0
    )
    return { modules: draft.length, lessons, duration }
  }, [draft])

  const validateDraft = (): string | null => {
    if (draft.length === 0) return t("courses.ai.empty")
    for (const [index, module] of draft.entries()) {
      if (!module.title.trim()) return t("courses.ai.moduleNeedsTitle", { index: index + 1 })
      if (module.lessons.length === 0)
        return t("courses.ai.moduleNeedsLesson", { index: index + 1 })
      for (const lesson of module.lessons) {
        if (!lesson.title.trim())
          return t("courses.ai.lessonNeedsTitle", { module: module.title })
        if (!Number.isFinite(lesson.duration) || lesson.duration < 0)
          return t("courses.ai.lessonNeedsDuration", { module: module.title })
      }
    }
    return null
  }

  const submitAccept = () => {
    const problem = validateDraft()
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError(null)
    accept.mutate()
  }

  const updateModule = (index: number, title: string) => {
    setDraft((prev) => prev.map((module, i) => (i === index ? { ...module, title } : module)))
    setFormError(null)
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, patch: Partial<DraftLesson>) => {
    setDraft((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, ...patch } : lesson
              ),
            }
          : module
      )
    )
    setFormError(null)
  }

  const removeModule = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
    setFormError(null)
  }

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setDraft((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? { ...module, lessons: module.lessons.filter((_, j) => j !== lessonIndex) }
          : module
      )
    )
    setFormError(null)
  }

  const addLesson = (moduleIndex: number) => {
    setDraft((prev) =>
      prev.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              lessons: [...module.lessons, { title: "", type: "READING", duration: 10 }],
            }
          : module
      )
    )
  }

  const busy = generate.isPending || accept.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("courses.ai.title")}
          </DialogTitle>
          <DialogDescription>
            {t("courses.ai.description")}
          </DialogDescription>
        </DialogHeader>

        {phase === "form" && (
          <div className="space-y-4">
            {hasExistingContent && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>{t("courses.ai.existingWarning")}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ai-topic">{t("courses.ai.topicLabel")}</Label>
              <Textarea
                id="ai-topic"
                value={topic}
                rows={4}
                maxLength={2000}
                placeholder={t("courses.ai.topicPlaceholder")}
                onChange={(event) => setTopic(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("courses.ai.topicHint")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ai-level">{t("courses.ai.levelLabel")}</Label>
                <Select
                  value={level}
                  onValueChange={(value) => setLevel(value as CourseDifficulty)}
                >
                  <SelectTrigger id="ai-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DIFFICULTY_LABEL) as CourseDifficulty[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`courses.difficulty.${value}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ai-modules">{t("courses.ai.modulesLabel")}</Label>
                <Input
                  id="ai-modules"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={moduleCount}
                  onChange={(event) => setModuleCount(event.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={discard}>
                {t("common.actions.cancel")}
              </Button>
              <Button onClick={startGenerate}>
                <Wand2 className="mr-1.5 h-4 w-4" />
                {t("courses.ai.generate")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            </span>
            <div>
              <p className="text-sm font-medium">{t("courses.ai.loadingTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("courses.ai.loadingHint")}
              </p>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage ?? t("courses.ai.unexpectedError")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("courses.ai.unchangedHint")}
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={discard}>
                {t("courses.ai.close")}
              </Button>
              <Button
                onClick={() => {
                  setErrorMessage(null)
                  if (draft.length > 0) {
                    setPhase("preview")
                  } else {
                    setPhase("form")
                  }
                }}
                variant="outline"
              >
                {t("courses.ai.back")}
              </Button>
              <Button onClick={startGenerate}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                {t("courses.ai.tryAgain")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {t("courses.ai.statsSummary", {
                  modules: stats.modules,
                  lessons: stats.lessons,
                  duration: formatDuration(stats.duration),
                })}
              </span>
              <span>{t("courses.ai.draftNotSaved")}</span>
            </div>

            {hasExistingContent && (
              <p className="text-xs text-muted-foreground">
                {t("courses.ai.appendHint")}
              </p>
            )}

            <div className="space-y-3">
              {draft.map((module, moduleIndex) => (
                <div key={moduleIndex} className="rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("courses.ai.moduleLabel", { index: moduleIndex + 1 })}
                    </span>
                    <Input
                      value={module.title}
                      aria-label={t("courses.ai.moduleTitleAria", { index: moduleIndex + 1 })}
                      className="h-8 flex-1 border-transparent bg-transparent text-sm font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
                      onChange={(event) => updateModule(moduleIndex, event.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t("courses.ai.removeModuleAria", { index: moduleIndex + 1 })}
                      onClick={() => removeModule(moduleIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 p-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="flex items-center gap-2">
                        <Input
                          value={lesson.title}
                          aria-label={t("courses.ai.lessonTitleAria", {
                            lesson: lessonIndex + 1,
                            module: moduleIndex + 1,
                          })}
                          className={cn("h-8 flex-1 text-sm")}
                          onChange={(event) =>
                            updateLesson(moduleIndex, lessonIndex, { title: event.target.value })
                          }
                        />
                        <Select
                          value={lesson.type}
                          onValueChange={(value) =>
                            updateLesson(moduleIndex, lessonIndex, {
                              type: value as LessonType,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[118px] text-xs">
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
                        <div className="relative w-20 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            value={lesson.duration}
                            aria-label={t("courses.ai.durationAria")}
                            className="h-8 pr-6 text-right text-xs"
                            onChange={(event) =>
                              updateLesson(moduleIndex, lessonIndex, {
                                duration: Number(event.target.value),
                              })
                            }
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            {t("courses.ai.minutes")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={t("courses.ai.removeLessonAria")}
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(moduleIndex)}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("courses.ai.addLesson")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {formError && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {formError}
              </p>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={discard} disabled={accept.isPending}>
                  {t("courses.ai.discard")}
                </Button>
                <Button
                  variant="outline"
                  onClick={startGenerate}
                  disabled={accept.isPending}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  {t("courses.ai.regenerate")}
                </Button>
              </div>
              <Button onClick={submitAccept} disabled={accept.isPending}>
                {accept.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                {t("courses.ai.accept")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function normalizeOutline(response: OutlineResponse): DraftModule[] {
  return (response.modules ?? []).map((module) => ({
    title: module.title ?? "",
    lessons: (module.lessons ?? []).map((lesson) => ({
      title: lesson.title ?? "",
      type: lesson.type ?? "READING",
      duration: typeof lesson.duration === "number" ? lesson.duration : 10,
    })),
  }))
}

function describeAiError(
  error: unknown,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
): string {
  const err = error as {
    code?: string
    response?: { status?: number; data?: { message?: string } }
  }

  if (isTimeoutError(error)) {
    return t("courses.ai.timeout")
  }

  const status = err?.response?.status
  if (status === 502) {
    return err.response?.data?.message || t("courses.ai.badAnswer")
  }
  if (status === 429) {
    return t("courses.ai.quota")
  }
  if (status === 401) {
    return t("errors.unauthorized")
  }
  if (status === 403) {
    return t("courses.ai.forbidden")
  }

  return getApiErrorMessage(error, t("courses.ai.generateError"))
}

export default AIOutlineDialog
