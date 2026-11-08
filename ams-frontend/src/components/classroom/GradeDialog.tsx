"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Award, Loader2, CheckCircle2, Sparkles } from "lucide-react"
import { ScoreInput } from "@/components/classroom/ScoreInput"
import { assignmentService } from "@/services/assignment.service"
import { evaluationService } from "@/services/evaluation.service"
import { submissionService } from "@/services/submission.service"
import { getAiFileLimitation } from "@/components/classroom/aiGradingSupport"
import { useI18n } from "@/i18n"
import type { CriterionScore, Submission } from "@/types"

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
  const [criteriaScores, setCriteriaScores] = useState<CriterionScore[]>([])
  const [saving, setSaving] = useState(false)
  const [gradingWithAi, setGradingWithAi] = useState(false)
  const [claimState, setClaimState] = useState<"loading" | "acquired" | "error">("loading")
  const [claimError, setClaimError] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  // Reset fields whenever the dialog opens for a new submission.
  useEffect(() => {
    if (open) {
      const saved = submission?.evaluation
      setScore(saved?.score != null ? String(saved.score) : saved?.aiDraftScore == null ? "" : String(saved.aiDraftScore))
      setFeedback(saved?.feedback || saved?.aiDraftFeedback || "")
      setCriteriaScores(saved?.criteriaScores || saved?.aiDraftCriteria || [])
    }
  }, [open, submission?.id])

  useEffect(() => {
    if (!open || !submission) return
    if (submission.submissionStatus === "GRADED") {
      setClaimState("acquired")
      setClaimError(null)
      return
    }
    let active = true
    let acquired = false
    setClaimState("loading")
    setClaimError(null)
    let renewTimer: ReturnType<typeof setInterval> | undefined

    submissionService.acquireGradingClaim(submission.id).then(() => {
      if (!active) {
        void submissionService.releaseGradingClaim(submission.id)
        return
      }
      acquired = true
      setClaimState("acquired")
      renewTimer = setInterval(() => {
        submissionService.renewGradingClaim(submission.id).catch((error: any) => {
          if (!active) return
          setClaimState("error")
          setClaimError(error?.response?.data?.message || t("classroom.grade.claimExpired"))
        })
      }, 60_000)
    }).catch((error: any) => {
      if (!active) return
      setClaimState("error")
      setClaimError(error?.response?.data?.message || t("classroom.grade.claimUnavailable"))
    })

    return () => {
      active = false
      if (renewTimer) clearInterval(renewTimer)
      if (acquired) void submissionService.releaseGradingClaim(submission.id)
    }
  }, [open, submission?.id, submission?.submissionStatus, t])

  // Max score comes from the parent assignment.
  const { data: assignment } = useQuery({
    queryKey: ["assignment", submission?.assignmentId],
    queryFn: () => assignmentService.getById(submission!.assignmentId),
    enabled: open && submission != null,
  })
  const maxScore = assignment?.maxScore ?? 10

  useEffect(() => {
    if (!open || !assignment?.rubricCriteria?.length || criteriaScores.length > 0) return
    const defaults = assignment.rubricCriteria.map((criterion) => ({ id: criterion.id, score: 0, feedback: "" }))
    setCriteriaScores(defaults)
    setScore("0")
  }, [open, assignment?.id, assignment?.rubricCriteria, criteriaScores.length])

  const existing = submission?.evaluation
  const aiFileLimitation = submission ? getAiFileLimitation(submission) : null
  // Only published grades are final; saved teacher drafts remain editable.
  const isGraded = existing?.published === true || submission?.submissionStatus === "GRADED"

  const save = async () => {
    if (!submission || isGraded) return
    setSaving(true)
    try {
      await evaluationService.create({
        submissionId: submission.id,
        score: Number(score),
        feedback: feedback.trim() || undefined,
        criteriaScores: assignment?.rubricCriteria?.length ? criteriaScores : undefined,
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

  const gradeWithAi = async () => {
    if (!submission || claimState !== "acquired") return
    setGradingWithAi(true)
    try {
      const draft = await evaluationService.gradeWithAi(submission.id)
      setScore(String(draft.totalScore))
      setFeedback(draft.feedback)
      setCriteriaScores(draft.criteria)
      queryClient.invalidateQueries({ queryKey: ["submissions", submission.assignmentId] })
      toast({ title: t("classroom.grade.aiReady"), description: t("classroom.grade.aiReviewRequired"), variant: "success" })
    } catch (error: any) {
      toast({ title: t("classroom.grade.aiFailed"), description: error?.response?.data?.message || t("classroom.grade.aiFailedFallback"), variant: "destructive" })
    } finally {
      setGradingWithAi(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {isGraded ? t("classroom.grade.viewTitle") : t("classroom.grade.title")}
          </DialogTitle>
          <DialogDescription>
            {submission?.studentName ? `${submission.studentName} · ` : ""}
            {submission?.assignmentTitle || assignment?.title || ""}
          </DialogDescription>
        </DialogHeader>

        {claimState === "loading" && <p className="text-sm text-muted-foreground">{t("classroom.grade.claimLoading")}</p>}
        {claimState === "error" && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{claimError}</p>}

        {submission?.answerText?.trim() && (
          <div className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t("classroom.grade.studentAnswer")}</p>
            <p className="whitespace-pre-wrap">{submission.answerText}</p>
          </div>
        )}

        {isGraded ? (
          <div className="space-y-4">
            {existing?.aiDraftScore != null && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"><p className="font-medium">Gemini chấm nháp — cần giáo viên xem lại</p><p className="mt-1">Gợi ý: {existing.aiDraftScore}/{maxScore}</p>{existing.aiDraftFeedback&&<p className="mt-1 text-muted-foreground">{existing.aiDraftFeedback}</p>}</div>}
            <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
              <div>
                <div className="text-2xl font-semibold text-success">
                  {existing?.score ?? "—"} <span className="text-base text-muted-foreground">/ {maxScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("classroom.grade.gradedBy", {
                    name: existing?.evaluatorName || t("classroom.grade.graderFallback"),
                  })}
                </p>
              </div>
            </div>
            {existing?.feedback && (
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("classroom.grade.feedbackLabel")}
                </p>
                <p className="mt-1 text-sm italic text-foreground">
                  &ldquo;{existing.feedback}&rdquo;
                </p>
              </div>
            )}
            {existing?.criteriaScores?.length ? (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("classroom.work.rubricBreakdown")}</p>
                {existing.criteriaScores.map((item) => {
                  const criterion = assignment?.rubricCriteria?.find((entry) => entry.id === item.id)
                  return <div key={item.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium">{criterion?.name || item.id}</p>{item.feedback && <p className="text-xs text-muted-foreground">{item.feedback}</p>}</div><span className="shrink-0 font-medium">{item.score}{criterion ? ` / ${criterion.maxScore}` : ""}</span></div>
                })}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("classroom.grade.finalNote")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={gradeWithAi} disabled={claimState !== "acquired" || gradingWithAi || saving || aiFileLimitation !== null}>
                {gradingWithAi ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                {gradingWithAi ? t("classroom.grade.aiLoading") : t("classroom.grade.aiAction")}
              </Button>
            </div>
            {aiFileLimitation && <p className="text-xs text-muted-foreground">{t("classroom.grade.aiFileUnsupported", { format: aiFileLimitation })}</p>}
            {assignment?.rubricCriteria?.length ? (
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-semibold">{t("classroom.rubric.criteriaTitle")}</p>
                {assignment.rubricCriteria.map((criterion) => {
                  const current = criteriaScores.find((item) => item.id === criterion.id)
                  return (
                    <div key={criterion.id} className="space-y-1 rounded bg-muted/40 p-2">
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <div><p className="font-medium">{criterion.name} <span className="text-muted-foreground">({criterion.maxScore})</span></p><p className="text-xs text-muted-foreground">{criterion.description}</p></div>
                        <ScoreInput
                          value={current?.score == null ? "" : String(current.score)}
                          onValueChange={(value) => {
                            const rest = criteriaScores.filter((item) => item.id !== criterion.id)
                            const next = value === "" ? rest : [...rest, { id: criterion.id, score: Number(value), feedback: current?.feedback || "" }]
                            setCriteriaScores(next)
                            setScore(next.reduce((sum, item) => sum + item.score, 0).toFixed(2))
                          }}
                          max={criterion.maxScore}
                          placeholder={`0–${criterion.maxScore}`}
                        />
                      </div>
                      <Textarea
                        rows={2}
                        aria-label={criterion.name}
                        placeholder={t("classroom.grade.criterionFeedback")}
                        value={current?.feedback || ""}
                        onChange={(event) => setCriteriaScores((previous) => {
                          const rest = previous.filter((item) => item.id !== criterion.id)
                          return [...rest, { id: criterion.id, score: current?.score ?? 0, feedback: event.target.value }]
                        })}
                      />
                    </div>
                  )
                })}
              </div>
            ) : null}
            {existing?.aiDraftScore != null && (
              <p className="rounded bg-primary/5 p-2 text-xs text-muted-foreground">
                {t("classroom.grade.aiDraftNotice", { score: existing.aiDraftScore, max: maxScore })}
              </p>
            )}
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
                  gradingWithAi ||
                  claimState !== "acquired" ||
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
