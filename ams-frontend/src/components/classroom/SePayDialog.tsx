"use client"

import React, { useEffect, useState } from "react"
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
import { Loader2, Wallet, CheckCircle2, Copy, Check, QrCode } from "lucide-react"
import { formatVnd } from "@/components/classroom/format"
import { useToast } from "@/lib/use-toast"

export type SePayCheckout = {
  checkoutUrl: string
  formFields: Record<string, string>
  transactionRef: string
  amount: number
  qrUrl?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
}

export function SePayDialog({
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
  const [checkout, setCheckout] = useState<SePayCheckout | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Reset state when dialog closes or enrollment changes.
  useEffect(() => {
    if (!open) {
      setCheckout(null)
      setLoading(false)
      setError(null)
      setIsPaid(false)
      setCopiedKey(null)
    }
  }, [open])

  // Load checkout info when dialog opens.
  useEffect(() => {
    if (!open || !enrollment?.id) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setCheckout(null)
    setIsPaid(false)

    paymentService
      .createSePayPayment(enrollment.id)
      .then((data) => {
        if (!cancelled) setCheckout(data)
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Không thể tạo mã thanh toán SePay.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, enrollment?.id])

  // Poll transaction status every 2.5 seconds.
  useEffect(() => {
    if (!open || !checkout?.transactionRef || isPaid) return

    const interval = setInterval(async () => {
      try {
        const res = await paymentService.checkPaymentStatus(checkout.transactionRef)
        if (res.success) {
          setIsPaid(true)
          queryClient.invalidateQueries({ queryKey: ["student-enrollments"] })
          queryClient.invalidateQueries({ queryKey: ["student-payments"] })
          queryClient.invalidateQueries({ queryKey: ["sidebar-my-enrollments"] })
          queryClient.invalidateQueries({ queryKey: ["student-dashboard"] })
          toast({
            title: "Thanh toán thành công!",
            description: "Khóa học của bạn đã được kích hoạt.",
            variant: "success",
          })
        }
      } catch {
        // silent polling ignore
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [open, checkout?.transactionRef, isPaid, queryClient, toast])

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast({
      title: "Đã sao chép",
      description: `${label}: ${text}`,
    })
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev))
    }, 2000)
  }

  const manualCheck = async () => {
    if (!checkout?.transactionRef) return
    try {
      const res = await paymentService.checkPaymentStatus(checkout.transactionRef)
      if (res.success) {
        setIsPaid(true)
        queryClient.invalidateQueries({ queryKey: ["student-enrollments"] })
        queryClient.invalidateQueries({ queryKey: ["student-payments"] })
        queryClient.invalidateQueries({ queryKey: ["sidebar-my-enrollments"] })
        queryClient.invalidateQueries({ queryKey: ["student-dashboard"] })
        toast({
          title: "Thanh toán thành công!",
          description: "Khóa học của bạn đã được kích hoạt.",
          variant: "success",
        })
      } else {
        toast({
          title: "Chưa ghi nhận thanh toán",
          description: "Giao dịch đang chờ ngân hàng xác nhận. Vui lòng thử lại sau vài giây.",
        })
      }
    } catch {
      toast({
        title: "Lỗi kiểm tra",
        description: "Chưa thể kiểm tra trạng thái lúc này.",
        variant: "destructive",
      })
    }
  }

  const amount = checkout?.amount ?? enrollment?.amount ?? 0
  const bankAccount = checkout?.accountNumber || "VQRQANNCD2590"
  const bankName = checkout?.bankName || "MBBank"
  const accountName = checkout?.accountName || "DOAN KHANH DUONG"
  const refCode = checkout?.transactionRef || ""
  const qrImage =
    checkout?.qrUrl ||
    `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${refCode}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <DialogTitle>Thanh toán học phí qua SePay (VietQR)</DialogTitle>
          </div>
          <DialogDescription>
            {isPaid
              ? "Giao dịch đã hoàn tất thành công."
              : "Quét mã VietQR bằng app ngân hàng để kích hoạt tự động."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Đang tạo mã QR thanh toán...</span>
          </div>
        ) : isPaid ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">Thanh toán thành công!</h3>
              <p className="text-sm text-muted-foreground">
                Khóa học <span className="font-medium text-foreground">{enrollment?.courseTitle}</span> đã được kích hoạt.
              </p>
            </div>
          </div>
        ) : checkout ? (
          <div className="space-y-3">
            {/* VietQR Code */}
            <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-3 shadow-sm">
              <img
                src={qrImage}
                alt="VietQR MBBank"
                className="h-56 w-56 object-contain rounded-lg"
              />
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>Đang chờ chuyển khoản tự động...</span>
              </div>
            </div>

            {/* Transfer details */}
            <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-semibold text-foreground">{bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-medium text-foreground">{accountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tài khoản VA:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-foreground">{bankAccount}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankAccount, "acc", "Số tài khoản")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Sao chép"
                  >
                    {copiedKey === "acc" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tiền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-600">{formatVnd(amount)}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(amount), "amount", "Số tiền")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Sao chép"
                  >
                    {copiedKey === "amount" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded bg-amber-500/10 p-1.5 text-amber-800">
                <span>Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold">{refCode}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(refCode, "ref", "Nội dung CK")}
                    className="text-amber-800 hover:text-amber-950"
                    title="Sao chép"
                  >
                    {copiedKey === "ref" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              ⚠️ Vui lòng giữ nguyên <span className="font-semibold text-foreground">nội dung chuyển khoản</span> để hệ thống nhận diện và kích hoạt tự động.
            </p>
          </div>
        ) : null}

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isPaid ? "Đóng" : "Hủy"}
          </Button>
          {!isPaid && checkout && (
            <Button size="sm" onClick={manualCheck}>
              Tôi đã chuyển khoản
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
