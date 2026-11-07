"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/lib/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Award, Loader2, CheckCircle2 } from "lucide-react"
import { ScoreInput } from "@/components/classroom/ScoreInput"
import { assignmentService } from "@/services/assignment.service"
import { evaluationService } from "@/services/evaluation.service"
import { useI18n } from "@/i18n"
import type { Submission } from "@/types"

export function GradeDialog({
  submission,
  open,
  onClose,
  onGraded,
}: {
  submission: Submission | null
  open: boolean
  onClose: () => void
  onGraded?: (submissionId: number) => void
}) {
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { t } = useI18n()

  // Reset fields whenever the dialog opens for a new submission.
  useEffect(() => {
    if (open) {
      setScore(submission?.evaluation?.aiDraftScore == null ? "" : String(submission.evaluation.aiDraftScore))
      setFeedback(submission?.evaluation?.aiDraftFeedback || "")
    }
  }, [open, submission?.id])

  // Max score comes from the parent assignment.
  const { data: assignment } = useQuery({
    queryKey: ["assignment", submission?.assignmentId],
    queryFn: () => assignmentService.getById(submission!.assignmentId),
    enabled: open && submission != null,
  })
  const maxScore = assignment?.maxScore ?? 10

  const existing = submission?.evaluation
  // Grades are final: backend 400s on re-grade, so a graded submission is read-only.
  const isGraded = existing?.score != null

  const save = async () => {
    if (!submission || isGraded) return
    setSaving(true)
    try {
      await evaluationService.create({
        submissionId: submission.id,
        score: Number(score),
        feedback: feedback.trim() || undefined,
      })
      toast({
        title: t("classroom.grade.savedToast"),
        description: t("classroom.grade.savedDescription", {
          student: submission.studentName || t("classroom.grade.studentFallback"),
          score,
          max: maxScore,
        }),
        variant: "success",
      })
      onGraded?.(submission.id)
      onClose()
    } catch (err: any) {
      const status = err.response?.status
      if (status === 400) {
        toast({
          title: t("classroom.grade.alreadyGradedTitle"),
          description:
            err.response?.data?.message || t("classroom.grade.alreadyGradedFallback"),
          variant: "destructive",
        })
      } else if (status === 403) {
        toast({
          title: t("classroom.grade.notAuthorizedTitle"),
          description: t("classroom.grade.notAuthorizedDescription"),
          variant: "destructive",
        })
      } else {
        toast({
          title: t("classroom.grade.failedTitle"),
          description: err.response?.data?.message || t("classroom.grade.failedFallback"),
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {isGraded ? t("classroom.grade.viewTitle") : t("classroom.grade.title")}
          </DialogTitle>
          <DialogDescription>
            {submission?.studentName ? `${submission.studentName} · ` : ""}
            {submission?.assignmentTitle || assignment?.title || ""}
          </DialogDescription>
        </DialogHeader>

        {isGraded ? (
          <div className="space-y-4">
            {existing?.aiDraftScore != null && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"><p className="font-medium">Gemini chấm nháp — cần giáo viên xem lại</p><p className="mt-1">Gợi ý: {existing.aiDraftScore}/{maxScore}</p>{existing.aiDraftFeedback&&<p className="mt-1 text-muted-foreground">{existing.aiDraftFeedback}</p>}</div>}
            <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
              <div>
                <div className="text-2xl font-semibold text-success">
                  {existing.score} <span className="text-base text-muted-foreground">/ {maxScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("classroom.grade.gradedBy", {
                    name: existing.evaluatorName || t("classroom.grade.graderFallback"),
                  })}
                </p>
              </div>
            </div>
            {existing.feedback && (
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("classroom.grade.feedbackLabel")}
                </p>
                <p className="mt-1 text-sm italic text-foreground">
                  &ldquo;{existing.feedback}&rdquo;
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("classroom.grade.finalNote")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("classroom.grade.scoreLabel", { max: maxScore })}
              </Label>
              <ScoreInput
                value={score}
                onValueChange={setScore}
                max={maxScore}
                placeholder={t("classroom.grade.scorePlaceholder", {
                  value: maxScore === 10 ? 8.5 : maxScore * 0.8,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grade-feedback" className="text-xs font-medium text-muted-foreground">
                {t("classroom.grade.feedbackLabel")}
              </Label>
              <Textarea
                id="grade-feedback"
                placeholder={t("classroom.grade.feedbackPlaceholder")}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {isGraded ? (
            <Button variant="ghost" onClick={() => onClose()} className="rounded-full">
              {t("common.actions.close")}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onClose()} className="rounded-full">
                {t("common.actions.cancel")}
              </Button>
              <Button
                onClick={save}
                disabled={
                  saving ||
                  score === "" ||
                  Number.isNaN(Number(score)) ||
                  Number(score) < 0 ||
                  Number(score) > maxScore
                }
                className="rounded-full shadow-gc hover:shadow-gc-lg"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Award className="mr-1.5 h-4 w-4" />
                )}
                {t("classroom.grade.save")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GradeDialog
