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
import { Badge } from "@/components/ui/badge"
import { QrCode, Loader2, Info } from "lucide-react"
import { formatVnd } from "@/components/classroom/format"

// Sandbox VietQR confirmation: no real money moves.
export function VietQrDialog({
  open,
  onOpenChange,
  registration,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: { id: number; registrationReference: string; className?: string; amount?: number } | null
}) {
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const amount = registration?.amount
  const qrSrc = `https://img.vietqr.io/image/tpbank-0842561752-compact2.png?amount=${
    amount ?? 5000000
  }&addInfo=AMS%20${registration?.registrationReference ?? ""}&accountName=NGUYEN%20XUAN%20KIEN`

  const confirm = async () => {
    if (!registration) return
    setConfirming(true)
    try {
      await api.post(`/payment/confirm-vietqr/${registration.id}`)
      queryClient.invalidateQueries({ queryKey: ["student-registrations"] })
      queryClient.invalidateQueries({ queryKey: ["student-payments"] })
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["student-stats"] })
      toast({
        title: "Transfer confirmed (sandbox)",
        description: "Your class enrollment is now active.",
        variant: "success",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Confirmation failed",
        description: err.response?.data?.message || "Could not confirm the transfer.",
        variant: "destructive",
      })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Pay tuition — VietQR (sandbox)</DialogTitle>
          </div>
          <DialogDescription>
            Scan the code with any banking app, then confirm below. This is a demo
            environment: no real money moves.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            <Info className="h-4 w-4 shrink-0" />
            Sandbox mode — confirmations are simulated and no funds are transferred.
          </div>

          <div className="flex justify-center rounded-xl border bg-white p-2">
            <img src={qrSrc} alt="VietQR payment code" className="h-52 w-52 rounded-lg" />
          </div>

          <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">TPBank (Tien Phong)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-mono font-medium">0842561752</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holder</span>
              <span className="font-medium">NGUYEN XUAN KIEN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-emerald-600">{formatVnd(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer note</span>
              <span className="font-mono text-primary">
                AMS {registration?.registrationReference}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={confirm}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : "I have transferred"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default VietQrDialog
