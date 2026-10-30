"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { StatSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { formatVnd } from "@/components/classroom/format"
import {
  PublicClass,
} from "@/components/classroom/classroomTypes"
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Users,
  CalendarClock,
  Wallet,
  KeyRound,
  Sparkles,
} from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const { data: catalog, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-classes"],
    queryFn: async () => (await api.get("/subject-classes/public")).data as PublicClass[],
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      const roles = user.roles || []
      if (roles.includes("ROLE_ADMIN")) router.replace("/admin")
      else if (roles.includes("ROLE_EXPERT")) router.replace("/expert")
      else if (roles.includes("ROLE_TEACHER")) router.replace("/teacher")
      else router.replace("/student")
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-foreground">AMS</h1>
              <p className="text-[11px] text-muted-foreground">Assignment Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your classroom, organized.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find a class with a join code, follow the stream, submit your work, pay
            tuition — all in one place, Google-Classroom style.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Create a student account
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> 6-character join codes</span>
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> VNPay & VietQR sandbox</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Stream, assignments & people</span>
          </div>
        </div>
      </section>

      {/* Public catalog */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Open classes</h2>
            <p className="text-sm text-muted-foreground">
              Currently published class sections. Log in as a student to join.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{catalog?.length || 0} classes</span>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : catalog && catalog.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.className}</h3>
                    <p className="text-xs text-muted-foreground">
                      {c.subjectCode} · {c.subjectName}
                    </p>
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {c.joinCode}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {c.term || "Term"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {c.enrolledCount}
                      {c.capacity > 0 ? ` / ${c.capacity}` : ""} enrolled
                    </div>
                    <span className={`text-sm font-semibold ${Number(c.registrationFee) === 0 ? "text-emerald-600" : "text-foreground"}`}>
                      {formatVnd(c.registrationFee)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No open classes yet"
            description="Teachers and experts publish class sections that will appear here."
          />
        )}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        AMS POC · SWD392 Group 1 · Demo only — payments run on sandbox providers
      </footer>
    </div>
  )
}
