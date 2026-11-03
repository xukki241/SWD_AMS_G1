"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { ClassCard } from "@/components/classroom/ClassCard"
import { JoinClassDialog } from "@/components/classroom/JoinClassDialog"
import { VietQrDialog } from "@/components/classroom/VietQrDialog"
import { SePayDialog } from "@/components/classroom/SePayDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import {
  formatVnd,
  formatDate,
  formatDateTime,
} from "@/components/classroom/format"
import {
  MyClass,
  Registration,
  PaymentTransaction,
  AssignmentOverviewItem,
} from "@/components/classroom/classroomTypes"
import {
  Clock,
  CreditCard,
  ExternalLink,
  Wallet,
  Loader2,
  QrCode,
  Plus,
} from "lucide-react"

export default function StudentDashboardPage() {
  const { toast } = useToast()

  const [vnPayBusyId, setVnPayBusyId] = useState<number | null>(null)
  const [qrRegistration, setQrRegistration] = useState<Registration | null>(null)
  const [sepayRegistration, setSepayRegistration] = useState<Registration | null>(null)

  const { data: myClasses, isLoading: classesLoading, isError: classesError, refetch: refetchClasses } = useQuery({
    queryKey: ["student-my-classes"],
    queryFn: async () => (await api.get("/subject-classes/my")).data as MyClass[],
  })

  const { data: registrations, isLoading: regsLoading, isError: regsError, refetch: refetchRegs } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: async () => (await api.get("/registrations/my")).data as Registration[],
  })

  const { data: payments, isLoading: payLoading, isError: payError, refetch: refetchPay } = useQuery({
    queryKey: ["student-payments"],
    queryFn: async () => (await api.get("/payment/my")).data as PaymentTransaction[],
  })

  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useQuery({
    queryKey: ["student-assignments-overview"],
    queryFn: async () =>
      (await api.get("/assignments/overview")).data as AssignmentOverviewItem[],
  })

  const pendingRegs = useMemo(
    () => (registrations || []).filter((r) => r.status === "PENDING_PAYMENT"),
    [registrations]
  )

  const upcoming = useMemo(
    () =>
      [...(overview || [])]
        .filter((o) => new Date(o.dueAt).getTime() >= Date.now() - 365 * 24 * 3600 * 1000)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [overview]
  )

  const upcomingByClass = useMemo(() => {
    const map = new Map<number, AssignmentOverviewItem>()
    for (const o of upcoming) {
      if (!map.has(o.classId) && o.workState !== "GRADED") {
        map.set(o.classId, o)
      }
    }
    return map
  }, [upcoming])

  const payVnPay = async (reg: Registration) => {
    setVnPayBusyId(reg.id)
    try {
      const res = await api.post(`/payment/create/${reg.id}`)
      window.location.href = res.data.paymentUrl
    } catch (err: any) {
      toast({
        title: "Could not start payment",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setVnPayBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Lớp học</h2>
          <p className="text-sm text-muted-foreground">
            Mở lớp để xem bảng tin, bài tập và mọi người.
          </p>
        </div>
        <div id="find" className="flex gap-2">
          <JoinClassDialog defaultLabel="Tham gia lớp học" />
        </div>
      </div>

      {/* Classes grid — first viewport, GC composition */}
      <section id="classes">
        {classesError ? (
          <ErrorState onRetry={() => refetchClasses()} />
        ) : classesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(myClasses || []).map((c) => {
              const id = c.classId ?? c.id
              const next = upcomingByClass.get(id)
              return (
                <ClassCard
                  key={id}
                  data={c}
                  showMyStatus
                  upcomingTitle={next?.title}
                  upcomingDueAt={next?.dueAt}
                />
              )
            })}

            {/* Dashed join tile */}
            <JoinClassDialog
              defaultLabel="Tham gia lớp học mới"
              trigger={
                <button
                  type="button"
                  className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 p-6 text-muted-foreground transition-colors hover:border-[hsl(var(--success))] hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-current">
                    <Plus className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium">Tham gia lớp học mới</span>
                  <span className="text-xs text-muted-foreground">Nhập mã lớp 6 ký tự</span>
                </button>
              }
            />
          </div>
        )}

        {!classesLoading && !classesError && (!myClasses || myClasses.length === 0) && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Chưa có lớp — dùng ô &ldquo;Tham gia lớp học mới&rdquo; để ghi danh.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="work">
          <Card className="shadow-gc">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-[hsl(var(--success))]" /> Sắp đến hạn
              </CardTitle>
              <CardDescription>Bài tập sắp tới theo hạn nộp</CardDescription>
            </CardHeader>
            <CardContent>
              {overviewError ? (
                <ErrorState onRetry={() => refetchOverview()} />
              ) : overviewLoading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : upcoming.length > 0 ? (
                <ul className="space-y-2">
                  {upcoming.slice(0, 8).map((o) => {
                    const pastDue = new Date(o.dueAt).getTime() < Date.now()
                    return (
                      <li
                        key={`${o.classId}-${o.assignmentId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{o.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {o.className} · hạn {formatDate(o.dueAt)}
                            {pastDue && o.workState !== "GRADED" && (
                              <span className="ml-1 text-amber-600">(quá hạn)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={o.workState} />
                          <Link
                            href={`/classes/${o.classId}/assignments/${o.assignmentId}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Mở
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="Không có bài sắp đến hạn"
                  description="Bài tập sẽ hiện ở đây khi giáo viên giao."
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section id="payments">
          <Card className="shadow-gc">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-[hsl(var(--success))]" /> Học phí & thanh toán
              </CardTitle>
              <CardDescription>
                SePay (chuyển khoản), VNPay / VietQR sandbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {regsError || payError ? (
                <ErrorState
                  onRetry={() => {
                    refetchRegs()
                    refetchPay()
                  }}
                />
              ) : regsLoading || payLoading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : (
                <>
                  {pendingRegs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Chờ thanh toán</p>
                      {pendingRegs.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-amber-500/5 p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {reg.className}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Ref: {reg.registrationReference}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => setSepayRegistration(reg)}
                            >
                              <Wallet className="h-3.5 w-3.5 mr-1" />
                              SePay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => payVnPay(reg)}
                              disabled={vnPayBusyId === reg.id}
                            >
                              {vnPayBusyId === reg.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              )}
                              VNPay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setQrRegistration(reg)}
                            >
                              <QrCode className="h-3.5 w-3.5 mr-1" />
                              VietQR
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      Lịch sử thanh toán
                    </p>
                    {payments && payments.length > 0 ? (
                      <ul className="space-y-1.5">
                        {payments.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {p.provider}
                              </span>
                              <span className="truncate text-muted-foreground">
                                {formatDateTime(p.createdAt)}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-medium text-foreground">
                                {formatVnd(Number(p.amount))}
                              </span>
                              <StatusBadge status={p.transactionStatus} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Chưa có giao dịch.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {qrRegistration && (
        <VietQrDialog
          open={!!qrRegistration}
          onOpenChange={(o) => !o && setQrRegistration(null)}
          registration={qrRegistration}
        />
      )}

      {sepayRegistration && (
        <SePayDialog
          open={!!sepayRegistration}
          onOpenChange={(o) => !o && setSepayRegistration(null)}
          registration={sepayRegistration}
        />
      )}
    </div>
  )
}
