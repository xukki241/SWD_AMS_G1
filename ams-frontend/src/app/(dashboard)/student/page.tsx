"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import {
  ClassCard,
} from "@/components/classroom/ClassCard"
import { JoinClassDialog } from "@/components/classroom/JoinClassDialog"
import { VietQrDialog } from "@/components/classroom/VietQrDialog"
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
  FolderKanban,
  GraduationCap,
  Clock,
  CreditCard,
  ExternalLink,
  Wallet,
  Loader2,
  QrCode,
  CheckCircle2,
} from "lucide-react"

export default function StudentDashboardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [vnPayBusyId, setVnPayBusyId] = useState<number | null>(null)
  const [qrRegistration, setQrRegistration] = useState<Registration | null>(null)

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => (await api.get("/dashboard/student")).data,
  })

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
          <h2 className="text-3xl font-bold tracking-tight">Hi, welcome back 👋</h2>
          <p className="text-muted-foreground">
            Join classes, track deadlines, and manage your tuition in one place.
          </p>
        </div>
        <div id="find" className="flex gap-2">
          <JoinClassDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeClasses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRegistrations} total enrollments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <GraduationCap className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submittedAssignments}</div>
                <p className="text-xs text-muted-foreground">works handed in</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Graded</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gradedAssignments}</div>
                <p className="text-xs text-muted-foreground">with final scores</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Wallet className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageScore != null ? Number(stats.averageScore).toFixed(1) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">across graded work</p>
              </CardContent>
            </Card>
          </>
        ) : statsError ? (
          <ErrorState onRetry={() => refetchStats()} />
        ) : (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        )}
      </div>

      {/* My classes */}
      <section id="classes">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight">My classes</h3>
            <p className="text-sm text-muted-foreground">
              Open a class to see its stream, assignments, and people.
            </p>
          </div>
        </div>
        {classesError ? (
          <ErrorState onRetry={() => refetchClasses()} />
        ) : classesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : myClasses && myClasses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClasses.map((c) => (
              <ClassCard key={c.classId ?? c.id} data={c} showMyStatus />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            description="Use “Join a class” to enroll with a 6-character join code."
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming deadlines */}
        <section id="work">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Upcoming deadlines
              </CardTitle>
              <CardDescription>Your classwork sorted by due date</CardDescription>
            </CardHeader>
            <CardContent>
              {overviewError ? (
                <ErrorState onRetry={() => refetchOverview()} />
              ) : overviewLoading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : upcoming.length > 0 ? (
                <ul className="space-y-2">
                  {upcoming.map((o) => {
                    const pastDue = new Date(o.dueAt).getTime() < Date.now()
                    return (
                      <li
                        key={`${o.classId}-${o.assignmentId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{o.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {o.className} · due {formatDate(o.dueAt)}
                            {pastDue && o.workState !== "GRADED" && (
                              <span className="ml-1 text-amber-600">(past due)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={o.workState} />
                          <Link
                            href={`/classes/${o.classId}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Open
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="No pending work"
                  description="Deadlines will appear here once your teachers assign classwork."
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Payments */}
        <section id="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Tuition & payments
              </CardTitle>
              <CardDescription>
                Pay pending enrollments (sandbox — no real money moves)
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
                      <p className="text-sm font-semibold text-foreground">Awaiting payment</p>
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
                              onClick={() => payVnPay(reg)}
                              disabled={vnPayBusyId === reg.id}
                            >
                              {vnPayBusyId === reg.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              )}
                              Pay via VNPay (Sandbox)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setQrRegistration(reg)}
                            >
                              <QrCode className="h-3.5 w-3.5 mr-1" />
                              VietQR (Sandbox)
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
                      <p className="text-xs text-muted-foreground">No payments yet.</p>
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
    </div>
  )
}
