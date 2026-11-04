"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { StatSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { formatVnd, avatarColor, classInitial } from "@/components/classroom/format"
import { courseService } from "@/services/course.service"
import type { CourseSummary } from "@/types"
import { useI18n, type TranslationKey } from "@/i18n"
import {
  BookOpen,
  GraduationCap,
  User,
  BarChart3,
} from "lucide-react"

const DIFFICULTY_KEY: Record<string, TranslationKey> = {
  BEGINNER: "landing.difficulty.BEGINNER",
  INTERMEDIATE: "landing.difficulty.INTERMEDIATE",
  ADVANCED: "landing.difficulty.ADVANCED",
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { t } = useI18n()

  const { data: catalog, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-courses"],
    queryFn: () => courseService.listPublic({ size: 12 }),
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

  const courses: CourseSummary[] = catalog?.content || []

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
              <h1 className="text-base font-semibold leading-tight text-foreground">
                {t("landing.brand.name")}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {t("landing.brand.tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">{t("landing.nav.logIn")}</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full shadow-gc hover:shadow-gc-lg">
                {t("landing.nav.signUp")}
              </Button>
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
            <span className="text-primary">{t("landing.hero.titlePrefix")}</span>
            {t("landing.hero.titleSuffix")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full px-6 shadow-gc hover:shadow-gc-lg"
              >
                {t("landing.hero.getStarted")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="ghost" className="rounded-full px-4">
                {t("landing.hero.createStudentAccount")}
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            {t("landing.hero.footnote")}
          </p>
        </div>
      </section>

      {/* Public course catalog */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              {t("landing.catalog.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("landing.catalog.subtitle")}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {t("landing.catalog.count", { count: catalog?.totalElements ?? 0 })}
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
        ) : courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-gc transition-shadow hover:shadow-gc-lg"
              >
                <Link href={`/courses/${c.id}`} className="block">
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-32 w-full items-center justify-center ${avatarColor(
                        c.title
                      )}`}
                    >
                      <span className="text-4xl font-bold text-white">
                        {classInitial(c.title)}
                      </span>
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <Link href={`/courses/${c.id}`} className="group">
                    <h3 className="truncate font-medium text-foreground group-hover:underline">
                      {c.title}
                    </h3>
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.code} · {c.categoryName}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {c.instructorName}
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {DIFFICULTY_KEY[c.difficultyLevel]
                          ? t(DIFFICULTY_KEY[c.difficultyLevel])
                          : c.difficultyLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-sm font-medium ${
                          Number(c.price) === 0 ? "text-success" : "text-foreground"
                        }`}
                      >
                        {c.isFree || Number(c.price) === 0
                          ? t("landing.catalog.free")
                          : formatVnd(c.price)}
                      </span>
                      <Link href={`/courses/${c.id}`}>
                        <Button size="sm" className="rounded-full shadow-gc hover:shadow-gc-lg">
                          {t("landing.catalog.enroll")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("landing.catalog.emptyTitle")}
            description={t("landing.catalog.emptyDescription")}
          />
        )}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  )
}
