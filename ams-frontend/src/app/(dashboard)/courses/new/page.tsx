"use client"

import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseForm } from "@/components/courses/CourseForm"
import { useI18n } from "@/i18n"
import { Button } from "@/components/ui/button"

export default function NewCoursePage() {
  const { t } = useI18n()
  return (
    <CourseStaffGuard>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <Link href="/courses">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("courses.new.backToCourses")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t("courses.new.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("courses.new.subtitle")}
          </p>
        </div>
        <CourseForm />
      </div>
    </CourseStaffGuard>
  )
}
