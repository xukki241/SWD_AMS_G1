"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RubricCriteriaEditor } from "@/components/classroom/RubricCriteriaEditor"
import { useToast } from "@/lib/use-toast"
import { useI18n, getApiErrorMessage } from "@/i18n"
import { assignmentService } from "@/services/assignment.service"
import type { Assignment, RubricCriterion } from "@/types"

export function EditRubricDialog({ assignment, open, onClose }: {
  assignment: Assignment
  open: boolean
  onClose: () => void
}) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>(assignment.rubricCriteria || [])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  useEffect(() => {
    if (open) setCriteria(assignment.rubricCriteria || [])
  }, [open, assignment.id, assignment.rubricCriteria])

  const save = useMutation({
    mutationFn: () => assignmentService.patch(assignment.id, { rubricCriteria: criteria }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments", assignment.courseId] })
      queryClient.invalidateQueries({ queryKey: ["student-course-assignments", assignment.courseId] })
      toast({ title: t("classroom.rubric.saved"), variant: "success" })
      onClose()
    },
    onError: (error: unknown) => toast({ title: t("classroom.rubric.saveFailed"), description: getApiErrorMessage(error, t("classroom.rubric.saveFailed")), variant: "destructive" }),
  })

  const total = criteria.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0)
  const valid = criteria.length === 0 || (criteria.every((item) => item.id && item.name.trim() && item.maxScore > 0)
    && Math.abs(total - assignment.maxScore) <= 0.01)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("classroom.rubric.editTitle")}</DialogTitle>
          <DialogDescription>{t("classroom.rubric.editDescription", { max: assignment.maxScore })}</DialogDescription>
        </DialogHeader>
        <RubricCriteriaEditor criteria={criteria} maxScore={assignment.maxScore} onChange={setCriteria} disabled={save.isPending} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button onClick={() => save.mutate()} disabled={!valid || save.isPending}>{t("classroom.rubric.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
