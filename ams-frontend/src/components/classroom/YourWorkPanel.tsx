"use client"

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
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
import type { SubmissionItem } from "@/components/classroom/classroomTypes"
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Undo2,
} from "lucide-react"

type UploadPhase = "idle" | "uploading" | "retrying" | "done" | "error"

/**
 * GC-style sticky "Bài tập của bạn" panel — reuses the same submit multipart
 * API as SubmitDialog, plus DELETE unsubmit for non-graded work.
 */
export function YourWorkPanel({
  assignment,
  classRegistrationId,
  mySubmission,
}: {
  assignment: { id: number; dueAt: string; maxScore?: number }
  classRegistrationId: number | null
  mySubmission?: SubmissionItem | null
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
  const abortRef = useRef<AbortController | null>(null)

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
    queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
    queryClient.invalidateQueries({ queryKey: ["student-assignments-overview"] })
    queryClient.invalidateQueries({ queryKey: ["student-stats"] })
  }

  const doUpload = useCallback(
    async (attempt: number) => {
      if (!file || !classRegistrationId) return
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
          headers: { "Content-Type": "multipart/form-data" },
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
          title: late ? "Đã nộp (muộn)" : "Đã nộp bài",
          description: "Bài của bạn đang chờ chấm điểm.",
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
            ? "Upload timed out."
            : "Không thể nộp bài.")
        setErrorMsg(msg)
        toast({ title: "Nộp bài thất bại", description: msg, variant: "destructive" })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, assignment.id, classRegistrationId, note, late, toast]
  )

  const turnIn = () => {
    if (!file || !classRegistrationId) return
    setRetryCount(0)
    doUpload(0)
  }

  const unsubmit = async () => {
    if (!mySubmission) return
    setUnsubmitting(true)
    try {
      await api.delete(`/submissions/${mySubmission.id}`)
      invalidate()
      toast({ title: "Đã hủy nộp", description: "Bạn có thể chỉnh sửa và nộp lại." })
    } catch (err: any) {
      toast({
        title: "Không hủy được",
        description: err.response?.data?.message || "Thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setUnsubmitting(false)
    }
  }

  const inFlight = phase === "uploading" || phase === "retrying"

  return (
    <aside className="sticky top-20 rounded-xl border bg-card p-5 shadow-gc">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        Bài tập của bạn
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Hạn {formatDate(assignment.dueAt)}
        {late && !graded && (
          <span className="ml-1 font-medium text-warning">(đã quá hạn)</span>
        )}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Trạng thái</span>
        {mySubmission ? (
          <StatusBadge status={mySubmission.submissionStatus} />
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Chưa nộp
          </span>
        )}
      </div>

      {graded && (
        <p className="mt-3 text-sm font-semibold text-[hsl(var(--success))]">
          Điểm: {mySubmission!.evaluation!.score} / {assignment.maxScore ?? 10}
        </p>
      )}

      {mySubmission?.secureFileReference && (
        <div className="mt-3">
          <FileChip
            href={mySubmission.secureFileReference}
            name={meta?.name}
            sizeLabel={meta?.sizeLabel}
            label="File đã nộp"
          />
        </div>
      )}

      {mySubmission?.evaluation?.feedback && (
        <blockquote className="mt-3 rounded-lg bg-muted/60 p-3 text-sm italic text-foreground">
          &ldquo;{mySubmission.evaluation.feedback}&rdquo;
        </blockquote>
      )}

      {!turnedIn && classRegistrationId && (
        <div className="mt-4 space-y-3 border-t pt-4">
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
                    ? `Đang thử lại (${retryCount}/${MAX_ATTEMPTS})…`
                    : "Đang tải lên…"}
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
            placeholder="Ghi chú (tuỳ chọn)"
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
            {inFlight ? "Đang nộp…" : "Nộp bài"}
          </Button>
        </div>
      )}

      {turnedIn && !graded && (
        <Button
          variant="outline"
          className="mt-4 w-full rounded-full"
          onClick={unsubmit}
          disabled={unsubmitting}
        >
          {unsubmitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Undo2 className="mr-1.5 h-4 w-4" />
          )}
          Hủy nộp
        </Button>
      )}

      {turnedIn && graded && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--success))]">
          <CheckCircle2 className="h-4 w-4" />
          Đã chấm điểm
        </div>
      )}

      {!classRegistrationId && (
        <p className="mt-4 text-xs text-warning">
          Bạn chưa ghi danh lớp này nên không thể nộp bài.
        </p>
      )}
    </aside>
  )
}

export default YourWorkPanel
