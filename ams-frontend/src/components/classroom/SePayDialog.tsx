"use client"

import React, { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { paymentService } from "@/services/payment.service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, ExternalLink } from "lucide-react"
import { formatVnd } from "@/components/classroom/format"

export type SePayCheckout = {
  checkoutUrl: string
  formFields: Record<string, string>
  transactionRef: string
  amount: number
}

export function SePayDialog({
  open,
  onOpenChange,
  registration,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: {
    id: number
    registrationReference: string
    className?: string
    amount?: number
  } | null
}) {
  const [checkout, setCheckout] = useState<SePayCheckout | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const autoSubmittedRef = useRef(false)
  const queryClient = useQueryClient()

  // Reset state when dialog closes or registration changes.
  useEffect(() => {
    if (!open) {
      setCheckout(null)
      setLoading(false)
      setError(null)
      setRedirecting(false)
      autoSubmittedRef.current = false
    }
  }, [open])

  // Load signed checkout when the dialog opens for a registration.
  useEffect(() => {
    if (!open || !registration?.id) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setCheckout(null)
    setRedirecting(false)
    autoSubmittedRef.current = false

    paymentService
      .createSePayPayment(registration.id)
      .then((data) => {
        if (!cancelled) setCheckout(data)
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not start SePay payment.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, registration?.id])

  const submitToSePay = (data: SePayCheckout) => {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = data.checkoutUrl
    for (const [name, value] of Object.entries(data.formFields)) {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = name
      input.value = value
      form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    queryClient.invalidateQueries({ queryKey: ["student-payments"] })
    queryClient.invalidateQueries({ queryKey: ["student-registrations"] })
  }

  // Auto-submit the hidden POST form once checkout is ready.
  useEffect(() => {
    if (!checkout || autoSubmittedRef.current) return
    autoSubmittedRef.current = true
    setRedirecting(true)
    submitToSePay(checkout)
  }, [checkout])

  const amount = checkout?.amount ?? registration?.amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <DialogTitle>Pay tuition — SePay (bank transfer)</DialogTitle>
          </div>
          <DialogDescription>
            {redirecting ? (
              <>Redirecting to SePay…</>
            ) : (
              <>
                You will be redirected to SePay to complete a bank transfer of{" "}
                <span className="font-semibold text-emerald-600">{formatVnd(amount)}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : redirecting || loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {redirecting ? "Redirecting to SePay…" : "Preparing checkout…"}
          </div>
        ) : checkout ? (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gateway</span>
              <span className="font-medium">SePay · Bank transfer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono text-primary">
                {checkout.formFields.order_invoice_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-emerald-600">
                {formatVnd(Number(checkout.formFields.order_amount))}
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {checkout && (
            <Button
              onClick={() => {
                setRedirecting(true)
                submitToSePay(checkout)
              }}
              disabled={loading}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open SePay
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SePayDialog
