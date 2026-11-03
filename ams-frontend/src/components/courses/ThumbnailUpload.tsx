"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { ImageIcon, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  MAX_THUMBNAIL_BYTES,
  formatBytes,
  validateThumbnailFile,
} from "@/components/courses/courseFormat"

export function ThumbnailUpload({
  file,
  existingUrl,
  onChange,
  error,
  disabled = false,
}: {
  file: File | null
  existingUrl?: string | null
  onChange: (file: File | null) => void
  error?: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (!file) {
      setObjectUrl(null)
      setDimensions(null)
      return
    }
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = useCallback(
    (next: File | null) => {
      if (!next) {
        setLocalError(null)
        onChange(null)
        return
      }
      const problem = validateThumbnailFile(next)
      if (problem) {
        setLocalError(problem)
        onChange(null)
        if (inputRef.current) inputRef.current.value = ""
        return
      }
      setLocalError(null)
      onChange(next)
    },
    [onChange]
  )

  const preview = objectUrl || existingUrl || null
  const message = error || localError

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          const dropped = e.dataTransfer.files?.[0]
          if (dropped) pick(dropped)
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : message
              ? "border-destructive/60 bg-destructive/5"
              : "border-border bg-muted/30",
          disabled && "opacity-60"
        )}
      >
        {preview ? (
          <div className="group relative aspect-video w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Course thumbnail preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="truncate text-xs font-medium text-white">
                {file
                  ? `${file.name} · ${formatBytes(file.size)}`
                  : "Current thumbnail"}
                {dimensions ? ` · ${dimensions.w}×${dimensions.h}` : ""}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
                {file && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={disabled}
                    onClick={() => pick(null)}
                    aria-label="Remove selected thumbnail"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </span>
            <span className="text-sm font-medium text-foreground">
              Drop a thumbnail here, or browse
            </span>
            <span className="text-xs text-muted-foreground">
              PNG or JPG · up to {formatBytes(MAX_THUMBNAIL_BYTES)} · 1280 × 720
              recommended (16:9)
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0] || null)}
      />

      {message ? (
        <p className="text-xs font-medium text-destructive">{message}</p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Upload className="h-3 w-3" />
          A 16:9 image looks best on the course card and detail page.
        </p>
      )}
    </div>
  )
}

export default ThumbnailUpload
