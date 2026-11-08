"use client"

import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { paymentService } from "@/services/payment.service"
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
import { Loader2, Info } from "lucide-react"
import { formatVnd } from "@/components/classroom/format"
import { useI18n } from "@/i18n"

// Sandbox VietQR confirmation: no real money moves.
export function VietQrDialog({
  open,
  onOpenChange,
  enrollment,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment: { id: number; registrationReference: string; courseTitle?: string; amount?: number } | null
}) {
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const amount = enrollment?.amount
  const qrSrc = `https://img.vietqr.io/image/mbbank-0842561752-compact2.png?amount=${
    amount ?? 50000
  }&addInfo=AMS%20${enrollment?.registrationReference ?? ""}&accountName=NGUYEN%20XUAN%20KIEN`

  const confirm = async () => {
    if (!enrollment) return
    setConfirming(true)
    try {
      await paymentService.confirmVietQr(enrollment.id)
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["student-payments"] })
      queryClient.invalidateQueries({ queryKey: ["sidebar-my-enrollments"] })
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] })
      toast({
        title: t("payments.vietqr.confirmedToast"),
        description: t("payments.vietqr.confirmedDescription"),
        variant: "success",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: t("payments.vietqr.failedToast"),
        description: err.response?.data?.message || t("payments.vietqr.failedFallback"),
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
            <DialogTitle>{t("payments.vietqr.title")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("payments.vietqr.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            <Info className="h-4 w-4 shrink-0" />
            {t("payments.vietqr.sandboxNote")}
          </div>

          <div className="flex justify-center rounded-xl border bg-white p-2">
            <img src={qrSrc} alt={t("payments.vietqr.qrAlt")} className="h-52 w-52 rounded-lg" />
          </div>

          <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payments.vietqr.bank")}</span>
              <span className="font-medium">MBBank (Military)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payments.vietqr.account")}</span>
              <span className="font-mono font-medium">0842561752</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payments.vietqr.holder")}</span>
              <span className="font-medium">NGUYEN XUAN KIEN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payments.dialog.amount")}</span>
              <span className="font-semibold text-emerald-600">{formatVnd(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payments.vietqr.transferNote")}</span>
              <span className="font-mono text-primary">
                AMS {enrollment?.registrationReference}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.close")}
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={confirm}
            disabled={confirming}
          >
            {confirming ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : t("payments.vietqr.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default VietQrDialog
