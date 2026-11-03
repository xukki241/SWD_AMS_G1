"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft } from "lucide-react"
import { useParams } from "next/navigation"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseForm } from "@/components/courses/CourseForm"
import { courseService } from "@/services/course.service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/components/courses/courseFormat"

function EditCourseInner() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params?.id)

  const { data: course, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.getById(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  })

  if (!Number.isFinite(courseId) || courseId <= 0) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        Invalid course id.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link href={`/courses/${course.id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to course
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit course</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Editing <span className="font-medium text-foreground">{course.title}</span>{" "}
          <span className="ml-1 font-mono text-xs">({course.code})</span>
        </p>
      </div>
      <CourseForm course={course} />
    </div>
  )
}

export default function EditCoursePage() {
  return (
    <CourseStaffGuard>
      <div className="mx-auto max-w-5xl">
        <EditCourseInner />
      </div>
    </CourseStaffGuard>
  )
}
