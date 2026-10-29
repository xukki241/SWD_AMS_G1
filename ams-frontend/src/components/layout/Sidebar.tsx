"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookMarked,
  FileText,
  CreditCard,
  CheckSquare,
  ShieldCheck,
  FolderKanban
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const roles = user?.roles || []
  const isAdmin = roles.some(r => r.includes("ADMIN"))
  const isExpert = roles.some(r => r.includes("EXPERT"))
  const isTeacher = roles.some(r => r.includes("TEACHER"))
  const isStudent = roles.some(r => r.includes("STUDENT"))

  const links = [
    ...(isAdmin ? [
      { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Manage Users", href: "/admin#users", icon: Users },
      { name: "Manage Subjects", href: "/admin#subjects", icon: BookMarked },
      { name: "Manage Classes", href: "/admin#classes", icon: FolderKanban },
      { name: "Audit Trail", href: "/admin#audit", icon: ShieldCheck },
    ] : []),
    ...(isTeacher ? [
      { name: "Teacher Dashboard", href: "/teacher", icon: LayoutDashboard },
      { name: "Class Assignments", href: "/teacher#assignments", icon: FileText },
      { name: "Submissions & Grading", href: "/teacher#evaluations", icon: CheckSquare },
    ] : []),
    ...(isExpert ? [
      { name: "Expert Dashboard", href: "/expert", icon: LayoutDashboard },
      { name: "Assignment Templates", href: "/expert#templates", icon: FileText },
    ] : []),
    ...(isStudent ? [
      { name: "Student Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "Available Classes", href: "/student#classes", icon: GraduationCap },
      { name: "My Registrations & Tuition", href: "/student#registrations", icon: CreditCard },
      { name: "My Assignments", href: "/student#assignments", icon: FileText },
      { name: "My Submissions & Scores", href: "/student#submissions", icon: CheckSquare },
    ] : []),
  ]

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation Menu
        </div>
        {links.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
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

      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">AMS POC v1.0</p>
        <p>Connected to VNPay & Cloudinary</p>
      </div>
    </aside>
  )
}
