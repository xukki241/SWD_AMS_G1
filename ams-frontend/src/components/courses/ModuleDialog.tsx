"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n"

export function ModuleDialog({
  open,
  onOpenChange,
  module,
  submitting = false,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog renames the module instead of creating one. */
  module?: { id: number; title: string } | null
  submitting?: boolean
  error?: string | null
  onSubmit: (title: string) => void
}) {
  const isEdit = Boolean(module)
  const { t } = useI18n()
  const [title, setTitle] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(module?.title ?? "")
    setLocalError(null)
  }, [open, module])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setLocalError(t("errors.validation.moduleTitleRequired"))
      return
    }
    if (trimmed.length > 255) {
      setLocalError(t("errors.validation.moduleTitleTooLong"))
      return
    }
    setLocalError(null)
    onSubmit(trimmed)
  }

  const message = localError || error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("courses.moduleDialog.renameTitle") : t("courses.moduleDialog.addTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("courses.moduleDialog.renameDescription")
              : t("courses.moduleDialog.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="module-title">{t("courses.moduleDialog.titleLabel")}</Label>
            <Input
              id="module-title"
              autoFocus
              value={title}
              maxLength={255}
              placeholder={t("courses.moduleDialog.titlePlaceholder")}
              aria-invalid={Boolean(message)}
              className={cn(message && "border-destructive focus-visible:ring-destructive")}
              onChange={(e) => {
                setTitle(e.target.value)
                setLocalError(null)
              }}
            />
            {message && (
              <p className="text-xs font-medium text-destructive" role="alert">
                {message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? t("common.actions.save") : t("courses.moduleDialog.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ModuleDialog
