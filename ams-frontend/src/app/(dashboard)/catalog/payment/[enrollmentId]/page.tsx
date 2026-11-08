"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { enrollmentService } from "@/services/enrollment.service"
import { paymentService } from "@/services/payment.service"
import { Button } from "@/components/ui/button"

export default function EnrollmentPaymentPage() {
  const id = Number(useParams<{ enrollmentId: string }>().enrollmentId)
  const router = useRouter()
  const qc = useQueryClient()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")

  const { data: e, isLoading } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () =>
      enrollmentService.getMyEnrollments().then((list) => list.find((x) => x.id === id) || null),
  })

  const checkout = useMutation({
    mutationFn: () => paymentService.createSePayPayment(id),
    onSuccess: (result) => {
      const form = document.createElement("form")
      form.method = "POST"
      form.action = result.checkoutUrl
      for (const [name, value] of Object.entries(result.formFields)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = name
        input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
    },
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : "Không tạo được yêu cầu thanh toán SePay."),
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
            disabled={!accepted || checkout.isPending}
            onClick={() => {
              setError("")
              checkout.mutate()
            }}
          >
            {checkout.isPending ? "Đang chuyển đến SePay…" : "Thanh toán bằng SePay"}
          </Button>
          <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            Hủy đăng ký
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Giữ trang SePay mở đến khi giao dịch được xác nhận. Quyền học được mở sau IPN thành công.
        </p>
      </section>
    </main>
  )
}
