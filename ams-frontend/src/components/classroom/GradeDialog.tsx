"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
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

export function GradeDialog({
  open,
  onOpenChange,
  submission,
  maxScore,
  assignmentTitle,
  invalidateKey,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: { id: number; studentName?: string; evaluation?: any } | null
  maxScore: number
  assignmentTitle: string
  invalidateKey: (string | number)[]
}) {
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const existing = submission?.evaluation
  // Grades are final: backend 400s on re-grade, so a graded submission is read-only.
  const isGraded = existing?.score != null

  const save = async () => {
    if (!submission || isGraded) return
    setSaving(true)
    try {
      await api.post("/evaluations", {
        submissionId: submission.id,
        score: Number(score),
        feedback: feedback.trim() || undefined,
      })
      queryClient.invalidateQueries({ queryKey: invalidateKey })
      toast({
        title: "Grade saved",
        description: `${submission.studentName || "Submission"} · ${score} / ${maxScore}`,
        variant: "success",
      })
      onOpenChange(false)
      setScore("")
      setFeedback("")
    } catch (err: any) {
      const status = err.response?.status
      if (status === 400) {
        toast({
          title: "Already graded",
          description:
            err.response?.data?.message || "This submission has already been graded.",
          variant: "destructive",
        })
      } else if (status === 403) {
        toast({
          title: "Not authorized",
          description: "Only the assignment teacher or class expert can grade this work.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Could not save grade",
          description: err.response?.data?.message || "Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {isGraded ? "View grade" : "Grade submission"}
          </DialogTitle>
          <DialogDescription>
            {submission?.studentName ? `${submission.studentName} · ` : ""}
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        {isGraded ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
              <div>
                <div className="text-2xl font-semibold text-success">
                  {existing.score} <span className="text-base text-muted-foreground">/ {maxScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Graded by {existing.evaluatorName || "teacher"}
                </p>
              </div>
            </div>
            {existing.feedback && (
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Feedback
                </p>
                <p className="mt-1 text-sm italic text-foreground">
                  &ldquo;{existing.feedback}&rdquo;
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Grades are final — re-grading is not supported.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Score (0 – {maxScore})
              </Label>
              <ScoreInput
                value={score}
                onValueChange={setScore}
                max={maxScore}
                placeholder={`e.g. ${maxScore === 10 ? 8.5 : maxScore * 0.8}`}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grade-feedback" className="text-xs font-medium text-muted-foreground">
                Feedback
              </Label>
              <Textarea
                id="grade-feedback"
                placeholder="Constructive feedback for the student…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {isGraded ? (
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
                Cancel
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
                Save &amp; grade
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GradeDialog
