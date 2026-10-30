"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderPlus, Loader2, Copy, Check } from "lucide-react"
import type { Subject, UserInfo } from "@/components/classroom/classroomTypes"

export function CreateClassDialog({
  trigger,
  defaultLabel = "Create class",
}: {
  trigger?: React.ReactNode
  defaultLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [subjectId, setSubjectId] = useState<string>("")
  const [classCode, setClassCode] = useState("")
  const [className, setClassName] = useState("")
  const [term, setTerm] = useState("")
  const [teacherId, setTeacherId] = useState<string>("")
  const [expertId, setExpertId] = useState<string>("")
  const [capacity, setCapacity] = useState("0")
  const [fee, setFee] = useState("0")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/subjects")).data as Subject[],
  })
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data as UserInfo[],
    enabled: open,
  })
  const teachers = (users || []).filter((u) => u.roles?.includes("ROLE_TEACHER"))
  const experts = (users || []).filter((u) => u.roles?.includes("ROLE_EXPERT"))

  const createMutation = useMutation({
    mutationFn: async () => {
      return (
        await api.post("/subject-classes", {
          subjectId: parseInt(subjectId),
          classCode,
          className,
          term,
          teacherId: teacherId ? parseInt(teacherId) : null,
          expertId: expertId ? parseInt(expertId) : null,
          capacity: parseInt(capacity) || 0,
          registrationFee: parseFloat(fee) || 0,
        })
      ).data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] })
      queryClient.invalidateQueries({ queryKey: ["public-classes"] })
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] })
      setCreatedCode(res.joinCode)
      toast({
        title: "Class created",
        description: "Share the join code with your students.",
        variant: "success",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Could not create class",
        description: err.response?.data?.message || "Please check the form details.",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setSubjectId("")
    setClassCode("")
    setClassName("")
    setTerm("")
    setTeacherId("")
    setExpertId("")
    setCapacity("0")
    setFee("0")
    setCreatedCode(null)
    setCopied(false)
  }

  const close = () => {
    setOpen(false)
    resetForm()
  }

  const copyCode = async () => {
    if (!createdCode) return
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <FolderPlus className="h-4 w-4 mr-1.5" />
            {defaultLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>
            Set up a class section: pick a subject, name it, assign faculty, and decide
            the tuition fee (0 makes it free).
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="space-y-4 text-center py-4">
            <p className="text-sm text-muted-foreground">
              Your class is live. Share this join code so students can enroll:
            </p>
            <div className="mx-auto flex w-fit items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                {createdCode}
              </span>
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button className="w-full" onClick={close}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Choose a subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjects || []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.subjectCode} · {s.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Class code *</Label>
                <Input
                  placeholder="e.g. CS402-A"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Class name *</Label>
                <Input
                  placeholder="e.g. CS402 - Advanced React (Section A)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Term *</Label>
                <Input
                  placeholder="e.g. Spring 2026"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Teacher</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Expert</Label>
                <Select value={expertId} onValueChange={setExpertId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {experts.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Capacity (0 = unlimited)</Label>
                <Input
                  type="number"
                  min={0}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tuition fee (0 = free)</Label>
                <Input
                  type="number"
                  min={0}
                  step="100000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!subjectId || !classCode || !className || !term || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create class
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateClassDialog
