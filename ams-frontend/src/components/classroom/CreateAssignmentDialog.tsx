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
  const [topic, setTopic] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [maxScore, setMaxScore] = useState("10")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setTitle("")
    setInstructions("")
    setTopic("")
    setDueAt("")
    setMaxScore("10")
  }

  const createMutation = useMutation({
    mutationFn: () =>
      assignmentService.createForCourse(courseId, {
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        topic: topic.trim() || undefined,
        dueAt,
        maxScore: Number(maxScore) || 10,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments", courseId] })
      queryClient.invalidateQueries({ queryKey: ["teacher-todo"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
      toast({ title: "Assignment created", variant: "success" })
      onCreated?.(created.id)
      reset()
      onClose()
    },
    onError: (err: any) => {
      toast({
        title: "Could not create assignment",
        description: err.response?.data?.message || "Please check the form.",
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
          <DialogTitle>Create assignment</DialogTitle>
          <DialogDescription>
            Publish coursework for this course only.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="asg-title">Title *</Label>
            <Input
              id="asg-title"
              placeholder="e.g. Weekly programming exercise"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="asg-due">Due date &amp; time *</Label>
              <Input
                id="asg-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="asg-max">Max score</Label>
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
            <Label htmlFor="asg-topic">Topic (optional)</Label>
            <Input
              id="asg-topic"
              placeholder="e.g. Đồ án môn học"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="asg-instructions">Instructions</Label>
            <Textarea
              id="asg-instructions"
              placeholder="What should students do? Which file type to submit?"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose() }} disabled={createMutation.isPending}>
            Cancel
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
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
