"use client"

import React, { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Award, Loader2 } from "lucide-react"

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
  const scoreValid =
    score !== "" &&
    !isNaN(Number(score)) &&
    Number(score) >= 0 &&
    Number(score) <= maxScore

  const save = async () => {
    if (!submission || !scoreValid) return
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
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>
            {submission?.studentName ? `${submission.studentName} · ` : ""}
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Score (0 – {maxScore})</Label>
            <Input
              type="number"
              min={0}
              max={maxScore}
              step={0.1}
              placeholder={`e.g. ${maxScore === 10 ? 8.5 : maxScore * 0.8}`}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            {score !== "" && !scoreValid && (
              <p className="text-xs text-destructive">
                Enter a number between 0 and {maxScore}.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Feedback</Label>
            <Textarea
              placeholder="Constructive feedback for the student…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          {existing?.score != null && (
            <p className="text-xs text-muted-foreground">
              Currently graded: <strong>{existing.score}</strong>
              {existing.feedback ? ` · ${existing.feedback}` : ""} — saving will update it.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !scoreValid}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Award className="h-4 w-4 mr-1.5" />
            )}
            Save &amp; grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GradeDialog
