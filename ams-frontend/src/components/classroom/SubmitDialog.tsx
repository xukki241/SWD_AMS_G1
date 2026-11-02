"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { formatDate, isPastDue } from "@/components/classroom/format"
import { UploadDropzone } from "@/components/classroom/UploadDropzone"

type UploadPhase = "idle" | "uploading" | "retrying" | "done" | "error"

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
  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const abortRef = useRef<AbortController | null>(null)

  const late = isPastDue(assignment?.dueAt)

  // Upload with axios progress + a retry/poll loop on transient failures.
  // "Polling" here = the dialog watches the network call; if the first
  // attempt fails with a 5xx / network error it backs off and re-tries
  // up to `MAX_ATTEMPTS` times with exponential backoff. The user sees the
  // progress bar + "Retrying..." state rather than a hard failure.
  const MAX_ATTEMPTS = 3
  const UPLOAD_TIMEOUT_MS = 60_000

  const doUpload = useCallback(
    async (attempt: number) => {
      if (!file || !assignment) return
      setSubmitting(true)
      setPhase(attempt === 0 ? "uploading" : "retrying")
      setErrorMsg(null)
      setProgress(0)

      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const fd = new FormData()
        fd.append("classRegistrationId", String(classRegistrationId))
        fd.append("assignmentId", String(assignment.id))
        if (note.trim()) fd.append("fileMetadata", note.trim())
        fd.append("file", file)

        await api.post("/submissions", fd, {
          signal: abortRef.current.signal,
          timeout: UPLOAD_TIMEOUT_MS,
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
          },
        })

        setPhase("done")
        setProgress(100)
        queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
        queryClient.invalidateQueries({ queryKey: ["student-assignments-overview"] })
        queryClient.invalidateQueries({ queryKey: ["student-stats"] })
        queryClient.invalidateQueries({ queryKey: ["class-assignment-submissions"] })
        toast({
          title: late ? "Submitted (late)" : "Submitted",
          description: "Your work was received and is waiting for grading.",
          variant: "success",
        })
        onOpenChange(false)
        setFile(null)
        setNote("")
        setPhase("idle")
        setProgress(0)
      } catch (err: any) {
        // Abort (dialog closed) is not an error.
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED" || abortRef.current?.signal.aborted) {
          return
        }

        const isRetryable =
          (err?.response?.status >= 500 && err?.response?.status < 600) ||
          err?.code === "ECONNABORTED" ||
          err?.code === "ERR_NETWORK" ||
          !err?.response

        if (isRetryable && attempt + 1 < MAX_ATTEMPTS) {
          const delayMs = 1000 * 2 ** attempt
          setPhase("retrying")
          setErrorMsg(null)
          await new Promise((r) => setTimeout(r, delayMs))
          setRetryCount(attempt + 1)
          return doUpload(attempt + 1)
        }

        setPhase("error")
        const msg =
          err?.response?.data?.message ||
          (err?.code === "ECONNABORTED"
            ? "Upload timed out — the connection dropped before it finished."
            : err?.code === "ERR_NETWORK"
              ? "Network error while uploading."
              : "Could not upload your file.")
        setErrorMsg(msg)
        toast({
          title: "Submission failed",
          description: msg,
          variant: "destructive",
        })
      } finally {
        setSubmitting(false)
      }
    },
    [
      file,
      assignment,
      classRegistrationId,
      note,
      late,
      onOpenChange,
      queryClient,
      toast,
      phase,
    ]
  )

  const submit = () => {
    if (!file || !assignment) return
    setRetryCount(0)
    doUpload(0)
  }

  const retry = () => {
    if (phase !== "error") return
    setRetryCount(0)
    doUpload(retryCount)
  }

  const cancelUpload = () => {
    abortRef.current?.abort()
    setPhase("idle")
    setSubmitting(false)
    setProgress(0)
  }

  const inFlight = phase === "uploading" || phase === "retrying"

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) cancelUpload(); onOpenChange(o) }}>
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
            <UploadDropzone
              file={file}
              onChange={(f) => {
                setFile(f)
                if (f) {
                  setPhase("idle")
                  setProgress(0)
                }
              }}
              disabled={inFlight}
            />
          </div>

          {/* Progress + retry state (shown during upload / retry / error) */}
          {(inFlight || phase === "error" || phase === "done") && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                phase === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {inFlight ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : phase === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className="font-medium">
                  {phase === "retrying"
                    ? `Retrying (${retryCount}/${MAX_ATTEMPTS})…`
                    : phase === "done"
                      ? "Upload complete"
                      : "Uploading…"}
                </span>
                {inFlight && (
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {progress}%
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    phase === "error" ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {phase === "error" && (
                <p className="mt-2 text-destructive">{errorMsg}</p>
              )}
            </div>
          )}

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
              disabled={inFlight}
            />
          </div>
        </div>

        <DialogFooter className={inFlight ? "justify-between" : ""}>
          {inFlight ? (
            <Button variant="ghost" onClick={cancelUpload} className="rounded-full">
              Cancel
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
              Close
            </Button>
          )}
          {phase === "error" ? (
            <Button
              onClick={retry}
              className="rounded-full shadow-gc hover:shadow-gc-lg"
            >
              Retry
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={inFlight || !file}
              className="rounded-full shadow-gc hover:shadow-gc-lg"
            >
              {inFlight ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {inFlight ? "Uploading…" : "Submit"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitDialog
