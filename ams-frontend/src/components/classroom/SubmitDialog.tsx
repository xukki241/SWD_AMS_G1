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
import { Label } from "@/components/ui/label"
import { Upload, File as FileIcon, Loader2 } from "lucide-react"
import { formatDate, isPastDue } from "@/components/classroom/format"

export function SubmitDialog({
  open,
  onOpenChange,
  assignment,
  classRegistrationId,
  assignmentTitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // The assignment being submitted: id + dueAt (the backend flags LATE automatically)
  assignment: { id: number; dueAt: string; maxScore?: number } | null
  classRegistrationId: number
  assignmentTitle: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const late = isPastDue(assignment?.dueAt)

  const submit = async () => {
    if (!file || !assignment) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("classRegistrationId", String(classRegistrationId))
      fd.append("assignmentId", String(assignment.id))
      if (note.trim()) fd.append("fileMetadata", note.trim())
      fd.append("file", file)
      await api.post("/submissions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
      queryClient.invalidateQueries({ queryKey: ["student-assignments-overview"] })
      queryClient.invalidateQueries({ queryKey: ["student-stats"] })
      toast({
        title: late ? "Submitted (late)" : "Submitted",
        description: "Your work was received and is waiting for grading.",
        variant: "success",
      })
      onOpenChange(false)
      setFile(null)
      setNote("")
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.response?.data?.message || "Could not upload your file.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit work</DialogTitle>
          <DialogDescription>
            {assignmentTitle} · due {formatDate(assignment?.dueAt)}
            {late && (
              <span className="ml-1 font-semibold text-amber-600">(this is past the deadline — it will be marked late)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>File to submit</Label>
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-5 text-sm ${
                file ? "border-primary bg-primary/5 text-foreground" : "text-muted-foreground hover:border-primary/50"
              }`}
            >
              {file ? (
                <>
                  <FileIcon className="h-4 w-4 text-primary" />
                  <span className="truncate">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Choose a file (PDF, DOCX, ZIP…)</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Anything the teacher should know"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !file}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitDialog
