"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2, Save } from "lucide-react"
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
import { courseService } from "@/services/course.service"
import { categoryService } from "@/services/category.service"
import type {
  CourseDetail,
  CourseDifficulty,
  CourseRequestPayload,
  CourseStatus,
} from "@/types"
import { ThumbnailUpload } from "@/components/courses/ThumbnailUpload"
import {
  DIFFICULTY_LABEL,
  getApiErrorMessage,
  getValidationErrors,
} from "@/components/courses/courseFormat"

type FormState = {
  title: string
  code: string
  categoryId: string
  description: string
  price: string
  isFree: boolean
  status: CourseStatus
  difficultyLevel: CourseDifficulty
  about: string
  whatStudentsWillLearn: string
  prerequisites: string
}

const EMPTY_FORM: FormState = {
  title: "",
  code: "",
  categoryId: "",
  description: "",
  price: "",
  isFree: false,
  status: "DRAFT",
  difficultyLevel: "BEGINNER",
  about: "",
  whatStudentsWillLearn: "",
  prerequisites: "",
}

function toFormState(course?: CourseDetail): FormState {
  if (!course) return EMPTY_FORM
  return {
    title: course.title ?? "",
    code: course.code ?? "",
    categoryId: String(course.categoryId ?? ""),
    description: course.description ?? "",
    price: course.price != null ? String(course.price) : "",
    isFree: Boolean(course.isFree),
    status: course.status ?? "DRAFT",
    difficultyLevel: course.difficultyLevel ?? "BEGINNER",
    about: course.about ?? "",
    whatStudentsWillLearn: course.whatStudentsWillLearn ?? "",
    prerequisites: course.prerequisites ?? "",
  }
}

