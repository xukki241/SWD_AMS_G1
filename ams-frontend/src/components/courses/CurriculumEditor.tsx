"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GripVertical,
  Layers,
  Pencil,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { courseContentService } from "@/services/course.service"
import { ModuleDialog } from "@/components/courses/ModuleDialog"
import { LessonDialog } from "@/components/courses/LessonDialog"
import { ConfirmDialog } from "@/components/courses/ConfirmDialog"
import { AIOutlineDialog } from "@/components/courses/AIOutlineDialog"
import {
  LESSON_TYPE_LABEL,
  formatDuration,
  getApiErrorMessage,
} from "@/components/courses/courseFormat"
import type {
  CourseContent,
  CourseModule,
  Lesson,
  LessonRequestPayload,
  LessonType,
} from "@/types"

type DragItem =
  | { type: "module"; id: number }
  | { type: "lesson"; id: number; moduleId: number }

const LESSON_ICON: Record<LessonType, React.ComponentType<{ className?: string }>> = {
  VIDEO: PlayCircle,
  READING: FileText,
  ASSIGNMENT: ClipboardList,
}

export function CurriculumEditor({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient()

  const contentQuery = useQuery({
    queryKey: ["course-content", courseId],
    queryFn: () => courseContentService.get(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  })

  const [modules, setModules] = useState<CourseModule[]>([])
  const [dragging, setDragging] = useState<DragItem | null>(null)
  const [moduleOverId, setModuleOverId] = useState<number | null>(null)
  const [lessonDrop, setLessonDrop] = useState<{ moduleId: number; index: number } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [moduleDialog, setModuleDialog] = useState<{
    open: boolean
    module: CourseModule | null
  }>({ open: false, module: null })
  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean
    moduleId: number | null
    lesson: Lesson | null
  }>({ open: false, moduleId: null, lesson: null })
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "module"; module: CourseModule } | { kind: "lesson"; lesson: Lesson } | null
  >(null)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    if (contentQuery.data) setModules(contentQuery.data.modules)
  }, [contentQuery.data])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["course-content", courseId] })
    queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    queryClient.invalidateQueries({ queryKey: ["courses"] })
  }

  /** Recomputes orderIndex locally so the UI stays contiguous while saving. */
  const withOrder = (list: CourseModule[]): CourseModule[] =>
    list.map((module, moduleIndex) => ({
      ...module,
      orderIndex: moduleIndex,
      lessons: module.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        orderIndex: lessonIndex,
      })),
    }))

  const reorderMutation = useMutation({
    mutationFn: (next: CourseModule[]) =>
      courseContentService.reorder(
        courseId,
        next.map((module) => ({
          id: module.id,
          lessonIds: module.lessons.map((lesson) => lesson.id),
        }))
      ),
    onSuccess: (content) => {
      setModules(content.modules)
      queryClient.setQueryData<CourseContent>(["course-content", courseId], content)
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
    },
    onError: (error: unknown) => {
      // Re-sync from the server so a failed drag never leaves a wrong order on screen.
      queryClient.invalidateQueries({ queryKey: ["course-content", courseId] })
      setSuccessMessage(null)
      setActionError(
        getApiErrorMessage(error, "Could not save the new order. The previous order was restored.")
      )
    },
  })

  const applyOrder = (next: CourseModule[]) => {
    if (next.length === 0) return
    const ordered = withOrder(next)
    setModules(ordered)
    setActionError(null)
    setSuccessMessage(null)
    reorderMutation.mutate(ordered)
  }

  const addModule = useMutation({
    mutationFn: (title: string) => courseContentService.addModule(courseId, title),
    onSuccess: () => {
      setModuleDialog({ open: false, module: null })
      setActionError(null)
      setSuccessMessage("Module added.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not add the module. Please try again."))
    },
  })

  const renameModule = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      courseContentService.updateModule(id, title),
    onSuccess: () => {
      setModuleDialog({ open: false, module: null })
      setActionError(null)
      setSuccessMessage("Module updated.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not rename the module."))
    },
  })

  const deleteModule = useMutation({
    mutationFn: (id: number) => courseContentService.deleteModule(id),
    onSuccess: () => {
      setDeleteTarget(null)
      setActionError(null)
      setSuccessMessage("Module deleted.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setDeleteTarget(null)
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not delete the module."))
    },
  })

  const addLesson = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: number; data: LessonRequestPayload }) =>
      courseContentService.addLesson(moduleId, data),
    onSuccess: () => {
      setLessonDialog({ open: false, moduleId: null, lesson: null })
      setActionError(null)
      setSuccessMessage("Lesson added.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not add the lesson."))
    },
  })

  const updateLesson = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LessonRequestPayload }) =>
      courseContentService.updateLesson(id, data),
    onSuccess: () => {
      setLessonDialog({ open: false, moduleId: null, lesson: null })
      setActionError(null)
      setSuccessMessage("Lesson updated.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not update the lesson."))
    },
  })

  const deleteLesson = useMutation({
    mutationFn: (id: number) => courseContentService.deleteLesson(id),
    onSuccess: () => {
      setDeleteTarget(null)
      setActionError(null)
      setSuccessMessage("Lesson deleted.")
      invalidateAll()
    },
    onError: (error: unknown) => {
      setDeleteTarget(null)
      setSuccessMessage(null)
      setActionError(getApiErrorMessage(error, "Could not delete the lesson."))
    },
  })

  const stats = useMemo(() => {
    const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0)
    const duration = modules.reduce(
      (total, module) =>
        total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
      0
    )
    return { moduleCount: modules.length, lessonCount, duration }
  }, [modules])

  const findLessonLocation = (item: Extract<DragItem, { type: "lesson" }>) => {
    const moduleIndex = modules.findIndex((module) => module.id === item.moduleId)
    if (moduleIndex < 0) return null
    const lessonIndex = modules[moduleIndex].lessons.findIndex((lesson) => lesson.id === item.id)
    if (lessonIndex < 0) return null
    return { moduleIndex, lessonIndex }
  }

  const moveModule = (targetId: number) => {
    if (!dragging || dragging.type !== "module" || dragging.id === targetId) return
    const from = modules.findIndex((module) => module.id === dragging.id)
    const to = modules.findIndex((module) => module.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...modules]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    applyOrder(next)
  }

  const moveLesson = (targetModuleId: number, rawIndex: number) => {
    if (!dragging || dragging.type !== "lesson") return
    const source = findLessonLocation(dragging)
    if (!source) return

    const next = modules.map((module) => ({ ...module, lessons: [...module.lessons] }))
    const [moved] = next[source.moduleIndex].lessons.splice(source.lessonIndex, 1)
    const targetModuleIndex = next.findIndex((module) => module.id === targetModuleId)
    if (targetModuleIndex < 0 || !moved) return

    let targetIndex = rawIndex
    if (targetModuleIndex === source.moduleIndex && source.lessonIndex < rawIndex) {
      targetIndex -= 1
    }
    const clamped = Math.max(0, Math.min(targetIndex, next[targetModuleIndex].lessons.length))
    if (targetModuleIndex === source.moduleIndex && clamped === source.lessonIndex) return

    next[targetModuleIndex].lessons.splice(clamped, 0, {
      ...moved,
      moduleId: targetModuleId,
    })
    applyOrder(next)
  }

  const clearDrag = () => {
    setDragging(null)
    setModuleOverId(null)
    setLessonDrop(null)
  }

  const openAddModule = () => setModuleDialog({ open: true, module: null })
  const openRenameModule = (module: CourseModule) => setModuleDialog({ open: true, module })
  const openAddLesson = (moduleId: number) =>
    setLessonDialog({ open: true, moduleId, lesson: null })
  const openEditLesson = (moduleId: number, lesson: Lesson) =>
    setLessonDialog({ open: true, moduleId, lesson })

  if (contentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (contentQuery.isError || !contentQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium">
          {getApiErrorMessage(contentQuery.error, "Could not load the curriculum.")}
        </p>
        <Button size="sm" variant="outline" onClick={() => contentQuery.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const activeModule = modules.find((module) => module.id === lessonDialog.moduleId)

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{stats.moduleCount}</span>
            <span className="text-muted-foreground">
              module{stats.moduleCount === 1 ? "" : "s"}
            </span>
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.lessonCount}</span> lessons
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatDuration(stats.duration)}
            </span>{" "}
            total
          </span>
          {reorderMutation.isPending && (
            <span className="text-xs text-muted-foreground">Saving order…</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            Generate Outline with AI
          </Button>
          <Button onClick={openAddModule}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 px-4 py-3 text-sm text-[hsl(var(--success))]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded-full p-0.5 hover:bg-[hsl(var(--success))]/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {modules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">This course has no curriculum yet</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Add modules and lessons manually, or let Gemini draft an outline you can
            review and edit before saving.
          </p>
          <div className="mt-1 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Generate Outline with AI
            </Button>
            <Button size="sm" onClick={openAddModule}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div
              key={module.id}
              onDragOver={(event) => {
                if (dragging?.type !== "module") return
                event.preventDefault()
                if (moduleOverId !== module.id) setModuleOverId(module.id)
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return
                setModuleOverId((prev) => (prev === module.id ? null : prev))
              }}
              onDrop={(event) => {
                if (dragging?.type !== "module") return
                event.preventDefault()
                moveModule(module.id)
                clearDrag()
              }}
              className={cn(
                "overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow",
                moduleOverId === module.id &&
                  dragging?.type === "module" &&
                  dragging.id !== module.id &&
                  "ring-2 ring-primary/50"
              )}
            >
              <div className="flex items-start gap-3 border-b bg-muted/30 px-3 py-3">
                <span
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move"
                    event.dataTransfer.setData("text/plain", String(module.id))
                    setDragging({ type: "module", id: module.id })
                  }}
                  onDragEnd={clearDrag}
                  aria-label={`Drag module ${module.title} to reorder`}
                  title="Drag to reorder"
                  className="mt-0.5 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Module {moduleIndex + 1}
                  </p>
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {module.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"} ·{" "}
                    {formatDuration(
                      module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0)
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddLesson(module.id)}
                    className="hidden sm:inline-flex"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Lesson
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${module.title}`}
                    onClick={() => openRenameModule(module)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${module.title}`}
                    onClick={() => setDeleteTarget({ kind: "module", module })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div
                className="space-y-1 p-2"
                onDragOver={(event) => {
                  if (dragging?.type !== "lesson") return
                  event.preventDefault()
                  if (lessonDrop?.moduleId !== module.id) {
                    setLessonDrop({ moduleId: module.id, index: module.lessons.length })
                  }
                }}
                onDrop={(event) => {
                  if (dragging?.type !== "lesson") return
                  event.preventDefault()
                  const target = lessonDrop
                  if (target && target.moduleId === module.id) {
                    moveLesson(module.id, target.index)
                  }
                  clearDrag()
                }}
              >
                {module.lessons.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openAddLesson(module.id)}
                    className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    No lessons yet — add the first one
                  </button>
                ) : (
                  module.lessons.map((lesson, lessonIndex) => {
                    const Icon = LESSON_ICON[lesson.type] ?? FileText
                    const showDropLine =
                      dragging?.type === "lesson" &&
                      lessonDrop?.moduleId === module.id &&
                      lessonDrop.index === lessonIndex
                    return (
                      <React.Fragment key={lesson.id}>
                        {showDropLine && <DropLine />}
                        <div
                          onDragOver={(event) => {
                            if (dragging?.type !== "lesson") return
                            event.preventDefault()
                            event.stopPropagation()
                            const rect = event.currentTarget.getBoundingClientRect()
                            const after = event.clientY > rect.top + rect.height / 2
                            setLessonDrop({
                              moduleId: module.id,
                              index: lessonIndex + (after ? 1 : 0),
                            })
                          }}
                          className="group flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move"
                              event.dataTransfer.setData("text/plain", String(lesson.id))
                              setDragging({
                                type: "lesson",
                                id: lesson.id,
                                moduleId: module.id,
                              })
                            }}
                            onDragEnd={clearDrag}
                            aria-label={`Drag lesson ${lesson.title} to reorder`}
                            title="Drag to reorder"
                            className="cursor-grab rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </span>

                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Icon className="h-3.5 w-3.5" />
                          </span>

                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {lesson.title}
                          </span>

                          <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                            {LESSON_TYPE_LABEL[lesson.type] ?? lesson.type}
                          </Badge>
                          <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground md:inline">
                            {formatDuration(lesson.duration)}
                          </span>
                          <Badge
                            variant={lesson.status === "PUBLISHED" ? "success" : "secondary"}
                            className="hidden shrink-0 sm:inline-flex"
                          >
                            {lesson.status === "PUBLISHED" ? "Published" : "Draft"}
                          </Badge>

                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Edit ${lesson.title}`}
                              onClick={() => openEditLesson(module.id, lesson)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label={`Delete ${lesson.title}`}
                              onClick={() => setDeleteTarget({ kind: "lesson", lesson })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                )}

                {dragging?.type === "lesson" &&
                  lessonDrop?.moduleId === module.id &&
                  lessonDrop.index >= module.lessons.length && <DropLine />}

                {module.lessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openAddLesson(module.id)}
                    className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lesson
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModuleDialog
        open={moduleDialog.open}
        onOpenChange={(open) => setModuleDialog({ open, module: open ? moduleDialog.module : null })}
        module={moduleDialog.module}
        submitting={addModule.isPending || renameModule.isPending}
        error={actionError}
        onSubmit={(title) => {
          setActionError(null)
          if (moduleDialog.module) {
            renameModule.mutate({ id: moduleDialog.module.id, title })
          } else {
            addModule.mutate(title)
          }
        }}
      />

      <LessonDialog
        open={lessonDialog.open}
        onOpenChange={(open) =>
          setLessonDialog({
            open,
            moduleId: open ? lessonDialog.moduleId : null,
            lesson: open ? lessonDialog.lesson : null,
          })
        }
        lesson={lessonDialog.lesson}
        moduleTitle={activeModule?.title}
        submitting={addLesson.isPending || updateLesson.isPending}
        error={actionError}
        onSubmit={(payload) => {
          setActionError(null)
          if (lessonDialog.lesson) {
            updateLesson.mutate({ id: lessonDialog.lesson.id, data: payload })
          } else if (lessonDialog.moduleId != null) {
            addLesson.mutate({ moduleId: lessonDialog.moduleId, data: payload })
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget?.kind === "module" ? "Delete this module?" : "Delete this lesson?"}
        description={
          deleteTarget?.kind === "module" ? (
            <>
              <span className="font-medium text-foreground">{deleteTarget.module.title}</span> and
              its {deleteTarget.module.lessons.length} lesson
              {deleteTarget.module.lessons.length === 1 ? "" : "s"} will be removed. This cannot
              be undone.
            </>
          ) : deleteTarget?.kind === "lesson" ? (
            <>
              <span className="font-medium text-foreground">{deleteTarget.lesson.title}</span> will
              be removed from the curriculum. This cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel={deleteTarget?.kind === "module" ? "Delete module" : "Delete lesson"}
        loading={deleteModule.isPending || deleteLesson.isPending}
        onConfirm={() => {
          if (deleteTarget?.kind === "module") deleteModule.mutate(deleteTarget.module.id)
          else if (deleteTarget?.kind === "lesson") deleteLesson.mutate(deleteTarget.lesson.id)
        }}
      />

      <AIOutlineDialog
        courseId={courseId}
        open={aiOpen}
        onOpenChange={setAiOpen}
        courseTitle={contentQuery.data?.courseTitle}
        hasExistingContent={modules.length > 0}
        onAccepted={() => {
          setAiOpen(false)
          invalidateAll()
          setSuccessMessage("AI outline added to the end of the curriculum.")
        }}
      />
    </div>
  )
}

function DropLine() {
  return <div className="mx-2 h-0.5 rounded-full bg-primary" aria-hidden />
}

export default CurriculumEditor
