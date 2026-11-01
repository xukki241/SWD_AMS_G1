"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import type { AssignmentOverviewItem } from "@/components/classroom/classroomTypes"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  CheckSquare,
  GraduationCap,
  CreditCard,
  ShieldCheck,
  BookMarked,
  Users,
  Search,
} from "lucide-react"

function SubmissionProgressRing({
  submitted,
  total,
}: {
  submitted: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, Math.round((submitted / total) * 100)) : 0
  const r = 16
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">Tiến độ nộp bài</p>
        <p className="text-[11px] text-muted-foreground">
          {submitted}/{total} đã nộp ({pct}%)
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [hash, setHash] = useState("")

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""))
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [pathname])

  const roles = user?.roles || []
  const isAdmin = roles.some((r) => r.includes("ADMIN"))
  const isExpert = roles.some((r) => r.includes("EXPERT"))
  const isTeacher = roles.some((r) => r.includes("TEACHER"))
  const isStudent = roles.some((r) => r.includes("STUDENT"))

  const { data: overview } = useQuery({
    queryKey: ["student-assignments-overview"],
    queryFn: async () =>
      (await api.get("/assignments/overview")).data as AssignmentOverviewItem[],
    enabled: isStudent,
  })

  const progress = useMemo(() => {
    const items = overview || []
    const total = items.length
    const submitted = items.filter((o) =>
      ["SUBMITTED", "LATE", "GRADED"].includes(o.workState)
    ).length
    return { submitted, total }
  }, [overview])

  const links = [
    ...(isAdmin
      ? [
          { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
          { name: "My Classes", href: "/admin#classes", icon: FolderKanban },
          { name: "Subjects", href: "/admin#subjects", icon: BookMarked },
          { name: "Users & Roles", href: "/admin#users", icon: Users },
          { name: "Audit Trail", href: "/admin#audit", icon: ShieldCheck },
        ]
      : []),
    ...(isTeacher
      ? [
          { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
          { name: "My Classes", href: "/teacher#classes", icon: FolderKanban },
          { name: "New Classwork", href: "/teacher#new-assignment", icon: FileText },
          { name: "Grading Queue", href: "/teacher#grading", icon: CheckSquare },
        ]
      : []),
    ...(isExpert
      ? [
          { name: "Dashboard", href: "/expert", icon: LayoutDashboard },
          { name: "My Classes", href: "/expert#classes", icon: FolderKanban },
          { name: "Templates", href: "/expert#templates", icon: FileText },
        ]
      : []),
    ...(isStudent
      ? [
          { name: "Đã ghi danh", href: "/student#classes", icon: FolderKanban, section: "classes" },
          { name: "Tìm lớp", href: "/student#find", icon: Search, section: "find" },
          { name: "Thanh toán", href: "/student#payments", icon: CreditCard, section: "payments" },
          { name: "Bài tập của tôi", href: "/student#work", icon: GraduationCap, section: "work" },
        ]
      : []),
  ]

  return (
    <aside className="w-64 shrink-0 border-r bg-card min-h-[calc(100vh-4rem)] p-3">
      <div className="px-3 py-2">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {isStudent ? "Không gian học tập" : "Navigation"}
        </p>
        {isStudent && (
          <p className="text-[11px] text-muted-foreground">Lớp học · bài tập · học phí</p>
        )}
      </div>

      {isStudent && progress.total > 0 && (
        <SubmissionProgressRing submitted={progress.submitted} total={progress.total} />
      )}

      <div className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon
          const activeHref = item.href.split("#")[0]
          const section = "section" in item ? (item as { section?: string }).section : undefined
          const isActive = isStudent
            ? pathname === "/student" &&
              (hash === section || (!hash && section === "classes"))
            : item.href === pathname ||
              (activeHref === pathname && !item.href.includes("#"))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(var(--success))] text-white shadow-gc"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
