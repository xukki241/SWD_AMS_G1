"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseService } from "@/services/course.service"
import { profileService } from "@/services/profile.service"
import { enrollmentService } from "@/services/enrollment.service"
import { useAuthStore } from "@/stores/authStore"
import { roleFlags } from "@/lib/roles"
import { formatPrice } from "@/components/courses/courseFormat"
import { Button } from "@/components/ui/button"

export default function EnrollmentConfirmPage() {
  const id = Number(useParams<{ courseId: string }>().courseId)
  const router = useRouter()
  const qc = useQueryClient()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const roles = useAuthStore((s) => s.user?.roles || [])
  const { canEnroll } = roleFlags(roles)

  useEffect(() => {
    if (!canEnroll) router.replace("/catalog")
  }, [canEnroll, router])

  const { data: course, isLoading } = useQuery({
    queryKey: ["public-course", id],
    queryFn: () => courseService.getPublicById(id),
    enabled: canEnroll && Number.isFinite(id),
  })
  const { data: student } = useQuery({
    queryKey: ["my-profile"],
    queryFn: profileService.get,
    enabled: canEnroll,
  })
  const confirm = useMutation({
    mutationFn: () => enrollmentService.enroll(id),
    onSuccess: async (e) => {
      await qc.invalidateQueries({ queryKey: ["my-enrollments"] })
      router.push(e.status === "PENDING_PAYMENT" ? `/catalog/payment/${e.id}` : `/courses/${id}`)
    },
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Không tạo được đăng ký."),
  })

  if (!canEnroll) return null
  if (isLoading) return <main className="p-6">Đang tải thông tin…</main>
  if (!course) return <main className="p-6">Không tìm thấy khóa học.</main>

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Xác nhận đăng ký</h1>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="font-semibold">Thông tin sinh viên</h2>
        <p>
          {student?.fullName || "—"} · {student?.email || "—"}
        </p>
        <h2 className="border-t pt-4 font-semibold">Khóa học</h2>
        <p>
          {course.title} ({course.code})
        </p>
        <p className="text-sm text-muted-foreground">Giảng viên: {course.instructorName}</p>
        <div className="flex justify-between border-t pt-4">
          <span>Học phí</span>
          <strong>{formatPrice(course.price, course.isFree)}</strong>
        </div>
        <p className="text-xs text-muted-foreground">
          Phí xử lý và giảm giá hiện chưa được cấu hình trong dự án; tổng thanh toán bằng học phí khóa học.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          Tôi xác nhận thông tin và đồng ý với điều khoản đăng ký/thanh toán.
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button disabled={!accepted || confirm.isPending} onClick={() => confirm.mutate()}>
            Xác nhận & tiếp tục
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
        </div>
      </section>
    </main>
  )
}
