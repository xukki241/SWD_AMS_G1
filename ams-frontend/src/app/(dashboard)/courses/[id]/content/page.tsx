"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, Eye, Pencil } from "lucide-react"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseStatusBadge } from "@/components/courses/CourseStatusBadge"
import { CurriculumEditor } from "@/components/courses/CurriculumEditor"
import { courseService } from "@/services/course.service"
import { useI18n } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function ManageContentInner() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params?.id)
  const { t } = useI18n()

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.getById(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  })

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        {t("courses.details.invalidId")}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("courses.edit.backToCourse")}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("courses.details.manageContent")}</h1>
            {course && <CourseStatusBadge status={course.status} />}
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-56" />
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {course ? (
                <>
                  {course.title}{" "}
                  <span className="font-mono text-xs">({course.code})</span>
                </>
              ) : (
                t("courses.editor.buildHint")
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}`}>
              <Eye className="mr-1.5 h-4 w-4" />
              {t("courses.editor.viewCourse")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              {t("courses.details.edit")}
            </Link>
          </Button>
        </div>
      </div>

      <CurriculumEditor courseId={courseId} />
    </div>
  )
}

export default function ManageCourseContentPage() {
  return (
    <CourseStaffGuard>
      <ManageContentInner />
    </CourseStaffGuard>
  )
}
