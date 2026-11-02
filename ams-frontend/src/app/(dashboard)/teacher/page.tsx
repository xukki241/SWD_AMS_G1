"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useHashSection } from "@/hooks/useHashSection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatSkeleton } from "@/components/ui/loading"
import { ClassCard } from "@/components/classroom/ClassCard"
import { CreateClassDialog } from "@/components/classroom/CreateClassDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { MyClass } from "@/components/classroom/classroomTypes"
import {
  FolderKanban,
  FileText,
  Hourglass,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
} from "lucide-react"

export default function TeacherDashboardPage() {
  useHashSection()

  const { data: stats, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => (await api.get("/dashboard/teacher")).data,
  })

  const {
    data: myClasses,
    isLoading: classesLoading,
    isError: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["teacher-my-classes"],
    queryFn: async () => (await api.get("/subject-classes/my")).data as MyClass[],
  })

  const toGrade = useMemo(
    () =>
      (myClasses || [])
        .filter((c) => (c.ungradedCount ?? 0) > 0)
        .sort((a, b) => (b.ungradedCount ?? 0) - (a.ungradedCount ?? 0)),
    [myClasses]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teacher dashboard</h2>
          <p className="text-muted-foreground">
            Manage your classes and grade submissions.
          </p>
        </div>
        <CreateClassDialog />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">class sections assigned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">classwork published</p>
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

      {/* My classes */}
      <section id="classes">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight">My classes</h3>
          <p className="text-sm text-muted-foreground">
            Open a class to manage its stream, assignments, and people.
          </p>
        </div>
        {classesError ? (
          <ErrorState onRetry={() => refetchClasses()} />
        ) : classesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : myClasses && myClasses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClasses.map((c) => (
              <ClassCard key={c.classId ?? c.id} data={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            description="Create a class to start publishing classwork."
          />
        )}
      </section>

      {/* To-do / grading queue */}
      <section id="todo" className="space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">To-do</h3>
          <p className="text-sm text-muted-foreground">
            Classes with submissions waiting to be graded.
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
                : "Review ungraded work by class"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classesError ? (
              <ErrorState onRetry={() => refetchClasses()} />
            ) : classesLoading ? (
              <StatSkeleton />
            ) : toGrade.length > 0 ? (
              <ul className="divide-y rounded-lg border">
                {toGrade.map((c) => {
                  const id = c.classId ?? c.id
                  return (
                    <li key={id}>
                      <Link
                        href={`/classes/${id}?tab=assignments`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.className}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.ungradedCount} ungraded
                            {c.ungradedCount === 1 ? " submission" : " submissions"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0 gap-1">
                          Grade
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                title="Nothing to grade"
                description="When students submit work, classes needing grades will show up here."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
