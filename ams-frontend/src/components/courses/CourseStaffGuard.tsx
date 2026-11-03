"use client"

import React from "react"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"

export function CourseStaffGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const roles = user?.roles ?? []
  const allowed = roles.some((role) => {
    const name = role.toUpperCase()
    return name.includes("TEACHER") || name.includes("ADMIN")
  })

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Course management is restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only teachers and administrators can create and manage courses. If you
          believe you should have access, ask an administrator to review your role.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/student">Back to my classes</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

export default CourseStaffGuard
