"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { PostComposer } from "@/components/classroom/PostComposer"
import { PostItem } from "@/components/classroom/PostItem"
import { SubmitDialog } from "@/components/classroom/SubmitDialog"
import { GradeDialog } from "@/components/classroom/GradeDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import {
  formatDate,
  formatDateTime,
  formatVnd,
  avatarColor,
  classInitial,
} from "@/components/classroom/format"
import {
  MyClass,
  Post,
  AssignmentItem,
  SubmissionItem,
  Registration,
} from "@/components/classroom/classroomTypes"
import {
  CalendarClock,
  Users,
  User,
  KeyRound,
  Paperclip,
  Upload,
  Award,
  Download,
} from "lucide-react"

export default function ClassWorkspacePage() {
  const params = useParams<{ id: string }>()
  const classId = Number(params.id)

  const { user } = useAuthStore()
  const roles = user?.roles || []
  const isStaff = roles.some((r) =>
    ["ROLE_ADMIN", "ROLE_TEACHER", "ROLE_EXPERT"].some((x) => r.includes(x))
  )
  const currentUserId = user?.userId

  const [tab, setTab] = useState("stream")

  const {
    data: cls,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: async () => (await api.get(`/subject-classes/${classId}`)).data as MyClass,
  })

  return (
    <div className="space-y-6">
      {/* Class header */}
      {isLoading ? (
        <StatSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : cls ? (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-white ${avatarColor(
                cls.className
              )}`}
            >
              {classInitial(cls.className)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {cls.className}
              </h1>
              <p className="text-sm text-muted-foreground">
                {cls.subjectCode} · {cls.subjectName} · {cls.term || "—"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {cls.term || "Term"}
                </span>
                {cls.teacherName && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {cls.teacherName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {cls.enrolledCount}
                  {cls.capacity > 0 ? ` / ${cls.capacity}` : ""} enrolled
                </span>
                <Badge variant={Number(cls.registrationFee) === 0 ? "success" : "outline"}>
                  {formatVnd(cls.registrationFee)}
                </Badge>
              </div>
            </div>
            {isStaff && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">
                  <div>Join code</div>
                  <div className="font-mono text-sm font-bold tracking-widest text-foreground">
                    {cls.joinCode}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stream">Stream</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          {isStaff && <TabsTrigger value="people">People</TabsTrigger>}
        </TabsList>

        <TabsContent value="stream">
          <StreamTab classId={classId} canDelete={isStaff} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab
            classId={classId}
            isStaff={isStaff}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {isStaff && (
          <TabsContent value="people">
            <PeopleTab classId={classId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/* ---------------- Stream tab ---------------- */

function StreamTab({
  classId,
  canDelete,
  currentUserId,
}: {
  classId: number
  canDelete: boolean
  currentUserId?: number
}) {
  const {
    data: posts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-posts", classId],
    queryFn: async () => (await api.get(`/classes/${classId}/posts`)).data as Post[],
  })

  return (
    <div className="space-y-4">
      <PostComposer classId={classId} invalidateKey="class-posts" />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={3} cols={2} />
      ) : posts && posts.length > 0 ? (
        <div className="space-y-3">
          {[...posts].reverse().map((p) => (
            <PostItem
              key={p.id}
              post={p}
              classId={classId}
              currentUserId={currentUserId}
              canDelete={canDelete}
              invalidateKey="class-posts"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing here yet"
          description="Be the first to post to the class stream."
        />
      )}
    </div>
  )
}

/* ---------------- Assignments tab ---------------- */

function AssignmentsTab({
  classId,
  isStaff,
  currentUserId,
}: {
  classId: number
  isStaff: boolean
  currentUserId?: number
}) {
  const {
    data: assignments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: async () =>
      (await api.get(`/assignments/class/${classId}`)).data as AssignmentItem[],
  })

  return (
    <div className="space-y-4">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a) =>
            isStaff ? (
              <StaffAssignmentRow key={a.id} assignment={a} classId={classId} />
            ) : (
              <StudentAssignmentRow key={a.id} assignment={a} classId={classId} />
            )
          )}
        </div>
      ) : (
        <EmptyState
          title="No classwork yet"
          description="Assignments will appear here when the teacher publishes some."
        />
      )}
    </div>
  )
}

function StudentAssignmentRow({
  assignment,
  classId,
}: {
  assignment: AssignmentItem
  classId: number
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // My registration for this class gives the classRegistrationId needed to submit.
  const { data: registrations } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: async () =>
      (await api.get("/registrations/my")).data as Registration[],
  })
  const myReg = (registrations || []).find(
    (r) => r.subjectClassId === classId && r.status !== "CANCELLED"
  )

  // My submissions for this class's assignments.
  const { data: mySubs } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () =>
      (await api.get("/submissions/my")).data as SubmissionItem[],
  })
  const mySub = (mySubs || []).find((s) => s.assignmentId === assignment.id)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{assignment.title}</h3>
          {assignment.instructions && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Due {formatDate(assignment.dueAt)} · up to {assignment.maxScore} pts
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {mySub ? (
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={mySub.submissionStatus} />
              {mySub.submissionStatus === "GRADED" && mySub.evaluation?.score != null && (
                <span className="text-sm font-semibold text-emerald-600">
                  Score: {mySub.evaluation.score} / {assignment.maxScore}
                </span>
              )}
              {mySub.secureFileReference && (
                <a
                  href={mySub.secureFileReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> My submission
                </a>
              )}
              {mySub.evaluation?.feedback && (
                <p className="max-w-xs text-right text-xs text-muted-foreground">
                  “{mySub.evaluation.feedback}”
                </p>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              disabled={!myReg}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Submit work
            </Button>
          )}
        </div>
      </div>
      {!myReg && !mySub && (
        <p className="mt-2 text-xs text-amber-600">
          You are not enrolled in this class, so you cannot submit.
        </p>
      )}
      {myReg && (
        <SubmitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          assignment={{
            id: assignment.id,
            dueAt: assignment.dueAt,
            maxScore: assignment.maxScore,
          }}
          classRegistrationId={myReg.id}
          assignmentTitle={assignment.title}
        />
      )}
    </div>
  )
}

function StaffAssignmentRow({
  assignment,
  classId,
}: {
  assignment: AssignmentItem
  classId: number
}) {
  const [grading, setGrading] = useState<SubmissionItem | null>(null)

  const {
    data: submissions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-assignment-submissions", classId, assignment.id],
    queryFn: async () =>
      (await api.get(`/submissions/assignment/${assignment.id}`)).data as SubmissionItem[],
  })

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{assignment.title}</h3>
          {assignment.instructions && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Due {formatDate(assignment.dueAt)} · up to {assignment.maxScore} pts
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Submissions
        </p>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={2} cols={3} />
        ) : submissions && submissions.length > 0 ? (
          <ul className="space-y-2">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 p-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(
                      s.studentName
                    )}`}
                  >
                    {s.studentName?.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {s.studentName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(s.submittedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={s.submissionStatus} />
                  {s.secureFileReference && (
                    <a
                      href={s.secureFileReference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" /> File
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant={s.evaluation?.score != null ? "outline" : "default"}
                    onClick={() => setGrading(s)}
                  >
                    <Award className="h-3.5 w-3.5 mr-1" />
                    {s.evaluation?.score != null ? "Re-grade" : "Grade"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No submissions yet.</p>
        )}
      </div>

      {grading && (
        <GradeDialog
          open={!!grading}
          onOpenChange={(o) => !o && setGrading(null)}
          submission={grading}
          maxScore={Number(assignment.maxScore) || 10}
          assignmentTitle={assignment.title}
          invalidateKey={["class-assignment-submissions", classId, assignment.id]}
        />
      )}
    </div>
  )
}

/* ---------------- People tab ---------------- */

function PeopleTab({ classId }: { classId: number }) {
  const {
    data: people,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-people", classId],
    queryFn: async () =>
      (await api.get(`/registrations/class/${classId}`)).data as Registration[],
  })

  return (
    <div className="space-y-3">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : people && people.length > 0 ? (
        <div className="rounded-md border">
          <ul className="divide-y">
            {people.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(
                    r.studentName
                  )}`}
                >
                  {r.studentName?.trim().charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.studentName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enrolled {formatDate(r.registeredAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title="No students enrolled yet"
          description="Share the join code so students can register for this class."
        />
      )}
    </div>
  )
}
