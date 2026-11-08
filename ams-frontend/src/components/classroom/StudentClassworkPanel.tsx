"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, FileText } from "lucide-react"
import { assignmentService } from "@/services/assignment.service"
import { SubmitDialog } from "@/components/classroom/SubmitDialog"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { FileChip } from "@/components/classroom/FileChip"
import { parseFileMeta } from "@/components/classroom/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Assignment, AssignmentOverviewItem } from "@/types"

export function StudentClassworkPanel({ courseId }: { courseId: number }) {
  const [selected, setSelected] = useState<AssignmentOverviewItem | null>(null)
  const queryClient = useQueryClient()
  const { data: assignments = [], isLoading, isError } = useQuery({
    queryKey: ["student-course-assignments", courseId],
    queryFn: () => assignmentService.getByCourse(courseId),
  })
  const { data: overview = [] } = useQuery({
    queryKey: ["student-work"],
    queryFn: assignmentService.getMyOverview,
  })

  const workFor = (assignment: Assignment) => overview.find(
    item => item.courseId === courseId && item.assignmentId === assignment.id,
  )

  return <>
    <Card id="classwork" className="scroll-mt-20">
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Bài tập của khóa học</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Đang tải bài tập…</p>
          : isError ? <p role="alert" className="text-sm text-muted-foreground">Không tải được bài tập. Hãy kiểm tra đăng ký và trạng thái thanh toán.</p>
          : assignments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có bài tập được phân bổ cho khóa học này.</p>
          : assignments.map(assignment => {
            const work = workFor(assignment)
            return <article key={assignment.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold">{assignment.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5"/>Hạn nộp: {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(assignment.dueAt))} · Tối đa {assignment.maxScore} điểm</p></div>
                {work && <StatusBadge status={work.workState}/>}
              </div>
              <div><h4 className="text-sm font-medium">Yêu cầu đề bài</h4><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{assignment.instructions?.trim() || "Giảng viên chưa bổ sung yêu cầu."}</p></div>
              {assignment.attachmentUrl && (() => {
                const meta = parseFileMeta(assignment.attachmentMetadata)
                return (
                  <div>
                    <h4 className="text-sm font-medium">Tệp đề bài</h4>
                    <div className="mt-1">
                      <FileChip
                        name={meta?.name || "Assignment file"}
                        sizeLabel={meta?.sizeLabel}
                        href={assignment.attachmentUrl}
                        download
                      />
                    </div>
                  </div>
                )
              })()}
              {assignment.rubric?.trim() && <div><h4 className="text-sm font-medium">Rubric / tiêu chí chấm</h4><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{assignment.rubric}</p></div>}
              {work?.score != null && <p className="text-sm font-medium">Điểm đã công bố: {work.score}/{assignment.maxScore}</p>}
              <div>{work?.workState === "NOT_STARTED" && <Button size="sm" onClick={() => setSelected(work)}>Nộp bài</Button>}{work?.workState === "UNDER_EVALUATION" && <p className="text-sm text-muted-foreground">Bài đã nộp, đang chờ giáo viên công bố điểm.</p>}{work?.workState === "SUBMITTED" || work?.workState === "LATE" ? <p className="text-sm text-muted-foreground">Bài đã nộp; không thể thay thế bài nộp cuối.</p> : null}</div>
            </article>
          })}
      </CardContent>
    </Card>
    {selected && <SubmitDialog open enrollmentId={selected.enrollmentId} assignmentId={selected.assignmentId} onClose={() => setSelected(null)} onSubmitted={() => { setSelected(null); queryClient.invalidateQueries({queryKey:["student-work"]}); queryClient.invalidateQueries({queryKey:["student-course-assignments",courseId]}) }}/>}
  </>
}
