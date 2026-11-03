"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { VietQrDialog } from "@/components/classroom/VietQrDialog"
import { SePayDialog } from "@/components/classroom/SePayDialog"
import { PayOSDialog } from "@/components/classroom/PayOSDialog"
import { SubmitDialog } from "@/components/classroom/SubmitDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import {
  formatVnd,
  formatDate,
  formatDateTime,
  avatarColor,
  classInitial,
} from "@/components/classroom/format"
import { enrollmentService } from "@/services/enrollment.service"
import { paymentService } from "@/services/payment.service"
import { assignmentService } from "@/services/assignment.service"
import type {
  CourseEnrollment,
  PaymentTransaction,
  AssignmentOverviewItem,
  StudentDashboard,
} from "@/types"
import {
  Clock,
  CreditCard,
  ExternalLink,
  Wallet,
  Loader2,
  QrCode,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"

export default function StudentDashboardPage() {
  const { toast } = useToast()

  const [vnPayBusyId, setVnPayBusyId] = useState<number | null>(null)
  const [qrEnrollment, setQrEnrollment] = useState<CourseEnrollment | null>(null)
  const [sepayEnrollment, setSepayEnrollment] = useState<CourseEnrollment | null>(null)
  const [payosEnrollment, setPayosEnrollment] = useState<CourseEnrollment | null>(null)
  const [submitItem, setSubmitItem] = useState<AssignmentOverviewItem | null>(null)

  const { data: stats } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => (await api.get("/dashboard/student")).data as StudentDashboard,
  })

  const {
    data: enrollments,
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => enrollmentService.getMyEnrollments(),
  })

  const {
    data: payments,
    isLoading: payLoading,
    isError: payError,
    refetch: refetchPay,
  } = useQuery({
    queryKey: ["student-payments"],
    queryFn: () => paymentService.getMyPayments(),
  })

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["student-work"],
    queryFn: () => assignmentService.getMyOverview(),
  })

  const pendingEnrollments = useMemo(
    () => (enrollments || []).filter((e) => e.status === "PENDING_PAYMENT"),
    [enrollments]
  )

  const pendingWork = useMemo(
    () =>
      [...(overview || [])]
        .filter((o) => o.workState !== "GRADED")
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [overview]
  )

  const kpis = [
    { label: "Enrolled courses", value: stats?.totalEnrollments ?? 0, icon: BookOpen },
    { label: "Active courses", value: stats?.activeCourses ?? 0, icon: GraduationCap },
    { label: "Submitted", value: stats?.submittedAssignments ?? 0, icon: CheckCircle2 },
    {
      label: "Average score",
      value:
        stats?.averageScore !== null && stats?.averageScore !== undefined
          ? Number(stats.averageScore).toFixed(1)
          : "—",
      icon: TrendingUp,
    },
  ]

  const payVnPay = async (enrollment: CourseEnrollment) => {
    setVnPayBusyId(enrollment.id)
    try {
      const res = await paymentService.payVnPay(enrollment.id)
      window.location.href = res.paymentUrl
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
          <h2 className="text-2xl font-semibold tracking-tight">My learning</h2>
          <p className="text-sm text-muted-foreground">
            Your courses, upcoming work and payments in one place.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-gc">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-foreground">
                  {k.value}
                </div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* My courses — enrollment cards */}
      <section id="classes" className="scroll-mt-20">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-medium tracking-tight text-foreground">My Courses</h3>
            <p className="text-sm text-muted-foreground">
              Courses you are enrolled in. Open one to learn and submit work.
            </p>
          </div>
        </div>

        {enrollmentsError ? (
          <ErrorState onRetry={() => refetchEnrollments()} />
        ) : enrollmentsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enrollments.map((e) => {
              const banner = e.courseThumbnailUrl
              return (
                <Link
                  key={e.id}
                  href={`/courses/${e.courseId}`}
                  className="group overflow-hidden rounded-xl border bg-card shadow-gc transition-shadow hover:shadow-gc-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner}
                      alt={e.courseTitle}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-28 w-full items-center justify-center ${avatarColor(
                        e.courseTitle
                      )}`}
                    >
                      <span className="text-4xl font-bold text-white">
                        {classInitial(e.courseTitle)}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 font-medium text-foreground group-hover:underline">
                        {e.courseTitle}
                      </h4>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{e.courseCode}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-medium text-foreground">
                        {formatVnd(Number(e.amount))}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {e.registrationReference}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No courses yet"
            description="Browse the catalog and enroll in a course to get started."
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="work" className="scroll-mt-20">
          <Card className="shadow-gc">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-[hsl(var(--success))]" /> Pending work
              </CardTitle>
              <CardDescription>Assignments waiting for your submission</CardDescription>
            </CardHeader>
            <CardContent>
              {overviewError ? (
                <ErrorState onRetry={() => refetchOverview()} />
              ) : overviewLoading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : pendingWork.length > 0 ? (
                <ul className="space-y-2">
                  {pendingWork.slice(0, 8).map((o) => {
                    const pastDue = new Date(o.dueAt).getTime() < Date.now()
                    return (
                      <li
                        key={`${o.enrollmentId}-${o.assignmentId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{o.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {o.courseCode} · due {formatDate(o.dueAt)}
                            {pastDue && (
                              <span className="ml-1 text-amber-600">(overdue)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={o.workState} />
                          <Link
                            href={`/courses/${o.courseId}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Open
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setSubmitItem(o)}
                          >
                            Submit
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="Nothing pending"
                  description="All caught up — new assignments will appear here."
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section id="payments" className="scroll-mt-20">
          <Card className="shadow-gc">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-[hsl(var(--success))]" /> Tuition &amp; payments
              </CardTitle>
              <CardDescription>
                SePay &amp; PayOS (bank transfer / QR), VNPay / VietQR sandbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollmentsError || payError ? (
                <ErrorState
                  onRetry={() => {
                    refetchEnrollments()
                    refetchPay()
                  }}
                />
              ) : enrollmentsLoading || payLoading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : (
                <>
                  {pendingEnrollments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Awaiting payment</p>
                      {pendingEnrollments.map((e) => (
                        <div
                          key={e.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-amber-500/5 p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {e.courseTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Ref: {e.registrationReference} ·{" "}
                              <span className="font-medium">{formatVnd(Number(e.amount))}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => setSepayEnrollment(e)}
                            >
                              <Wallet className="h-3.5 w-3.5 mr-1" />
                              SePay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setPayosEnrollment(e)}
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              PayOS
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => payVnPay(e)}
                              disabled={vnPayBusyId === e.id}
                            >
                              {vnPayBusyId === e.id ? (
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
                              onClick={() => setQrEnrollment(e)}
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
                      Payment history
                    </p>
                    {payments && payments.length > 0 ? (
                      <ul className="space-y-1.5">
                        {payments.map((p: PaymentTransaction) => (
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
                      <p className="text-xs text-muted-foreground">No transactions yet.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {qrEnrollment && (
        <VietQrDialog
          open={!!qrEnrollment}
          onOpenChange={(o) => !o && setQrEnrollment(null)}
          enrollment={qrEnrollment}
        />
      )}

      {sepayEnrollment && (
        <SePayDialog
          open={!!sepayEnrollment}
          onOpenChange={(o) => !o && setSepayEnrollment(null)}
          enrollment={sepayEnrollment}
        />
      )}

      {payosEnrollment && (
        <PayOSDialog
          open={!!payosEnrollment}
          onOpenChange={(o) => !o && setPayosEnrollment(null)}
          enrollment={payosEnrollment}
        />
      )}

      {submitItem && (
        <SubmitDialog
          open={!!submitItem}
          onClose={() => setSubmitItem(null)}
          onSubmitted={() => {
            refetchOverview()
          }}
          enrollmentId={submitItem.enrollmentId}
          assignmentId={submitItem.assignmentId}
        />
      )}
    </div>
  )
}
