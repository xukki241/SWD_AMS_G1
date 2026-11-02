"use client"

import React, { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { toApiDateTime } from "@/lib/datetime"
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
import { Loader2 } from "lucide-react"
import type { AssignmentItem } from "@/components/classroom/classroomTypes"

function toDatetimeLocal(iso: string): string {
  if (!iso) return ""
  // "2026-11-02T17:00:00" or with Z → datetime-local needs local yyyy-MM-ddTHH:mm
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 16)
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  classId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentItem | null
  classId: number
}) {
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [topic, setTopic] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [maxScore, setMaxScore] = useState("10")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!assignment || !open) return
    setTitle(assignment.title || "")
    setInstructions(assignment.instructions || "")
    setTopic(assignment.topic || "")
    setDueAt(toDatetimeLocal(assignment.dueAt))
    setMaxScore(String(assignment.maxScore ?? 10))
  }, [assignment, open])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/assignments/${assignment!.id}`, {
        title: title.trim(),
        instructions: instructions.trim(),
        topic: topic.trim() || null,
        dueAt: toApiDateTime(dueAt),
        maxScore: Number(maxScore) || 10,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-assignments", classId] })
      toast({ title: "Đã cập nhật bài tập", variant: "success" })
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast({
        title: "Không cập nhật được",
        description: err.response?.data?.message || "Thử lại sau.",
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa bài tập</DialogTitle>
          <DialogDescription>Chỉnh đề bài, hạn nộp và điểm tối đa.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="space-y-1">
            <Label>Tiêu đề *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Hạn nộp *</Label>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Điểm tối đa</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Chủ đề</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Đề bài / hướng dẫn</Label>
            <Textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || !dueAt || saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
