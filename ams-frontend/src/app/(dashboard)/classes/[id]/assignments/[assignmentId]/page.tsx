"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { YourWorkPanel } from "@/components/classroom/YourWorkPanel"
import { ErrorState } from "@/components/classroom/ErrorState"
import { StatSkeleton } from "@/components/ui/loading"
import { formatDate, dueCountdown } from "@/components/classroom/format"
import type {
  AssignmentItem,
  MyClass,
  Registration,
  SubmissionItem,
} from "@/components/classroom/classroomTypes"
import { ArrowLeft, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string; assignmentId: string }>()
  const classId = Number(params.id)
  const assignmentId = Number(params.assignmentId)
  const { user } = useAuthStore()
  const isStudent = (user?.roles || []).some((r) => r.includes("STUDENT"))

  const {
    data: cls,
    isLoading: clsLoading,
  } = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: async () => (await api.get(`/subject-classes/${classId}`)).data as MyClass,
  })

  const {
    data: assignment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () =>
      (await api.get(`/assignments/${assignmentId}`)).data as AssignmentItem,
  })

  const { data: registrations } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: async () =>
      (await api.get("/registrations/my")).data as Registration[],
    enabled: isStudent,
  })

  const { data: mySubs } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () =>
      (await api.get("/submissions/my")).data as SubmissionItem[],
    enabled: isStudent,
  })

  const myReg =
    (registrations || []).find(
      (r) => r.subjectClassId === classId && r.status !== "CANCELLED"
    ) ?? null
  const mySub = (mySubs || []).find((s) => s.assignmentId === assignmentId) ?? null
  const due = assignment ? dueCountdown(assignment.dueAt) : null

  if (isLoading || clsLoading) {
    return (
      <div className="space-y-4">
        <StatSkeleton />
        <StatSkeleton />
      </div>
    )
  }

  if (isError || !assignment) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/classes/${classId}?tab=assignments`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {cls?.className || "Lớp học"} · Bài tập trên lớp
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="rounded-xl border bg-card p-6 shadow-gc">
          {assignment.topic && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {assignment.topic}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {assignment.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Hạn {formatDate(assignment.dueAt)}
            </span>
            {due && (
              <span
                className={cn(
                  "font-medium",
                  due.days < 0
                    ? "text-destructive"
                    : due.days <= 1
                      ? "text-warning"
                      : "text-muted-foreground"
                )}
              >
                {due.text}
              </span>
            )}
            <span>Tối đa {assignment.maxScore} điểm</span>
            {assignment.teacherName && <span>· {assignment.teacherName}</span>}
          </div>

          <div className="mt-6 border-t pt-6">
            <h2 className="text-sm font-semibold text-foreground">Hướng dẫn</h2>
            {assignment.instructions ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {assignment.instructions}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Không có hướng dẫn thêm.</p>
            )}
          </div>
        </main>

        {isStudent && (
          <YourWorkPanel
            assignment={{
              id: assignment.id,
              dueAt: assignment.dueAt,
              maxScore: assignment.maxScore,
            }}
            classRegistrationId={myReg?.id ?? null}
            mySubmission={mySub}
          />
        )}
      </div>
    </div>
  )
}
