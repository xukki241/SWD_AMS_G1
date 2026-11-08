"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
import { assignmentService } from "@/services/assignment.service"
import { submissionService } from "@/services/submission.service"
import { useI18n } from "@/i18n"

type UploadPhase = "idle" | "uploading" | "retrying" | "done" | "error"

export function SubmitDialog({
  enrollmentId,
  assignmentId,
  open,
  onClose,
  onSubmitted,
}: {
  enrollmentId: number
  assignmentId: number
  open: boolean
  onClose: () => void
  onSubmitted?: (submissionId: number) => void
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
  const { t } = useI18n()
  const abortRef = useRef<AbortController | null>(null)

  // Fetch the assignment for title/dueAt/maxScore display.
  const { data: assignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentService.getById(assignmentId),
    enabled: open && assignmentId != null,
  })

  const late = isPastDue(assignment?.dueAt)

  const MAX_ATTEMPTS = 3
  const UPLOAD_TIMEOUT_MS = 60_000

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
    queryClient.invalidateQueries({ queryKey: ["student-assignments-overview"] })
    queryClient.invalidateQueries({ queryKey: ["student-stats"] })
    queryClient.invalidateQueries({ queryKey: ["submissions", assignmentId] })
    queryClient.invalidateQueries({ queryKey: ["teacher-todo"] })
    queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
  }

  const doUpload = useCallback(
    async (attempt: number) => {
      if ((!file && !note.trim()) || !assignment) return
      setSubmitting(true)
      setPhase(attempt === 0 ? "uploading" : "retrying")
      setErrorMsg(null)
      setProgress(0)

      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const created = await submissionService.submit(
          enrollmentId,
          assignment.id,
          file,
          {
            signal: abortRef.current.signal,
            timeout: UPLOAD_TIMEOUT_MS,
            onUploadProgress: (e) => {
              if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
            },
          },
          note
        )

        setPhase("done")
        setProgress(100)
        invalidate()
        toast({
          title: late ? t("classroom.submit.submittedLateToast") : t("classroom.submit.submittedToast"),
          description: t("classroom.submit.submittedDescription"),
          variant: "success",
        })
        onSubmitted?.(created.id)
        onClose()
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
            ? t("classroom.submit.timeoutError")
            : err?.code === "ERR_NETWORK"
              ? t("classroom.submit.networkError")
              : t("classroom.submit.uploadError"))
        setErrorMsg(msg)
        toast({
          title: t("classroom.submit.failedToast"),
          description: msg,
          variant: "destructive",
        })
      } finally {
        setSubmitting(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, assignment, enrollmentId, assignmentId, note, late, onClose, onSubmitted, toast]
  )

  const submit = () => {
    if ((!file && !note.trim()) || !assignment) return
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) cancelUpload()
        onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">{t("classroom.submit.title")}</DialogTitle>
          <DialogDescription>
            {assignment?.title ?? t("classroom.submit.loading")} ·{" "}
            {t("classroom.common.dueDate", { date: formatDate(assignment?.dueAt) })}
            {late && (
              <span className="ml-1 font-medium text-warning">
                {t("classroom.submit.pastDeadline")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {assignment?.rubric && <div className="rounded-md bg-muted/60 p-3"><p className="text-xs font-semibold">Rubric / tiêu chí chấm</p><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{assignment.rubric}</p></div>}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("classroom.submit.fileLabel")}
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
                    ? t("classroom.submit.retrying", { attempt: retryCount, max: MAX_ATTEMPTS })
                    : phase === "done"
                      ? t("classroom.submit.done")
                      : t("classroom.submit.uploading")}
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
              {t("classroom.submit.noteLabel")}
            </label>
            <textarea
              id="submission-note"
              placeholder={t("classroom.submit.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
              disabled={inFlight}
            />
          </div>
        </div>

        <DialogFooter className={inFlight ? "justify-between" : ""}>
          {inFlight ? (
            <Button variant="ghost" onClick={cancelUpload} className="rounded-full">
              {t("common.actions.cancel")}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => onClose()} className="rounded-full">
              {t("common.actions.close")}
            </Button>
          )}
          {phase === "error" ? (
            <Button
              onClick={retry}
              className="rounded-full shadow-gc hover:shadow-gc-lg"
            >
              {t("common.actions.retry")}
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={inFlight || (!file && !note.trim()) || !assignment}
              className="rounded-full shadow-gc hover:shadow-gc-lg"
            >
              {inFlight ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {inFlight ? t("classroom.submit.uploading") : t("classroom.submit.submit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitDialog
