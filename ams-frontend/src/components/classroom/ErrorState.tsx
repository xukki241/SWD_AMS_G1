"use client"

import React from "react"
import { AlertCircle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  const { t } = useI18n()
  const resolvedMessage = message ?? t("classroom.error.loadMessage")
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="text-sm font-medium text-foreground">{t("classroom.error.loadTitle")}</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{resolvedMessage}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          {t("classroom.error.retry")}
        </Button>
      )}
    </div>
  )
}

export default ErrorState
