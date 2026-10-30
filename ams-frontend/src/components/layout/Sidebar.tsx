"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
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
  LogOut,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const roles = user?.roles || []
  const isAdmin = roles.some((r) => r.includes("ADMIN"))
  const isExpert = roles.some((r) => r.includes("EXPERT"))
  const isTeacher = roles.some((r) => r.includes("TEACHER"))
  const isStudent = roles.some((r) => r.includes("STUDENT"))

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
          { name: "Home", href: "/student", icon: LayoutDashboard },
          { name: "My Classes", href: "/student#classes", icon: FolderKanban },
          { name: "Find a Class", href: "/student#find", icon: GraduationCap },
          { name: "Payments", href: "/student#payments", icon: CreditCard },
          { name: "My Work", href: "/student#work", icon: FileText },
        ]
      : []),
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </div>
        {links.map((item) => {
          const Icon = item.icon
          const activeHref = item.href.split("#")[0]
          const isActive =
            item.href === pathname ||
            (activeHref === pathname && !item.href.includes("#"))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">AMS POC v1.0</p>
          <p>Google-Classroom style · VNPay & VietQR sandbox</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border bg-card p-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
