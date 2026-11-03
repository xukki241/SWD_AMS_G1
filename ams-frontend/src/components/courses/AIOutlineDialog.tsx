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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/lib/use-toast"
import { courseAiService } from "@/services/course.service"
import {
  DIFFICULTY_LABEL,
  LESSON_TYPE_LABEL,
  formatDuration,
  getApiErrorMessage,
  isTimeoutError,
} from "@/components/courses/courseFormat"
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
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>("form")
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
      setErrorMessage(describeAiError(error))
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
      toast({
        title: "Outline saved",
        description: "The new modules were appended to your curriculum.",
        variant: "success",
      })
      onAccepted()
    },
    onError: (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, "Could not save the outline. Please try again."))
      setPhase("error")
    },
  })

  const startGenerate = () => {
    const count = Number(moduleCount)
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      setFormError("Choose between 1 and 10 modules.")
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
    if (draft.length === 0) return "The outline is empty. Regenerate it to continue."
    for (const [index, module] of draft.entries()) {
      if (!module.title.trim()) return `Module ${index + 1} needs a title.`
      if (module.lessons.length === 0) return `Module ${index + 1} needs at least one lesson.`
      for (const lesson of module.lessons) {
        if (!lesson.title.trim()) return `Every lesson in "${module.title}" needs a title.`
        if (!Number.isFinite(lesson.duration) || lesson.duration < 0)
          return `Every lesson in "${module.title}" needs a valid duration.`
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
            Generate outline with AI
          </DialogTitle>
          <DialogDescription>
            Gemini drafts modules and lessons for this course. Nothing is saved until you
            accept the draft.
          </DialogDescription>
        </DialogHeader>

        {phase === "form" && (
          <div className="space-y-4">
            {hasExistingContent && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  This course already has modules. Accepted modules will be{" "}
                  <span className="font-medium">appended</span> after the existing curriculum —
                  nothing is replaced.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ai-topic">Course topic</Label>
              <Input
                id="ai-topic"
                value={topic}
                maxLength={255}
                placeholder="e.g. Data structures for beginners"
                onChange={(event) => setTopic(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the course title.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ai-level">Level</Label>
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
                        {DIFFICULTY_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ai-modules">Modules</Label>
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
                Cancel
              </Button>
              <Button onClick={startGenerate}>
                <Wand2 className="mr-1.5 h-4 w-4" />
                Generate draft
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
              <p className="text-sm font-medium">Drafting your curriculum…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gemini usually answers in 5–15 seconds. We stop waiting after 30 seconds so
                you can retry.
              </p>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage ?? "Something went wrong. Please try again."}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your existing curriculum is unchanged — drafts are only stored after you accept
              them.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={discard}>
                Close
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
                Back
              </Button>
              <Button onClick={startGenerate}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Try again
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{stats.modules}</span> modules ·{" "}
                <span className="font-semibold text-foreground">{stats.lessons}</span> lessons ·{" "}
                <span className="font-semibold text-foreground">
                  {formatDuration(stats.duration)}
                </span>
              </span>
              <span>Draft — not saved yet</span>
            </div>

            {hasExistingContent && (
              <p className="text-xs text-muted-foreground">
                Accepting appends these modules after your existing curriculum.
              </p>
            )}

            <div className="space-y-3">
              {draft.map((module, moduleIndex) => (
                <div key={moduleIndex} className="rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Module {moduleIndex + 1}
                    </span>
                    <Input
                      value={module.title}
                      aria-label={`Module ${moduleIndex + 1} title`}
                      className="h-8 flex-1 border-transparent bg-transparent text-sm font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
                      onChange={(event) => updateModule(moduleIndex, event.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove module ${moduleIndex + 1}`}
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
                          aria-label={`Lesson ${lessonIndex + 1} title in module ${moduleIndex + 1}`}
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
                                {LESSON_TYPE_LABEL[value]}
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
                            aria-label="Duration in minutes"
                            className="h-8 pr-6 text-right text-xs"
                            onChange={(event) =>
                              updateLesson(moduleIndex, lessonIndex, {
                                duration: Number(event.target.value),
                              })
                            }
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            min
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove lesson"
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
                      Add lesson
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
                  Discard
                </Button>
                <Button
                  variant="outline"
                  onClick={startGenerate}
                  disabled={accept.isPending}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
              <Button onClick={submitAccept} disabled={accept.isPending}>
                {accept.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                Accept & save
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

function describeAiError(error: unknown): string {
  const err = error as {
    code?: string
    response?: { status?: number; data?: { message?: string } }
  }

  if (isTimeoutError(error)) {
    return "Gemini took longer than 30 seconds to answer. Your curriculum was not changed — try again."
  }

  const status = err?.response?.status
  if (status === 502) {
    return (
      err.response?.data?.message ||
      "The AI service returned an unusable answer. Try again in a moment."
    )
  }
  if (status === 429) {
    return "The AI quota for this key is exhausted. Wait a few minutes, then try again."
  }
  if (status === 401) {
    return "Your session expired. Sign in again and retry."
  }
  if (status === 403) {
    return "Only the course owner or an administrator can generate an outline for this course."
  }

  return getApiErrorMessage(error, "Could not generate an outline. Please try again.")
}

export default AIOutlineDialog
