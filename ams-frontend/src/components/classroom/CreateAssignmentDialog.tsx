"use client"

import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Loader2, Plus } from "lucide-react"
import { assignmentService } from "@/services/assignment.service"
import { useI18n, getApiErrorMessage } from "@/i18n"

export function CreateAssignmentDialog({
  courseId,
  open,
  onClose,
  onCreated,
}: {
  courseId: number
  open: boolean
  onClose: () => void
  onCreated?: (assignmentId: number) => void
}) {
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [rubric, setRubric] = useState("")
  const [topic, setTopic] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [maxScore, setMaxScore] = useState("10")
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const reset = () => {
    setTitle("")
    setInstructions("")
    setRubric("")
    setTopic("")
    setDueAt("")
    setMaxScore("10")
    setStatus("PUBLISHED")
  }

  const createMutation = useMutation({
    mutationFn: () =>
      assignmentService.createForCourse(courseId, {
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        rubric: rubric.trim() || undefined,
        topic: topic.trim() || undefined,
        dueAt,
        maxScore: Number(maxScore) || 10,
        status,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments", courseId] })
      queryClient.invalidateQueries({ queryKey: ["teacher-todo"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
      toast({ title: t("classroom.create.createdToast"), variant: "success" })
      onCreated?.(created.id)
      reset()
      onClose()
    },
    onError: (err: any) => {
      toast({
        title: t("classroom.create.failedToast"),
        description: getApiErrorMessage(err, t("classroom.create.failedFallback")),
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("classroom.create.title")}</DialogTitle>
          <DialogDescription>
            {t("classroom.create.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="asg-title">{t("classroom.create.titleLabel")}</Label>
            <Input
              id="asg-title"
              placeholder={t("classroom.create.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="asg-due">{t("classroom.create.dueLabel")}</Label>
              <Input
                id="asg-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="asg-max">{t("classroom.create.maxScoreLabel")}</Label>
              <Input
                id="asg-max"
                type="number"
                min={0}
                step={0.5}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="asg-topic">{t("classroom.create.topicLabel")}</Label>
            <Input
              id="asg-topic"
              placeholder={t("classroom.create.topicPlaceholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="asg-instructions">{t("classroom.create.instructionsLabel")}</Label>
            <Textarea
              id="asg-instructions"
              placeholder={t("classroom.create.instructionsPlaceholder")}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1"><Label htmlFor="asg-rubric">Rubric / tiêu chí chấm</Label><Textarea id="asg-rubric" value={rubric} onChange={e=>setRubric(e.target.value)} placeholder="Mỗi dòng một tiêu chí và mô tả cách chấm" rows={3}/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status === "PUBLISHED"} onChange={e => setStatus(e.target.checked ? "PUBLISHED" : "DRAFT")}/>Phân bổ bài tập cho sinh viên ngay sau khi tạo</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose() }} disabled={createMutation.isPending}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !dueAt || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            {t("common.actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
