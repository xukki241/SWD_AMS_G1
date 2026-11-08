"use client"

import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { openFreshTab } from "@/lib/tab"
import { useI18n } from "@/i18n"

export function FileChip({
  name,
  sizeLabel,
  href,
  download = false,
  label,
  className,
}: {
  name?: string | null
  sizeLabel?: string | null
  href?: string | null
  download?: boolean
  label?: string
  className?: string
}) {
  const { t } = useI18n()
  const display = name || label || t("classroom.fileChip.fallback")
  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground",
        className
      )}
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[220px] truncate">{display}</span>
      {sizeLabel && <span className="shrink-0 text-muted-foreground">{sizeLabel}</span>}
    </span>
  )

  if (href) {
    return (
      <button
        type="button"
        onClick={() => openFreshTab(href, download)}
        className={cn(
          "inline-flex rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        {chip}
      </button>
    )
  }

  return chip
}

export default FileChip
