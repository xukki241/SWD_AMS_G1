"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
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
import { CreateAssignmentDialog } from "@/components/classroom/CreateAssignmentDialog"
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
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PILL =
  "rounded-full border-0 bg-transparent px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-[hsl(var(--success))] data-[state=active]:text-white data-[state=active]:shadow-gc"

export default function ClassWorkspacePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const classId = Number(params.id)

  const { user } = useAuthStore()
  const roles = user?.roles || []
  const isStaff = roles.some((r) =>
    ["ROLE_ADMIN", "ROLE_TEACHER", "ROLE_EXPERT"].some((x) => r.includes(x))
  )
  const currentUserId = user?.userId

  const initialTab = searchParams.get("tab") === "assignments" ? "assignments" : "stream"
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const t = searchParams.get("tab")
    if (t === "assignments" || t === "stream" || t === "people") setTab(t)
  }, [searchParams])

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

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <div className="flex justify-center">
          <TabsList className="h-auto gap-1 rounded-full bg-muted/70 p-1">
            <TabsTrigger value="stream" className={PILL}>
              Bảng tin
            </TabsTrigger>
            <TabsTrigger value="assignments" className={PILL}>
              Bài tập trên lớp
            </TabsTrigger>
            {isStaff && (
              <TabsTrigger value="people" className={PILL}>
                Mọi người
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="stream" className="mt-0">
          <StreamTab classId={classId} canDelete={isStaff} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-0">
          <AssignmentsTab
            classId={classId}
            isStaff={isStaff}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {isStaff && (
          <TabsContent value="people" className="mt-0">
            <PeopleTab classId={classId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/* ---------------- Stream tab — two columns + Upcoming ---------------- */

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

  const { data: assignments } = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: async () =>
      (await api.get(`/assignments/class/${classId}`)).data as AssignmentItem[],
  })

  const upcoming = useMemo(
    () =>
      [...(assignments || [])]
        .filter((a) => new Date(a.dueAt).getTime() >= Date.now() - 7 * 24 * 3600 * 1000)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 5),
    [assignments]
  )

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Left: Sắp đến hạn */}
      <aside className="order-2 lg:order-1">
        <div className="sticky top-20 rounded-xl border bg-card p-4 shadow-gc">
          <h3 className="text-sm font-semibold text-foreground">Sắp đến hạn</h3>
          {upcoming.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {upcoming.map((a) => {
                const due = dueCountdown(a.dueAt)
                return (
                  <li key={a.id}>
                    <Link
                      href={`/classes/${classId}/assignments/${a.id}`}
                      className="block rounded-lg p-2 transition-colors hover:bg-muted/60"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {a.title}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          due && due.days < 0
                            ? "text-destructive"
                            : due && due.days <= 1
                              ? "text-warning"
                              : "text-muted-foreground"
                        )}
                      >
                        {due?.text || formatDate(a.dueAt)}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Không có bài sắp đến hạn.
            </p>
          )}
          <Link
            href={`/classes/${classId}?tab=assignments`}
            className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
      </aside>

      {/* Main feed */}
      <div className="order-1 space-y-4 lg:order-2">
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
            title="Chưa có bài đăng"
            description="Hãy là người đầu tiên đăng lên bảng tin lớp."
          />
        )}
      </div>
    </div>
  )
}

/* ---------------- Classwork tab — topic filter + grouped list ---------------- */

const UNCATEGORIZED = "Không có chủ đề"

function AssignmentsTab({
  classId,
  isStaff,
}: {
  classId: number
  isStaff: boolean
  currentUserId?: number
}) {
  const [topicFilter, setTopicFilter] = useState<string | "all">("all")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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

  const topics = useMemo(() => {
    const set = new Set<string>()
    for (const a of assignments || []) {
      set.add(a.topic?.trim() || UNCATEGORIZED)
    }
    return Array.from(set).sort((a, b) => {
      if (a === UNCATEGORIZED) return 1
      if (b === UNCATEGORIZED) return -1
      return a.localeCompare(b, "vi")
    })
  }, [assignments])

  const grouped = useMemo(() => {
    const map = new Map<string, AssignmentItem[]>()
    for (const a of assignments || []) {
      const key = a.topic?.trim() || UNCATEGORIZED
      if (topicFilter !== "all" && key !== topicFilter) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return map
  }, [assignments, topicFilter])

  const toggle = (topic: string) =>
    setCollapsed((prev) => ({ ...prev, [topic]: !prev[topic] }))

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      {/* Topic filter */}
      <aside className="space-y-1">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chủ đề
        </p>
        <button
          type="button"
          onClick={() => setTopicFilter("all")}
          className={cn(
            "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-medium transition-colors",
            topicFilter === "all"
              ? "bg-[hsl(var(--success))] text-white shadow-gc"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Tất cả
        </button>
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopicFilter(t)}
            className={cn(
              "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-medium transition-colors",
              topicFilter === t
                ? "bg-[hsl(var(--success))] text-white shadow-gc"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t}</span>
          </button>
        ))}
      </aside>

      <div className="space-y-4">
        {isStaff && (
          <div className="flex justify-end">
            <CreateAssignmentDialog classId={classId} />
          </div>
        )}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : grouped.size > 0 ? (
          Array.from(grouped.entries()).map(([topic, items]) => {
            const isCollapsed = collapsed[topic]
            return (
              <section key={topic} className="rounded-xl border bg-card shadow-gc">
                <button
                  type="button"
                  onClick={() => toggle(topic)}
                  className="flex w-full items-center gap-2 border-b px-4 py-3 text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{topic}</h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <ul className="divide-y">
                    {items.map((a) =>
                      isStaff ? (
                        <li key={a.id} className="p-4">
                          <StaffAssignmentRow assignment={a} classId={classId} />
                        </li>
                      ) : (
                        <li key={a.id}>
                          <StudentAssignmentRow assignment={a} classId={classId} />
                        </li>
                      )
                    )}
                  </ul>
                )}
              </section>
            )
          })
        ) : (
          <EmptyState
            title="Chưa có bài tập"
            description={
              isStaff
                ? "Nhấn Create để giao bài tập cho lớp này."
                : "Bài tập sẽ hiện ở đây khi giáo viên giao."
            }
          />
        )}
      </div>
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
    <div className="px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/classes/${classId}/assignments/${assignment.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {assignment.title}
          </Link>
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
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
            <span>tối đa {assignment.maxScore} điểm</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {mySub ? (
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={mySub.submissionStatus} />
              {graded && (
                <span className="text-sm font-semibold text-[hsl(var(--success))]">
                  {mySub.evaluation!.score} / {assignment.maxScore}
                </span>
              )}
              {mySub.secureFileReference && (
                <FileChip
                  href={mySub.secureFileReference}
                  name={meta?.name}
                  sizeLabel={meta?.sizeLabel}
                  label="Bài nộp"
                />
              )}
              <Link
                href={`/classes/${classId}/assignments/${assignment.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Xem chi tiết
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                className="rounded-full shadow-gc hover:shadow-gc-lg"
                onClick={() => setDialogOpen(true)}
                disabled={!myReg}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Nộp bài
              </Button>
              <Link
                href={`/classes/${classId}/assignments/${assignment.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mở trang bài tập
              </Link>
            </div>
          )}
        </div>
      </div>

      {mySub?.evaluation?.feedback && (
        <div className="mt-3 rounded-lg bg-muted/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nhận xét
          </p>
          <blockquote className="mt-1 text-sm italic text-foreground">
            &ldquo;{mySub.evaluation.feedback}&rdquo;
          </blockquote>
        </div>
      )}

      {!myReg && !mySub && (
        <p className="mt-2 text-xs text-warning">
          Bạn chưa ghi danh lớp này nên không thể nộp bài.
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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/classes/${classId}/assignments/${assignment.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {assignment.title}
          </Link>
          {assignment.instructions && (
            <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Hạn {formatDate(assignment.dueAt)}
            </span>
            <span>tối đa {assignment.maxScore} điểm</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bài nộp ({submissions?.length ?? 0})
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
                        <span className="inline-flex items-center rounded-full bg-[hsl(var(--success))] px-2.5 py-0.5 text-xs font-semibold text-white">
                          {s.evaluation!.score} / {assignment.maxScore}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setGrading(s)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Xem điểm
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full shadow-gc"
                        onClick={() => setGrading(s)}
                      >
                        <Award className="mr-1 h-3.5 w-3.5" />
                        Chấm điểm
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Chưa có bài nộp.</p>
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
    <div className="mx-auto max-w-3xl space-y-3">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : people && people.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-gc">
          <ul className="divide-y">
            {people.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                <Avatar name={r.studentName} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.studentName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ghi danh {formatDate(r.registeredAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title="Chưa có học viên"
          description="Chia sẻ mã lớp để học viên ghi danh."
        />
      )}
    </div>
  )
}
