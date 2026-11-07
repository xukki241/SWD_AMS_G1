"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarClock, FileText, Loader2, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreateAssignmentDialog } from "@/components/classroom/CreateAssignmentDialog"
import { FileChip } from "@/components/classroom/FileChip"
import { GradeDialog } from "@/components/classroom/GradeDialog"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { parseFileMeta } from "@/components/classroom/format"
import { useI18n, formatDateTime } from "@/i18n"
import { assignmentService } from "@/services/assignment.service"
import { submissionService } from "@/services/submission.service"
import { evaluationService } from "@/services/evaluation.service"
import type { Submission } from "@/types"

export function TeacherClassworkPanel({ courseId }: { courseId: number }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const { data: assignments, isLoading, isError, refetch } = useQuery({
    queryKey: ["course-assignments", courseId],
    queryFn: () => assignmentService.getByCourse(courseId),
  })

  const refreshGradingData = async (_submissionId: number) => {
    const submission = selectedSubmission
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["submissions", submission?.assignmentId] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-todo"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] }),
    ])
    setSelectedSubmission(null)
  }

  return (
    <section id="classwork" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("classroom.manage.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("classroom.manage.description")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />{t("classroom.manage.create")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("classroom.manage.loading")}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-8 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">{t("classroom.manage.loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>{t("common.actions.retry")}</Button>
        </div>
      ) : assignments?.length ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} onGrade={setSelectedSubmission} />
          ))}
        </div>
      ) : (
        <Card><CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{t("classroom.manage.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("classroom.manage.emptyDescription")}</p>
        </CardContent></Card>
      )}

      <CreateAssignmentDialog courseId={courseId} open={createOpen} onClose={() => setCreateOpen(false)} />
      <GradeDialog
        submission={selectedSubmission}
        open={selectedSubmission !== null}
        onClose={() => setSelectedSubmission(null)}
        onGraded={refreshGradingData}
      />
    </section>
  )
}

function AssignmentCard({ assignment, onGrade }: {
  assignment: import("@/types").Assignment
  onGrade: (submission: Submission) => void
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const publishAssignment = useMutation({
    mutationFn: () => assignmentService.patch(assignment.id, { status: "PUBLISHED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-assignments", assignment.courseId] }),
  })
  const { data: submissions, isLoading, isError, refetch } = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => submissionService.getByAssignment(assignment.id),
  })
  const publishGrade = useMutation({
    mutationFn: (submissionId: number) => evaluationService.publish(submissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["submissions", assignment.id] }),
  })

  const pendingCount = submissions?.filter((submission) =>
    ["SUBMITTED", "LATE"].includes(submission.submissionStatus) && submission.evaluation?.score == null
  ).length ?? 0

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{assignment.title}</h3>
            {assignment.status === "DRAFT" && <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">Bản nháp — chưa phân bổ cho sinh viên</span>}
            {assignment.instructions && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{assignment.instructions}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {t("classroom.manage.due", { date: formatDateTime(assignment.dueAt) })}
              <span>· {t("classroom.manage.maxScore", { score: assignment.maxScore })}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {t("classroom.manage.pending", { count: pendingCount })}
          </span>
        </div>
        {assignment.status === "DRAFT" ? <div className="border-t pt-3"><Button size="sm" onClick={() => publishAssignment.mutate()} disabled={publishAssignment.isPending}>Xuất bản & phân bổ bài tập</Button></div> : <div className="border-t pt-3">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />{t("classroom.manage.submissions")}
            {submissions && <span className="text-muted-foreground">({submissions.length})</span>}
          </h4>
          {isLoading ? <p className="text-sm text-muted-foreground">{t("classroom.manage.loading")}</p> : null}
          {isError ? <Button variant="outline" size="sm" onClick={() => refetch()}>{t("common.actions.retry")}</Button> : null}
          {!isLoading && !isError && submissions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("classroom.manage.noSubmissions")}</p>
          ) : null}
          <ul className="divide-y">
            {submissions?.map((submission) => {
              const meta = parseFileMeta(submission.fileMetadata)
              const canGrade = ["SUBMITTED", "LATE", "GRADED"].includes(submission.submissionStatus)
              return (
                <li key={submission.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{submission.studentName}</p>
                    <p className="text-xs text-muted-foreground">{t("classroom.manage.submittedAt", { date: formatDateTime(submission.submittedAt) })}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={submission.submissionStatus} />
                      {submission.evaluation?.score != null && (
                        <span className="text-xs font-medium">{t("classroom.manage.score", { score: submission.evaluation.score, max: assignment.maxScore })}</span>
                      )}
                    </div>
                    {meta && <FileChip name={meta.name} sizeLabel={meta.sizeLabel} href={submission.secureFileReference} download />}
                    {submission.evaluation?.aiDraftScore != null && <p className="text-xs text-muted-foreground">Gợi ý chấm Gemini (nháp): {submission.evaluation.aiDraftScore}/{assignment.maxScore} · {submission.evaluation.aiDraftFeedback}</p>}
                  </div>
                  <div className="flex gap-2">
                    {canGrade && <Button size="sm" variant={submission.evaluation?.score != null ? "outline" : "default"} onClick={() => onGrade(submission)}>
                      {submission.evaluation?.score != null ? t("classroom.manage.viewGrade") : t("classroom.manage.grade")}
                    </Button>}
                    {submission.evaluation?.score != null && !submission.evaluation.published && <Button size="sm" onClick={() => publishGrade.mutate(submission.id)} disabled={publishGrade.isPending}>Công bố điểm</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>}
      </CardContent>
    </Card>
  )
}
