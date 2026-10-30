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
import { Input } from "@/components/ui/input"
import { Upload, Loader2 } from "lucide-react"
import { formatDate, isPastDue } from "@/components/classroom/format"
import { UploadDropzone } from "@/components/classroom/UploadDropzone"

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
          <DialogTitle className="font-semibold">Submit work</DialogTitle>
          <DialogDescription>
            {assignmentTitle} · due {formatDate(assignment?.dueAt)}
            {late && (
              <span className="ml-1 font-medium text-warning">
                (this is past the deadline — it will be marked late)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              File to submit
            </label>
            <UploadDropzone file={file} onChange={setFile} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="submission-note" className="text-xs font-medium text-muted-foreground">
              Note (optional)
            </label>
            <Input
              id="submission-note"
              placeholder="Anything the teacher should know"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !file}
            className="rounded-full shadow-gc hover:shadow-gc-lg"
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitDialog
