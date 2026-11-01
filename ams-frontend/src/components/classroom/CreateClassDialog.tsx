"use client"

import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { FolderPlus, Loader2, Copy, Check } from "lucide-react"

export function CreateClassDialog({
  trigger,
  defaultLabel = "Create class",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  trigger?: React.ReactNode
  defaultLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When true, no trigger button is rendered (use with controlled open). */
  hideTrigger?: boolean
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const [className, setClassName] = useState("")
  const [section, setSection] = useState("")
  const [subjectName, setSubjectName] = useState("")
  const [room, setRoom] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: async () => {
      return (
        await api.post("/subject-classes", {
          className: className.trim(),
          section: section.trim() || undefined,
          subjectName: subjectName.trim(),
          room: room.trim() || undefined,
        })
      ).data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] })
      queryClient.invalidateQueries({ queryKey: ["public-classes"] })
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
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
    setClassName("")
    setSection("")
    setSubjectName("")
    setRoom("")
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

  const canSubmit =
    className.trim().length > 0 &&
    subjectName.trim().length > 0 &&
    !createMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetForm()
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button>
              <FolderPlus className="h-4 w-4 mr-1.5" />
              {defaultLabel}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create class</DialogTitle>
          <DialogDescription>
            Add a class name and subject. Section and room are optional.
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
            <Button className="w-full" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="gc-class-name">Class name *</Label>
                <Input
                  id="gc-class-name"
                  placeholder="e.g. Period 1 · Biology"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gc-section">Section</Label>
                <Input
                  id="gc-section"
                  placeholder="e.g. Period 1"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gc-subject">Subject *</Label>
                <Input
                  id="gc-subject"
                  placeholder="e.g. Biology"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gc-room">Room</Label>
                <Input
                  id="gc-room"
                  placeholder="e.g. 204"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={!canSubmit}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateClassDialog
