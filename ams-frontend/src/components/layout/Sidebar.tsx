"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n"
import {
  enrollmentService,
} from "@/services/enrollment.service"
import { courseService } from "@/services/course.service"
import {
  classBannerColor,
  classInitial,
} from "@/components/classroom/format"
import type { CourseEnrollment, CourseSummary } from "@/types"
import {
  Home,
  CheckSquare,
  CreditCard,
  Users,
  ShieldCheck,
  FolderKanban,
  FileText,
  BookOpen,
} from "lucide-react"

type NavLink = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Hash section on the role home page (student/teacher/expert/admin) */
  section?: string
}

function CourseDot({ name }: { name: string }) {
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
      onClick={() => onNavigate?.(href)}
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
  const { t } = useI18n()
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
  const isCourseUser = isStudent || isTeacher || isExpert

  const homePath = isAdmin
    ? "/admin"
    : isTeacher
      ? "/teacher"
      : isExpert
        ? "/expert"
        : "/student"

  // Students: their enrollments; teachers/experts: courses they instruct.
  const { data: myEnrollments } = useQuery({
    queryKey: ["sidebar-my-enrollments", user?.userId],
    queryFn: () => enrollmentService.getMyEnrollments(),
    enabled: isStudent && !isAdmin,
  })

  const { data: myCoursesPage } = useQuery({
    queryKey: ["sidebar-my-courses", user?.userId],
    queryFn: async () => {
      const page = isTeacher
        ? await courseService.list({ page: 0, size: 50 })
        : await courseService.listPublic({ page: 0, size: 50 })
      const content = page.content || []
      // Teachers see their own courses; experts browse the published catalog.
      return isTeacher
        ? content.filter((c) => user && c.instructorId === user.userId)
        : content
    },
    enabled: (isTeacher || isExpert) && !isAdmin && !!user,
  })

  const primaryLinks: NavLink[] = isAdmin
    ? [
        {
          name: t("dashboard.nav.usersRoles"),
          href: "/admin#users",
          icon: Users,
          section: "users",
        },
        {
          name: t("dashboard.nav.courses"),
          href: "/admin#courses",
          icon: FolderKanban,
          section: "courses",
        },
        { name: t("dashboard.nav.courseCatalog"), href: "/courses", icon: BookOpen },
        {
          name: t("dashboard.nav.auditTrail"),
          href: "/admin#audit",
          icon: ShieldCheck,
          section: "audit",
        },
      ]
    : isStudent
      ? [
          {
            name: t("dashboard.nav.myCourses"),
            href: "/student#classes",
            icon: Home,
            section: "classes",
          },
          {
            name: t("dashboard.nav.toDo"),
            href: "/student#work",
            icon: CheckSquare,
            section: "work",
          },
          {
            name: t("dashboard.nav.payments"),
            href: "/student#payments",
            icon: CreditCard,
            section: "payments",
          },
        ]
      : isTeacher
        ? [
            {
              name: t("dashboard.nav.myCourses"),
              href: "/teacher#classes",
              icon: Home,
              section: "classes",
            },
            {
              name: t("dashboard.nav.toDo"),
              href: "/teacher#todo",
              icon: CheckSquare,
              section: "todo",
            },
            {
              name: t("dashboard.nav.manageCourses"),
              href: "/courses",
              icon: BookOpen,
            },
          ]
        : isExpert
          ? [
              {
                name: t("dashboard.nav.publishedCourses"),
                href: "/expert#courses",
                icon: Home,
                section: "courses",
              },
              {
                name: t("dashboard.nav.templates"),
                href: "/expert#templates",
                icon: FileText,
                section: "templates",
              },
            ]
          : []

  const courseListLabel = isStudent
    ? t("dashboard.nav.myCourses")
    : isTeacher
      ? t("dashboard.courseList.teaching")
      : t("dashboard.courseList.published")
  const sidebarCourses: { id: number; title: string }[] = isStudent
    ? (myEnrollments || [])
        .filter((e: CourseEnrollment) => e.status !== "CANCELLED")
        .map((e: CourseEnrollment) => ({ id: e.courseId, title: e.courseTitle }))
    : (myCoursesPage || []).map((c: CourseSummary) => ({ id: c.id, title: c.title }))

  const isPrimaryActive = (link: NavLink) => {
    const base = link.href.split("#")[0]
    // On a course page, keep the course-list entry highlighted instead of a hash section.
    if (/^\/courses\/\d+/.test(pathname)) {
      if (!link.section) return link.href === "/courses"
      // Students reach a course from "My Courses"; experts from "Published Courses";
      // teachers/admins use "Manage Courses"/"Course catalog".
      if (isStudent && !isAdmin) return link.section === "classes"
      if (isExpert && !isTeacher && !isAdmin) return link.section === "courses"
      return false
    }
    // Plain routes (no hash section) also match their nested paths, e.g. /courses/[id].
    if (!link.section) {
      return pathname === link.href || pathname.startsWith(`${link.href}/`)
    }
    if (pathname !== base && pathname !== homePath) return false
    // Empty hash defaults to the first section of the page.
    const defaultSection = isAdmin ? "users" : isStudent ? "classes" : isTeacher ? "classes" : "courses"
    const effectiveHash = hash || defaultSection
    return effectiveHash === link.section
  }

  const activeCourseId = (() => {
    const m = pathname.match(/^\/courses\/(\d+)/)
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

        {isCourseUser && !isAdmin && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {courseListLabel}
              </p>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto pb-3">
              {sidebarCourses.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {isStudent
                    ? t("dashboard.courseList.emptyStudent")
                    : t("dashboard.courseList.emptyTeacher")}
                </p>
              ) : (
                sidebarCourses.map((c) => {
                  const active = activeCourseId === c.id
                  return (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                      title={c.title}
                    >
                      <CourseDot name={c.title} />
                      <span className="min-w-0 truncate font-medium">
                        {c.title}
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
