import React, { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/components/classroom/format"
import { useI18n } from "@/i18n"

export function UploadDropzone({
  file,
  onChange,
  hint,
  invalid = false,
  disabled = false,
}: {
  file: File | null
  onChange: (f: File | null) => void
  hint?: string
  invalid?: boolean
  disabled?: boolean
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const resolvedHint = hint ?? t("classroom.upload.hint")

  return (
    <div className="space-y-2">
      {file ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
            aria-label={t("classroom.upload.removeFile")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (disabled) return
            const f = e.dataTransfer.files?.[0]
            if (f) onChange(f)
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            disabled
              ? "cursor-not-allowed opacity-50 border-border text-muted-foreground"
              : dragOver
                ? "cursor-pointer border-primary bg-primary/5"
                : invalid
                  ? "cursor-pointer border-destructive/60 bg-destructive/5 hover:border-destructive"
                  : "cursor-pointer border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{resolvedHint}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("classroom.upload.dragDrop")}</p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  )
}

export default UploadDropzone
