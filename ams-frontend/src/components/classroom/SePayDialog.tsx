"use client"

import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
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
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const load = async () => {
    if (!registration) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<SePayCheckout>(`/payment/create-sepay/${registration.id}`)
      setCheckout(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not start SePay payment.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch the signed checkout form whenever the dialog opens for a registration.
  const openForId = registration?.id ?? null
  if (open && openForId && !checkout && !loading && !error) {
    void load()
  }

  const submit = () => {
    if (!checkout) return
    // Build + submit the form in-memory (no network call — SePay handles it).
    const form = document.createElement("form")
    form.method = "POST"
    form.action = checkout.checkoutUrl
    for (const [name, value] of Object.entries(checkout.formFields)) {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = name
      input.value = value
      form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    onOpenChange(false)
    queryClient.invalidateQueries({ queryKey: ["student-payments"] })
    queryClient.invalidateQueries({ queryKey: ["student-registrations"] })
  }

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
            You will be redirected to SePay to complete a bank transfer of{" "}
            <span className="font-semibold text-emerald-600">{formatVnd(amount)}</span>.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
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
          <Button onClick={submit} disabled={!checkout || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-1.5" />
            )}
            Open SePay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SePayDialog
