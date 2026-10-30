import { Badge } from "@/components/ui/badge"
import type { BadgeProps } from "@/components/ui/badge"

// Single source of truth for status → label + color across the whole app.
// Covers: registration status, submission/work state, payment status.
const STATUS_MAP: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  // Registrations
  PENDING_PAYMENT: { label: "Pending Payment", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  // Submissions / work state
  NOT_STARTED: { label: "Not Started", variant: "outline" },
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "default" },
  LATE: { label: "Late", variant: "warning" },
  GRADED: { label: "Graded", variant: "success" },
  // Payments
  PENDING: { label: "Pending", variant: "warning" },
  SUCCESS: { label: "Success", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
  // Evaluations
  COMPLETED: { label: "Completed", variant: "success" },
  APPEALED: { label: "Appealed", variant: "warning" },
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  const entry = status ? STATUS_MAP[status] : undefined
  if (!entry) {
    return (
      <Badge variant="secondary" className={className}>
        {status || "Unknown"}
      </Badge>
    )
  }
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  )
}

export default StatusBadge
