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
import { formatVnd, avatarColor, classInitial } from "@/components/classroom/format"
import { PublicClass } from "@/components/classroom/classroomTypes"
import {
  BookOpen,
  GraduationCap,
  Users,
  CalendarClock,
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
      {/* GC app bar */}
      <nav className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-foreground">AMS</h1>
              <p className="text-[11px] text-muted-foreground">
                Assignment Management System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full shadow-gc hover:shadow-gc-lg">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-gc">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            <span className="text-primary">AMS</span> · your classroom, organized
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find a class with a join code, follow the stream, submit your work, pay
            tuition — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full px-6 shadow-gc hover:shadow-gc-lg"
              >
                Get started
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="ghost" className="rounded-full px-4">
                Create a student account
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            6-character join codes · VNPay &amp; VietQR sandbox · stream,
            classwork &amp; people
          </p>
        </div>
      </section>

      {/* Public catalog */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              Open classes
            </h2>
            <p className="text-sm text-muted-foreground">
              Currently published class sections. Log in as a student to join.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {catalog?.length || 0} classes
          </span>
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
                className="rounded-lg border bg-card p-5 shadow-gc transition-shadow hover:shadow-gc-lg"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white ${avatarColor(
                      c.className
                    )}`}
                  >
                    {classInitial(c.className)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-foreground">{c.className}</h3>
                    <p className="text-xs text-muted-foreground">
                      {c.subjectCode} · {c.subjectName}
                    </p>
                  </div>
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
                    <span
                      className={`text-sm font-medium ${
                        Number(c.registrationFee) === 0
                          ? "text-success"
                          : "text-foreground"
                      }`}
                    >
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
