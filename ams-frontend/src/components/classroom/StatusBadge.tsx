"use client"

import { Badge } from "@/components/ui/badge"
import type { BadgeProps } from "@/components/ui/badge"
import { useI18n, type TranslationKey } from "@/i18n"

// Single source of truth for status → label + color across the whole app.
// Covers: registration status, submission/work state, payment status.
const STATUS_MAP: Record<
  string,
  { key: TranslationKey; variant: BadgeProps["variant"] }
> = {
  // Registrations
  PENDING_PAYMENT: { key: "common.status.pendingPayment", variant: "warning" },
  ACTIVE: { key: "common.status.active", variant: "success" },
  CANCELLED: { key: "common.status.cancelled", variant: "destructive" },
  // Submissions / work state
  NOT_STARTED: { key: "classroom.status.notStarted", variant: "outline" },
  DRAFT: { key: "common.status.draft", variant: "secondary" },
  SUBMITTED: { key: "common.status.submitted", variant: "default" },
  UNDER_EVALUATION: { key: "common.status.underEvaluation", variant: "warning" },
  LATE: { key: "common.status.late", variant: "warning" },
  GRADED: { key: "common.status.graded", variant: "success" },
  // Payments
  PENDING: { key: "common.status.pending", variant: "warning" },
  SUCCESS: { key: "common.status.success", variant: "success" },
  FAILED: { key: "common.status.failed", variant: "destructive" },
  REFUNDED: { key: "common.status.refunded", variant: "secondary" },
  // Evaluations
  COMPLETED: { key: "common.status.completed", variant: "success" },
  APPEALED: { key: "common.status.appealed", variant: "warning" },
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  const { t } = useI18n()
  const entry = status ? STATUS_MAP[status] : undefined
  if (!entry) {
    return (
      <Badge variant="secondary" className={className}>
        {status || t("common.labels.unknown")}
      </Badge>
    )
  }
  return (
    <Badge variant={entry.variant} className={className}>
      {t(entry.key)}
    </Badge>
  )
}

export default StatusBadge
