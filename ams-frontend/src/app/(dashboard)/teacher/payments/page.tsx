"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowUpRight, Search, Wallet } from "lucide-react"
import { paymentService } from "@/services/payment.service"
import { useI18n } from "@/i18n"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { formatVnd, formatDateTime } from "@/components/classroom/format"
import type { TeacherPayment } from "@/types"

type Tab = "RECEIVED" | "OUTGOING" | "ALL"

export default function TeacherPaymentsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>("RECEIVED")
  const [q, setQ] = useState("")

  const { data: payments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["teacher-payments"],
    queryFn: () => paymentService.getTeacherPayments(),
  })

  const received = useMemo(
    () => payments.filter((p) => p.direction === "RECEIVED" && p.transactionStatus === "SUCCESS"),
    [payments]
  )
  const outgoing = useMemo(
    () => payments.filter((p) => p.direction === "OUTGOING" || p.transactionStatus === "REFUNDED"),
    [payments]
  )
  const receivedTotal = received.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const outgoingTotal = outgoing.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const visible = useMemo(() => {
    const base =
      tab === "RECEIVED"
        ? received
        : tab === "OUTGOING"
          ? outgoing
          : payments
    const kw = q.trim().toLowerCase()
    if (!kw) return base
    return base.filter((p) =>
      `${p.courseTitle} ${p.courseCode} ${p.studentName} ${p.studentUsername} ${p.provider} ${p.providerReference || ""}`
        .toLowerCase()
        .includes(kw)
    )
  }, [tab, received, outgoing, payments, q])

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("dashboard.teacher.paymentsPage.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.teacher.paymentsPage.subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDownLeft className="h-4 w-4 text-[hsl(var(--success))]" />
            {t("dashboard.teacher.paymentsPage.received")}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatVnd(receivedTotal)}</p>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.teacher.paymentsPage.count", { count: received.length })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-destructive" />
            {t("dashboard.teacher.paymentsPage.outgoing")}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatVnd(outgoingTotal)}</p>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.teacher.paymentsPage.count", { count: outgoing.length })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
        <div className="flex flex-wrap gap-2">
          {(["RECEIVED", "OUTGOING", "ALL"] as Tab[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTab(key)}
            >
              {key === "RECEIVED"
                ? t("dashboard.teacher.paymentsPage.tabReceived")
                : key === "OUTGOING"
                  ? t("dashboard.teacher.paymentsPage.tabOutgoing")
                  : t("dashboard.teacher.paymentsPage.tabAll")}
            </Button>
          ))}
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("dashboard.teacher.paymentsPage.search")}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.teacher.paymentsPage.loading")}</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("dashboard.teacher.paymentsPage.error")}{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            {t("common.actions.retry")}
          </button>
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Wallet className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("dashboard.teacher.paymentsPage.empty")}</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {visible.map((p: TeacherPayment) => (
            <article
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{p.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {p.courseCode} · {p.studentName} (@{p.studentUsername})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.provider}
                  {p.providerReference ? ` · ${p.providerReference}` : ""} ·{" "}
                  {formatDateTime(p.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={
                    p.direction === "OUTGOING" || p.transactionStatus === "REFUNDED"
                      ? "font-semibold text-destructive"
                      : "font-semibold text-[hsl(var(--success))]"
                  }
                >
                  {p.direction === "OUTGOING" || p.transactionStatus === "REFUNDED" ? "−" : "+"}
                  {formatVnd(Number(p.amount))}
                </span>
                <StatusBadge status={p.transactionStatus} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
