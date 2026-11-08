"use client"

import React from "react"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useI18n } from "@/i18n"
import { Button } from "@/components/ui/button"

/** Course authoring is for teachers/admins chosen at onboarding. */
export function CourseStaffGuard({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const { user, hasHydrated } = useAuthStore()
  const roles = user?.roles ?? []
  const allowed = roles.some((role) => {
    const name = role.toUpperCase()
    return name.includes("TEACHER") || name.includes("ADMIN")
  })

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">{t("courses.guard.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("courses.guard.description")}
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/catalog">{t("common.actions.browseCourses")}</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

export default CourseStaffGuard
