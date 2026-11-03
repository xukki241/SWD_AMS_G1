"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { CourseStatusBadge } from "@/components/courses/CourseStatusBadge"
import { formatVnd } from "@/components/classroom/format"
import { courseService } from "@/services/course.service"
import { assignmentService } from "@/services/assignment.service"
import { submissionService } from "@/services/submission.service"
import { useAuthStore } from "@/stores/authStore"
import type { CourseSummary, TeacherDashboard } from "@/types"
import {
  FolderKanban,
  FileText,
  Hourglass,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
  Users,
} from "lucide-react"

export default function TeacherDashboardPage() {
  const userId = useAuthStore((s) => s.user?.userId)

  const { data: stats, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => (await api.get("/dashboard/teacher")).data as TeacherDashboard,
  })

  const {
    data: myCourses,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["teacher-my-courses"],
    queryFn: async () => {
      const page = await courseService.list({ page: 0, size: 50 })
      return page.content.filter((c) => c.instructorId === userId)
    },
    enabled: userId != null,
  })

  const {
    data: todoItems,
    isLoading: todoLoading,
    isError: todoError,
    refetch: refetchTodo,
  } = useQuery({
    queryKey: ["teacher-todo"],
    queryFn: async () => {
      const assignments = await assignmentService.getAll()
      const mine = assignments.filter((a) => a.teacherId === userId)
      return Promise.all(
        mine.map(async (a) => {
          const submissions = await submissionService.getByAssignment(a.id)
          const ungradedCount = submissions.filter(
            (s) =>
              ["SUBMITTED", "LATE"].includes(s.submissionStatus) && !s.evaluation
          ).length
          return { assignment: a, ungradedCount }
        })
      )
    },
    enabled: userId != null,
  })

  const toGrade = useMemo(
    () =>
      (todoItems || [])
        .filter((t) => t.ungradedCount > 0)
        .sort((a, b) => b.ungradedCount - a.ungradedCount),
    [todoItems]
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teacher dashboard</h2>
        <p className="text-muted-foreground">
          Manage your courses and grade submissions.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">courses you teach</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">coursework published</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Grade</CardTitle>
                <Hourglass className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingEvaluations}</div>
                <p className="text-xs text-muted-foreground">awaiting a score</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Graded</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedEvaluations}</div>
                <p className="text-xs text-muted-foreground">evaluations completed</p>
              </CardContent>
            </Card>
          </>
        ) : statsError ? (
          <ErrorState onRetry={() => refetchStats()} />
        ) : (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        )}
      </div>

      {/* My courses */}
      <section id="classes">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight">My Courses</h3>
          <p className="text-sm text-muted-foreground">
            Open a course to manage its content, assignments, and learners.
          </p>
        </div>
        {coursesError ? (
          <ErrorState onRetry={() => refetchCourses()} />
        ) : coursesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : myCourses && myCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses yet"
            description="Courses assigned to you will appear here."
          />
        )}
      </section>

      {/* To-do / grading queue */}
      <section id="todo" className="space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">To-do</h3>
          <p className="text-sm text-muted-foreground">
            Assignments with submissions waiting to be graded.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Grading queue
            </CardTitle>
            <CardDescription>
              {stats
                ? `${stats.pendingEvaluations} submission${stats.pendingEvaluations === 1 ? "" : "s"} awaiting a score`
                : "Review ungraded work by assignment"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todoError ? (
              <ErrorState onRetry={() => refetchTodo()} />
            ) : todoLoading ? (
              <StatSkeleton />
            ) : toGrade.length > 0 ? (
              <ul className="divide-y rounded-lg border">
                {toGrade.map(({ assignment, ungradedCount }) => (
                  <li key={assignment.id}>
                    <Link
                      href={`/courses/${assignment.courseId}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.courseCode} · {ungradedCount} ungraded
                          {ungradedCount === 1 ? " submission" : " submissions"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 gap-1">
                        Grade
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing to grade"
                description="When students submit work, assignments needing grades will show up here."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex h-24 items-end rounded-t-xl bg-primary/90 p-3">
        <span className="text-lg font-semibold text-primary-foreground">
          {course.title}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {course.code}
          </span>
          <CourseStatusBadge status={course.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{course.categoryName}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.difficultyLevel === "BEGINNER"
              ? "Beginner"
              : course.difficultyLevel === "INTERMEDIATE"
                ? "Intermediate"
                : "Advanced"}
          </span>
          <span className="font-medium text-foreground">{formatVnd(course.price)}</span>
        </div>
      </div>
    </Link>
  )
}
