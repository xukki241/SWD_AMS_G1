"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
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
import { ClassBanner } from "@/components/classroom/ClassBanner"
import { Avatar } from "@/components/ui/avatar"
import { FileChip } from "@/components/classroom/FileChip"
import {
  formatDate,
  timeAgo,
  dueCountdown,
  parseFileMeta,
} from "@/components/classroom/format"
import {
  MyClass,
  Post,
  AssignmentItem,
  SubmissionItem,
  Registration,
} from "@/components/classroom/classroomTypes"
import {
  Clock,
  Upload,
  Award,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
      {isLoading ? (
        <StatSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : cls ? (
        <ClassBanner data={cls} isStaff={isStaff} />
      ) : null}

      <div className="rounded-lg border bg-card shadow-gc">
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <div className="border-b px-4">
            <TabsList className="h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="stream"
                className="rounded-none border-b-2 border-transparent bg-transparent px-2 py-2.5 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Stream
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="rounded-none border-b-2 border-transparent bg-transparent px-2 py-2.5 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Classwork
              </TabsTrigger>
              {isStaff && (
                <TabsTrigger
                  value="people"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-2 py-2.5 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  People
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="p-4">
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
          </div>
        </Tabs>
      </div>
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

/* ---------------- Classwork tab ---------------- */

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

/* ---------------- Student row ---------------- */

function StudentAssignmentRow({
  assignment,
  classId,
}: {
  assignment: AssignmentItem
  classId: number
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { data: registrations } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: async () =>
      (await api.get("/registrations/my")).data as Registration[],
  })
  const myReg = (registrations || []).find(
    (r) => r.subjectClassId === classId && r.status !== "CANCELLED"
  )

  const { data: mySubs } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () =>
      (await api.get("/submissions/my")).data as SubmissionItem[],
  })
  const mySub = (mySubs || []).find((s) => s.assignmentId === assignment.id)

  const due = dueCountdown(assignment.dueAt)
  const meta = mySub ? parseFileMeta(mySub.fileMetadata) : null
  const graded = mySub?.submissionStatus === "GRADED" && mySub.evaluation?.score != null

  return (
    <div className="rounded-lg border bg-card p-5 shadow-gc">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{assignment.title}</h3>
          {assignment.instructions && (
            <div className="relative mt-1">
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm text-muted-foreground",
                  !expanded && "line-clamp-2"
                )}
              >
                {assignment.instructions}
              </p>
              {assignment.instructions.length > 140 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  {expanded ? "Less" : "More"}
                </button>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Due {formatDate(assignment.dueAt)}
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
            <span>up to {assignment.maxScore} pts</span>
            {assignment.teacherName && <span>by {assignment.teacherName}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {mySub ? (
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={mySub.submissionStatus} />
              {graded && (
                <span className="text-sm font-semibold text-success">
                  Score: {mySub.evaluation!.score} / {assignment.maxScore}
                </span>
              )}
              {mySub.secureFileReference && (
                <FileChip
                  href={mySub.secureFileReference}
                  name={meta?.name}
                  sizeLabel={meta?.sizeLabel}
                  label="My submission"
                />
              )}
            </div>
          ) : (
            <Button
              size="sm"
              className="rounded-full shadow-gc hover:shadow-gc-lg"
              onClick={() => setDialogOpen(true)}
              disabled={!myReg}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Submit work
            </Button>
          )}
        </div>
      </div>

      {mySub?.evaluation?.feedback && (
        <div className="mt-4 rounded-lg bg-muted/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Teacher's feedback
          </p>
          <blockquote className="mt-1 text-sm italic text-foreground">
            &ldquo;{mySub.evaluation.feedback}&rdquo;
          </blockquote>
        </div>
      )}

      {!myReg && !mySub && (
        <p className="mt-2 text-xs text-warning">
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

/* ---------------- Staff row ---------------- */

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
    <div className="rounded-lg border bg-card p-5 shadow-gc">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{assignment.title}</h3>
          {assignment.instructions && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Due {formatDate(assignment.dueAt)}
            </span>
            <span>up to {assignment.maxScore} pts</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Submissions ({submissions?.length ?? 0})
        </p>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={2} cols={3} />
        ) : submissions && submissions.length > 0 ? (
          <ul className="space-y-2">
            {submissions.map((s) => {
              const meta = parseFileMeta(s.fileMetadata)
              const graded = s.evaluation?.score != null
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={s.studentName} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {s.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeAgo(s.submittedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge status={s.submissionStatus} />
                    {s.secureFileReference && (
                      <FileChip
                        href={s.secureFileReference}
                        name={meta?.name}
                        sizeLabel={meta?.sizeLabel}
                      />
                    )}
                    {graded ? (
                      <>
                        <span className="inline-flex items-center rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-white">
                          {s.evaluation!.score} / {assignment.maxScore}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setGrading(s)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View grade
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full shadow-gc"
                        onClick={() => setGrading(s)}
                      >
                        <Award className="mr-1 h-3.5 w-3.5" />
                        Grade
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
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
        <div className="rounded-lg border bg-card">
          <ul className="divide-y">
            {people.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                <Avatar name={r.studentName} size="md" />
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
