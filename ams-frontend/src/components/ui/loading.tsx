import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4"
              style={{ width: `${12 + (j * 17) % 26}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-64" />
      <div className="mt-6">
        <TableSkeleton rows={3} cols={4} />
      </div>
    </div>
  )
}

/** Skeleton for the centered "Verifying transaction…" payment callback card. */
export function PaymentResultSkeleton() {
  return (
    <div className="w-full max-w-lg rounded-lg border bg-card p-8 text-center shadow-gc">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <Skeleton className="mx-auto h-6 w-48" />
      <Skeleton className="mx-auto mt-2 h-3 w-72" />
      <Skeleton className="mx-auto mt-6 h-10 w-full rounded-full" />
    </div>
  )
}
