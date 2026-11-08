"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/lib/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { FileChip } from "@/components/classroom/FileChip"
import { UploadDropzone } from "@/components/classroom/UploadDropzone"
import {
  formatDate,
  isPastDue,
  parseFileMeta,
} from "@/components/classroom/format"
import { submissionService } from "@/services/submission.service"
import { useI18n } from "@/i18n"
import type { Assignment } from "@/types"
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Undo2,
} from "lucide-react"

type UploadPhase = "idle" | "uploading" | "retrying" | "done" | "error"

/**
 * "Your work" dialog for one assignment within a course enrollment —
 * submit multipart via the submission service, unsubmit non-graded work.
 */
export function YourWorkPanel({
  enrollmentId,
  assignment,
  open,
  onClose,
}: {
  enrollmentId: number
  assignment: Assignment
  open: boolean
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [unsubmitting, setUnsubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()
  const abortRef = useRef<AbortController | null>(null)

  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => submissionService.getByAssignment(assignment.id),
    enabled: open,
  })

  const mySubmission = useMemo(
    () =>
      (submissions || []).find(
        (s) => s.courseEnrollmentId === enrollmentId
      ) ?? null,
    [submissions, enrollmentId]
  )

  const late = isPastDue(assignment.dueAt)
  const turnedIn =
    !!mySubmission &&
    ["SUBMITTED", "LATE", "GRADED"].includes(mySubmission.submissionStatus)
  const graded =
    mySubmission?.submissionStatus === "GRADED" &&
    mySubmission.evaluation?.score != null
  const meta = mySubmission ? parseFileMeta(mySubmission.fileMetadata) : null

  const MAX_ATTEMPTS = 3
  const UPLOAD_TIMEOUT_MS = 60_000

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["submissions", assignment.id] })
    queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
    queryClient.invalidateQueries({ queryKey: ["student-assignments-overview"] })
    queryClient.invalidateQueries({ queryKey: ["student-stats"] })
    queryClient.invalidateQueries({ queryKey: ["teacher-todo"] })
    queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
  }

  const doUpload = useCallback(
    async (attempt: number) => {
      if (!file) return
      setPhase(attempt === 0 ? "uploading" : "retrying")
      setErrorMsg(null)
      setProgress(0)

      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        await submissionService.submit(enrollmentId, assignment.id, file, {
          signal: abortRef.current.signal,
          timeout: UPLOAD_TIMEOUT_MS,
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
          },
        })

        setPhase("done")
        setProgress(100)
        invalidate()
        toast({
          title: late ? t("classroom.work.submittedLateToast") : t("classroom.work.submittedToast"),
          description: t("classroom.work.submittedDescription"),
          variant: "success",
        })
        setFile(null)
        setNote("")
        setPhase("idle")
        setProgress(0)
      } catch (err: any) {
        if (
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          abortRef.current?.signal.aborted
        ) {
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
          await new Promise((r) => setTimeout(r, delayMs))
          setRetryCount(attempt + 1)
          return doUpload(attempt + 1)
        }

        setPhase("error")
        const msg =
          err?.response?.data?.message ||
          (err?.code === "ECONNABORTED"
            ? t("classroom.work.timeoutError")
            : t("classroom.work.uploadError"))
        setErrorMsg(msg)
        toast({ title: t("classroom.work.failedToast"), description: msg, variant: "destructive" })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, assignment.id, enrollmentId, note, late, toast]
  )

  const turnIn = () => {
    if (!file) return
    setRetryCount(0)
    doUpload(0)
  }

  const unsubmit = async () => {
    if (!mySubmission) return
    setUnsubmitting(true)
    try {
      await submissionService.unsubmit(mySubmission.id)
      invalidate()
      refetchSubmissions()
      toast({ title: t("classroom.work.unsubmittedToast"), description: t("classroom.work.unsubmitDescription") })
    } catch (err: any) {
      toast({
        title: t("classroom.work.unsubmitFailedToast"),
        description: err.response?.data?.message || t("classroom.work.unsubmitFailedFallback"),
        variant: "destructive",
      })
    } finally {
      setUnsubmitting(false)
    }
  }

  const inFlight = phase === "uploading" || phase === "retrying"

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {t("classroom.work.title")}
          </DialogTitle>
          <DialogDescription>
            {assignment.title} ·{" "}
            {t("classroom.common.dueDate", { date: formatDate(assignment.dueAt) })}
            {late && !graded && (
              <span className="ml-1 font-medium text-warning">{t("classroom.common.pastDeadline")}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{t("classroom.work.statusLabel")}</span>
            {mySubmission ? (
              <StatusBadge status={mySubmission.submissionStatus} />
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {t("classroom.work.notSubmitted")}
              </span>
            )}
          </div>

          {graded && (
            <p className="text-sm font-semibold text-[hsl(var(--success))]">
              {t("classroom.work.score", {
                score: mySubmission!.evaluation!.score ?? 0,
                max: assignment.maxScore,
              })}
            </p>
          )}

          {mySubmission?.secureFileReference && (
            <FileChip
              href={mySubmission.secureFileReference}
              name={meta?.name}
              sizeLabel={meta?.sizeLabel}
              label={t("classroom.work.submittedFile")}
            />
          )}

          {mySubmission?.evaluation?.feedback && (
            <blockquote className="rounded-lg bg-muted/60 p-3 text-sm italic text-foreground">
              &ldquo;{mySubmission.evaluation.feedback}&rdquo;
            </blockquote>
          )}

          {!turnedIn && (
            <div className="space-y-3 border-t pt-4">
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

              {(inFlight || phase === "error") && (
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
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {phase === "retrying"
                        ? t("classroom.work.retrying", { attempt: retryCount, max: MAX_ATTEMPTS })
                        : t("classroom.work.uploading")}
                    </span>
                    {inFlight && (
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {progress}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        phase === "error" ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {phase === "error" && errorMsg && (
                    <p className="mt-2 text-destructive">{errorMsg}</p>
                  )}
                </div>
              )}

              <Input
                placeholder={t("classroom.work.notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-full"
                disabled={inFlight}
              />

              <Button
                className="w-full rounded-full shadow-gc hover:shadow-gc-lg"
                onClick={turnIn}
                disabled={inFlight || !file}
              >
                {inFlight ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                {inFlight ? t("classroom.work.submitting") : t("classroom.work.submit")}
              </Button>
            </div>
          )}

          {turnedIn && !graded && (
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={unsubmit}
              disabled={unsubmitting}
            >
              {unsubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="mr-1.5 h-4 w-4" />
              )}
              {t("classroom.work.unsubmit")}
            </Button>
          )}

          {turnedIn && graded && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))]">
              <CheckCircle2 className="h-4 w-4" />
              {t("classroom.work.graded")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default YourWorkPanel
