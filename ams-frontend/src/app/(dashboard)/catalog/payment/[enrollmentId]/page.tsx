"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { enrollmentService } from "@/services/enrollment.service"
import { Button } from "@/components/ui/button"
import { SePayDialog } from "@/components/classroom/SePayDialog"

export default function EnrollmentPaymentPage() {
  const id = Number(useParams<{ enrollmentId: string }>().enrollmentId)
  const router = useRouter()
  const qc = useQueryClient()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [showSepay, setShowSepay] = useState(false)

  const { data: e, isLoading } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () =>
      enrollmentService.getMyEnrollments().then((list) => list.find((x) => x.id === id) || null),
  })

  const cancel = useMutation({
    mutationFn: () => enrollmentService.cancel(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-enrollments"] })
      router.push("/catalog")
    },
  })

  if (isLoading) return <main className="p-6">Đang tải đăng ký…</main>
  if (!e) return <main className="p-6">Không tìm thấy đăng ký này.</main>
  if (e.status !== "PENDING_PAYMENT") {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">
          Đăng ký {e.status === "ACTIVE" ? "đã xác nhận" : "đã đóng"}
        </h1>
        <p>{e.courseTitle}</p>
        <Button onClick={() => router.push(`/courses/${e.courseId}`)}>Vào khóa học</Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Xác nhận đăng ký & thanh toán</h1>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <p className="text-sm text-muted-foreground">Khóa học</p>
          <p className="font-semibold">
            {e.courseTitle} ({e.courseCode})
          </p>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span>Học phí</span>
          <strong>{new Intl.NumberFormat("vi-VN").format(e.amount)} VND</strong>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(x) => setAccepted(x.target.checked)}
            className="mt-1"
          />
          Tôi xác nhận thông tin đăng ký và đồng ý với điều khoản thanh toán.
        </label>
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          Cổng thanh toán: <strong>SePay</strong> (chuyển khoản)
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!accepted}
            onClick={() => {
              setError("")
              setShowSepay(true)
            }}
          >
            Thanh toán bằng SePay (VietQR)
          </Button>
          <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            Hủy đăng ký
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Quét mã VietQR trên app ngân hàng. Quyền học được tự động kích hoạt sau khi chuyển khoản thành công.
        </p>
      </section>

      {showSepay && e && (
        <SePayDialog
          open={showSepay}
          onOpenChange={(open) => {
            setShowSepay(open)
            if (!open) {
              qc.invalidateQueries({ queryKey: ["enrollment", id] })
              qc.invalidateQueries({ queryKey: ["my-enrollments"] })
            }
          }}
          enrollment={{
            id: e.id,
            registrationReference: e.registrationReference || String(e.id),
            courseTitle: e.courseTitle,
            amount: e.amount,
          }}
        />
      )}
    </main>
  )
}
