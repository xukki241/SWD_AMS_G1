"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import {
  classBannerColor,
  classInitial,
} from "@/components/classroom/format"
import type { MyClass } from "@/components/classroom/classroomTypes"
import {
  Home,
  CheckSquare,
  CreditCard,
  Users,
  ShieldCheck,
  FolderKanban,
  FileText,
} from "lucide-react"

type NavLink = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Hash section on the role home page (student/teacher/expert/admin) */
  section?: string
}

function ClassDot({ name }: { name: string }) {
  const banner = classBannerColor(name)
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        banner.bg
      )}
      aria-hidden
    >
      {classInitial(name)}
    </span>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onNavigate?: (href: string) => void
}) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={(e) => {
        // Same-path hash links often don't fire navigation in App Router —
        // force hash + scroll ourselves so Classes ↔ To-do always responds.
        const [path, section = ""] = href.split("#")
        if (
          typeof window !== "undefined" &&
          (window.location.pathname === path ||
            window.location.pathname === path.replace(/\/$/, ""))
        ) {
          e.preventDefault()
          const nextHash = section ? `#${section}` : ""
          if (window.location.hash !== nextHash) {
            window.history.pushState(null, "", `${path}${nextHash}`)
          } else {
            // Re-click same section: still scroll
            window.dispatchEvent(new HashChangeEvent("hashchange"))
          }
          // Ensure listeners (Sidebar + useHashSection) see the new hash
          window.dispatchEvent(new HashChangeEvent("hashchange"))
          if (section) {
            requestAnimationFrame(() => {
              document.getElementById(section)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            })
          }
        }
        onNavigate?.(href)
      }}
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[hsl(var(--success))] text-white shadow-gc"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
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
  const isClassroomUser = isStudent || isTeacher || isExpert

  const homePath = isAdmin
    ? "/admin"
    : isTeacher
      ? "/teacher"
      : isExpert
        ? "/expert"
        : "/student"

  const { data: myClasses } = useQuery({
    queryKey: ["sidebar-my-classes", homePath],
    queryFn: async () =>
      (await api.get("/subject-classes/my")).data as MyClass[],
    enabled: isClassroomUser && !isAdmin,
  })

  const primaryLinks: NavLink[] = isAdmin
    ? [
        { name: "Users & roles", href: "/admin#users", icon: Users, section: "users" },
        { name: "Classes", href: "/admin#classes", icon: FolderKanban, section: "classes" },
        { name: "Audit trail", href: "/admin#audit", icon: ShieldCheck, section: "audit" },
      ]
    : isStudent
      ? [
          { name: "Classes", href: "/student#classes", icon: Home, section: "classes" },
          { name: "To-do", href: "/student#work", icon: CheckSquare, section: "work" },
          { name: "Payments", href: "/student#payments", icon: CreditCard, section: "payments" },
        ]
      : isTeacher
        ? [
            { name: "Classes", href: "/teacher#classes", icon: Home, section: "classes" },
            {
              name: "To-do",
              href: "/teacher#todo",
              icon: CheckSquare,
              section: "todo",
            },
          ]
        : isExpert
          ? [
              { name: "Classes", href: "/expert#classes", icon: Home, section: "classes" },
              {
                name: "Templates",
                href: "/expert#templates",
                icon: FileText,
                section: "templates",
              },
            ]
          : []

  const classListLabel = isStudent ? "Enrolled" : "Teaching"
  const classList = myClasses || []

  const isPrimaryActive = (link: NavLink) => {
    const base = link.href.split("#")[0]
    if (pathname.startsWith("/classes/")) {
      // On a class workspace, highlight Classes home link.
      return link.section === "classes"
    }
    if (pathname !== base && pathname !== homePath) return false
    if (!link.section) return pathname === link.href
    // Empty hash (or #classes) ⇒ Classes; never light To-do on bare /teacher
    const effectiveHash = hash || "classes"
    if (isAdmin && !hash) {
      return link.section === "users"
    }
    return effectiveHash === link.section
  }

  const activeClassId = (() => {
    const m = pathname.match(/^\/classes\/(\d+)/)
    return m ? Number(m[1]) : null
  })()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <div className="space-y-0.5">
          {primaryLinks.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              active={isPrimaryActive(item)}
              onNavigate={(h) => {
                const next = h.includes("#") ? h.split("#")[1] || "" : ""
                setHash(next)
              }}
            />
          ))}
        </div>

        {isClassroomUser && !isAdmin && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {classListLabel}
              </p>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto pb-3">
              {classList.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {isStudent
                    ? "Join a class to see it here."
                    : "Create a class to see it here."}
                </p>
              ) : (
                classList.map((c) => {
                  const id = c.classId ?? c.id
                  const active = activeClassId === id
                  return (
                    <Link
                      key={id}
                      href={`/classes/${id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                      title={c.className}
                    >
                      <ClassDot name={c.className} />
                      <span className="min-w-0 truncate font-medium">
                        {c.className}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
