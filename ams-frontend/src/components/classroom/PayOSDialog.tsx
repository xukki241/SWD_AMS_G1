"use client"

import React, { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { paymentService } from "@/services/payment.service"
import type { PayOSCheckoutResponse } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CreditCard } from "lucide-react"
import { formatVnd } from "@/components/classroom/format"

export function PayOSDialog({
  open,
  onOpenChange,
  enrollment,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment: {
    id: number
    registrationReference: string
    courseTitle?: string
    amount?: number
  } | null
}) {
  const [checkout, setCheckout] = useState<PayOSCheckoutResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const queryClient = useQueryClient()

  // Reset state when the dialog closes.
  useEffect(() => {
    if (!open) {
      setCheckout(null)
      setLoading(false)
      setError(null)
      setRedirecting(false)
    }
  }, [open])

  // Create the PayOS payment link when the dialog opens for an enrollment.
  useEffect(() => {
    if (!open || !enrollment?.id) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setCheckout(null)
    setRedirecting(false)

    paymentService
      .createPayOSPayment(enrollment.id)
      .then((data) => {
        if (!cancelled) setCheckout(data)
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not start PayOS payment.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, enrollment?.id])

  const openPayOS = (data: PayOSCheckoutResponse) => {
    setRedirecting(true)
    queryClient.invalidateQueries({ queryKey: ["student-payments"] })
    queryClient.invalidateQueries({ queryKey: ["student-enrollments"] })
    queryClient.invalidateQueries({ queryKey: ["sidebar-my-enrollments"] })
    window.location.href = data.checkoutUrl
  }

  const amount = checkout?.amount ?? enrollment?.amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <DialogTitle>Pay tuition — PayOS</DialogTitle>
          </div>
          <DialogDescription>
            You will be redirected to PayOS to pay{" "}
            <span className="font-semibold text-emerald-600">{formatVnd(amount)}</span> by
            QR code or bank transfer.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating PayOS payment link…
          </div>
        ) : checkout ? (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gateway</span>
              <span className="font-medium">PayOS · QR / bank transfer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono text-primary">{checkout.transactionRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-emerald-600">
                {formatVnd(Number(checkout.amount))}
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {checkout && (
            <Button onClick={() => openPayOS(checkout)} disabled={redirecting}>
              {redirecting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1.5" />
              )}
              Open PayOS
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PayOSDialog
