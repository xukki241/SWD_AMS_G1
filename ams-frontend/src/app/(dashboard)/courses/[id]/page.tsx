"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Layers,
  ListChecks,
  Pencil,
  PlayCircle,
  Users,
} from "lucide-react"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseStatusBadge, DifficultyBadge } from "@/components/courses/CourseStatusBadge"
import {
  formatDate,
  formatDuration,
  formatPrice,
  getApiErrorMessage,
  splitLines,
} from "@/components/courses/courseFormat"
import { courseService } from "@/services/course.service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function DetailsInner() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params?.id)

  const { data: course, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.getById(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  })

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return <Notice>Invalid course id.</Notice>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium">
          {getApiErrorMessage(error, "Could not load this course.")}
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const outcomes = splitLines(course.whatStudentsWillLearn)
  const prerequisites = splitLines(course.prerequisites)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <Link href="/courses">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to courses
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{course.code}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <Link href={`/courses/${course.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit Course
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/courses/${course.id}/content`}>
              <Layers className="mr-1.5 h-4 w-4" />
              Manage Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero + meta */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {course.thumbnailUrl ? (
            <div className="overflow-hidden rounded-lg border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnailUrl}
                alt={`${course.title} thumbnail`}
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex aspect-video w-full items-center justify-center rounded-lg border bg-gradient-to-br from-accent to-muted"
              )}
              aria-hidden
            >
              <BookOpen className="h-10 w-10 text-primary/50" />
            </div>
          )}

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          </section>

          {course.about && (
            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">About this course</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {course.about}
              </p>
            </section>
          )}

          {outcomes.length > 0 && (
            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">
                What students will learn
              </h2>
              <ul className="mt-3 space-y-2">
                {outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {prerequisites.length > 0 && (
            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Prerequisites</h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5">
                {prerequisites.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Meta sidebar */}
        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              At a glance
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <MetaRow label="Status">
                <CourseStatusBadge status={course.status} />
              </MetaRow>
              <MetaRow label="Difficulty">
                <DifficultyBadge level={course.difficultyLevel} />
              </MetaRow>
              <MetaRow label="Price">
                <span className="font-medium">{formatPrice(course.price, course.isFree)}</span>
              </MetaRow>
              <MetaRow label="Category">
                <span className="text-muted-foreground">{course.categoryName}</span>
              </MetaRow>
              <MetaRow label="Instructor">
                <span className="text-muted-foreground">{course.instructorName}</span>
              </MetaRow>
              <MetaRow label="Created">
                <span className="text-muted-foreground">{formatDate(course.createdAt)}</span>
              </MetaRow>
              <MetaRow label="Last updated">
                <span className="text-muted-foreground">{formatDate(course.updatedAt)}</span>
              </MetaRow>
            </dl>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Content
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat icon={Layers} value={course.metrics.moduleCount} label="Modules" />
              <Stat icon={PlayCircle} value={course.metrics.lessonCount} label="Lessons" />
              <Stat
                icon={Clock}
                value={formatDuration(course.metrics.totalDurationMinutes)}
                label="Duration"
              />
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Curriculum summary
              </h3>
              {course.curriculum.length > 0 ? (
                <ol className="mt-2 space-y-1.5">
                  {course.curriculum.map((module, index) => (
                    <li
                      key={module.id}
                      className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                    >
                      <span className="flex min-w-0 items-start gap-1.5">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span className="truncate font-medium text-foreground">
                          {module.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {module.lessonCount}{" "}
                        {module.lessonCount === 1 ? "lesson" : "lessons"}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  This course has no modules yet.
                </p>
              )}
            </div>

            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link href={`/courses/${course.id}/content`}>
                <Layers className="mr-1.5 h-4 w-4" />
                Manage Content
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-3">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      {children}
    </div>
  )
}

export default function CourseDetailsPage() {
  return (
    <CourseStaffGuard>
      <div className="mx-auto max-w-5xl">
        <DetailsInner />
      </div>
    </CourseStaffGuard>
  )
}