export function CourseForm({ course }: { course?: CourseDetail }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = Boolean(course)

  const [form, setForm] = useState<FormState>(() => toFormState(course))
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
    staleTime: 5 * 60 * 1000,
  })

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setFormError(null)
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = "Course title is required."
    else if (form.title.trim().length > 255)
      next.title = "Course title must be 255 characters or fewer."

    if (!form.code.trim()) next.code = "Course code is required."
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim()))
      next.code =
        "Course code may contain only letters, numbers, hyphens and underscores."
    else if (form.code.trim().length > 50)
      next.code = "Course code must be 50 characters or fewer."

    if (!form.categoryId) next.categoryId = "Choose a category."

    if (!form.description.trim()) next.description = "Description is required."

    if (!form.isFree) {
      if (form.price.trim() === "") next.price = "Price is required."
      else if (Number.isNaN(Number(form.price)) || Number(form.price) < 0)
        next.price = "Price must be 0 or greater."
      else if (!/^\d+(\.\d{1,2})?$/.test(form.price.trim()))
        next.price = "Price supports up to 2 decimal places."
    }
    return next
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CourseRequestPayload = {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        categoryId: Number(form.categoryId),
        description: form.description.trim(),
        thumbnailUrl: course?.thumbnailUrl ?? null,
        price: form.isFree ? 0 : Number(form.price),
        isFree: form.isFree,
        status: form.status,
        difficultyLevel: form.difficultyLevel,
        about: form.about.trim() || null,
        whatStudentsWillLearn: form.whatStudentsWillLearn.trim() || null,
        prerequisites: form.prerequisites.trim() || null,
      }
      return isEdit && course
        ? courseService.update(course.id, payload, thumbnail)
        : courseService.create(payload, thumbnail)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["course", saved.id] })
      router.push(isEdit ? "/courses?updated=1" : "/courses?created=1")
    },
    onError: (error: unknown) => {
      const serverErrors = getValidationErrors(error)
      if (Object.keys(serverErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...serverErrors }))
      }
      const status = (error as { response?: { status?: number } })?.response?.status
      const message = getApiErrorMessage(
        error,
        "Could not save the course. Please try again."
      )
      if (serverErrors.thumbnailUrl) {
        setThumbnailError(serverErrors.thumbnailUrl)
      } else if (/thumbnail/i.test(message)) {
        setThumbnailError(message)
      } else if (status === 409) {
        setErrors((prev) => ({ ...prev, code: message }))
      } else if (Object.keys(serverErrors).length === 0) {
        setFormError(message)
      }
    },
  })

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFormError("Please fix the highlighted fields before saving.")
      return
    }
    setFormError(null)
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section
            title="Course details"
            description="The basics students see first in the course catalog."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Course title"
                htmlFor="course-title"
                required
                error={errors.title}
                hint={`${form.title.length}/255`}
                className="sm:col-span-2"
              >
                <Input
                  id="course-title"
                  value={form.title}
                  maxLength={255}
                  placeholder="e.g. Introduction to Data Structures"
                  aria-invalid={Boolean(errors.title)}
                  className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>

              <Field
                label="Course code"
                htmlFor="course-code"
                required
                error={errors.code}
                hint={`${form.code.length}/50`}
              >
                <Input
                  id="course-code"
                  value={form.code}
                  maxLength={50}
                  placeholder="e.g. CS201"
                  aria-invalid={Boolean(errors.code)}
                  className={cn(
                    "font-mono uppercase",
                    errors.code && "border-destructive focus-visible:ring-destructive"
                  )}
                  onChange={(e) =>
                    update({ code: e.target.value.toUpperCase().replace(/\s/g, "") })
                  }
                />
              </Field>

              <Field
                label="Category"
                htmlFor="course-category"
                required
                error={errors.categoryId}
              >
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => update({ categoryId: value })}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger
                    id="course-category"
                    aria-invalid={Boolean(errors.categoryId)}
                    className={cn(errors.categoryId && "border-destructive")}
                  >
                    <SelectValue
                      placeholder={categoriesLoading ? "Loading…" : "Select a category"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Short description"
                htmlFor="course-description"
                required
                error={errors.description}
                hint="Shown on the course card and at the top of the detail page."
                className="sm:col-span-2"
              >
                <Textarea
                  id="course-description"
                  value={form.description}
                  rows={3}
                  placeholder="A one-paragraph summary of what this course covers."
                  aria-invalid={Boolean(errors.description)}
                  className={cn(
                    errors.description && "border-destructive focus-visible:ring-destructive"
                  )}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Extended description"
            description="Optional details that help students decide whether the course is right for them."
          >
            <div className="space-y-4">
              <Field
                label="About this course"
                htmlFor="course-about"
                error={errors.about}
              >
                <Textarea
                  id="course-about"
                  value={form.about}
                  rows={4}
                  placeholder="How the course is structured, who it is for, and how it is taught."
                  onChange={(e) => update({ about: e.target.value })}
                />
              </Field>

              <Field
                label="What students will learn"
                htmlFor="course-outcomes"
                hint="One outcome per line — displayed as a checklist."
              >
                <Textarea
                  id="course-outcomes"
                  value={form.whatStudentsWillLearn}
                  rows={4}
                  placeholder={"Build a binary search tree\nAnalyse algorithm complexity\nWrite clean recursive solutions"}
                  onChange={(e) => update({ whatStudentsWillLearn: e.target.value })}
                />
              </Field>

              <Field
                label="Prerequisites"
                htmlFor="course-prerequisites"
                hint="One requirement per line. Leave blank if there are none."
              >
                <Textarea
                  id="course-prerequisites"
                  value={form.prerequisites}
                  rows={3}
                  placeholder={"Basic programming in any language\nComfort with functions and loops"}
                  onChange={(e) => update({ prerequisites: e.target.value })}
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Publishing" description="Visibility, level and pricing.">
            <div className="space-y-4">
              <Field label="Status" htmlFor="course-status">
                <Select
                  value={form.status}
                  onValueChange={(value) => update({ status: value as CourseStatus })}
                >
                  <SelectTrigger id="course-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft — only you can see it</SelectItem>
                    <SelectItem value="PUBLISHED">Published — visible to students</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Difficulty" htmlFor="course-difficulty">
                <Select
                  value={form.difficultyLevel}
                  onValueChange={(value) =>
                    update({ difficultyLevel: value as CourseDifficulty })
                  }
                >
                  <SelectTrigger id="course-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(DIFFICULTY_LABEL) as CourseDifficulty[]
                    ).map((level) => (
                      <SelectItem key={level} value={level}>
                        {DIFFICULTY_LABEL[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) =>
                    update({
                      isFree: e.target.checked,
                      price: e.target.checked ? "" : form.price,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--success))]"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Free course
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Students can enroll without paying.
                  </span>
                </span>
              </label>

              <Field
                label="Price (USD)"
                htmlFor="course-price"
                required={!form.isFree}
                error={errors.price}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="course-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.isFree ? "" : form.price}
                    disabled={form.isFree}
                    placeholder={form.isFree ? "Free" : "0.00"}
                    aria-invalid={Boolean(errors.price)}
                    className={cn(
                      "pl-7",
                      errors.price && "border-destructive focus-visible:ring-destructive"
                    )}
                    onChange={(e) => update({ price: e.target.value })}
                  />
                </div>
              </Field>
            </div>
          </Section>

          <Section
            title="Thumbnail"
            description="PNG or JPG, up to 5MB. 1280 × 720 recommended."
          >
            <ThumbnailUpload
              file={thumbnail}
              existingUrl={course?.thumbnailUrl}
              onChange={(next) => {
                setThumbnail(next)
                setThumbnailError(null)
                setFormError(null)
                setErrors((prev) => {
                  const copy = { ...prev }
                  delete copy.thumbnail
                  delete copy.thumbnailUrl
                  return copy
                })
              }}
              error={thumbnailError ?? errors.thumbnail}
              disabled={mutation.isPending}
            />
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-3 rounded-lg border bg-card/95 px-4 py-3 shadow-gc backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isEdit
            ? "Changes are visible to students as soon as they are saved."
            : "You can keep the course as a draft until it is ready."}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/courses")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Save className="mr-1.5 h-4 w-4" />
            ) : (
              <Check className="mr-1.5 h-4 w-4" />
            )}
            {isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default CourseForm
