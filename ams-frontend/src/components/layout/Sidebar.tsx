"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"
import { roleFlags } from "@/lib/roles"
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
  ClipboardList,
  CreditCard,
  Users,
  ShieldCheck,
  FolderKanban,
  BookOpen,
} from "lucide-react"

type NavLink = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Hash section on the role home page (student/teacher/admin) */
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

function CourseSection({
  label,
  empty,
  courses,
  activeCourseId,
  onNavigate,
}: {
  label: string
  empty: string
  courses: { id: number; title: string }[]
  activeCourseId: number | null
  onNavigate: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-1 px-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="space-y-0.5">
        {courses.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{empty}</p>
        ) : (
          courses.map((c) => {
            const active = activeCourseId === c.id
            return (
              <Link
                key={`${label}-${c.id}`}
                href={`/courses/${c.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-full px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                )}
                onClick={onNavigate}
                title={c.title}
              >
                <CourseDot name={c.title} />
                <span className="min-w-0 truncate font-medium">{c.title}</span>
              </Link>
            )
          })
        )}
      </div>
    </div>
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

export function Sidebar({
  open = true,
  onClose,
  /** @deprecated use `open` */
  mobileOpen,
  /** @deprecated use `onClose` */
  onMobileClose,
}: {
  open?: boolean
  onClose?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const sidebarOpen = mobileOpen ?? open
  const closeSidebar = onMobileClose ?? onClose
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

  const { isAdmin, canManageCourses, canEnroll } = roleFlags(user?.roles)
  const isCourseUser = canManageCourses || canEnroll

  const homePath = isAdmin ? "/admin" : canManageCourses ? "/teacher" : "/student"

  const { data: myEnrollments } = useQuery({
    queryKey: ["sidebar-my-enrollments", user?.userId],
    queryFn: () => enrollmentService.getMyEnrollments(),
    enabled: canEnroll,
  })

  const { data: teachingCourses } = useQuery({
    queryKey: ["sidebar-my-courses", user?.userId],
    queryFn: async () => {
      const page = await courseService.list({ page: 0, size: 50 })
      const content = page.content || []
      return content.filter((c) => user && c.instructorId === user.userId)
    },
    enabled: canManageCourses && !isAdmin && !!user,
  })

  const studentLinks: NavLink[] = [
    { name: t("dashboard.nav.courseCatalog"), href: "/catalog", icon: BookOpen },
    {
      name: t("dashboard.nav.submissionsFeedback"),
      href: "/student/submissions",
      icon: CheckSquare,
    },
    {
      name: t("dashboard.nav.myCourses"),
      href: "/student/courses",
      icon: Home,
    },
    {
      name: t("dashboard.nav.toDo"),
      href: "/student/work",
      icon: CheckSquare,
    },
    {
      name: t("dashboard.nav.payments"),
      href: "/student/enrollments",
      icon: CreditCard,
      section: "payments",
    },
  ]

  const teacherLinks: NavLink[] = [
    {
      name: t("dashboard.nav.manageAssignments"),
      href: "/teacher/work",
      icon: ClipboardList,
    },
    {
      name: t("dashboard.nav.myPayments"),
      href: "/teacher/payments",
      icon: CreditCard,
    },
    {
      name: t("dashboard.nav.manageCourses"),
      href: "/courses",
      icon: BookOpen,
    },
  ]

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
    : canManageCourses
      ? [
          {
            name: t("dashboard.courseList.teaching"),
            href: "/teacher/courses",
            icon: Home,
          } as NavLink,
          ...teacherLinks,
        ]
      : canEnroll
        ? studentLinks
        : []

  const enrolledCourses: { id: number; title: string }[] = (myEnrollments || [])
    .filter((e: CourseEnrollment) => e.status !== "CANCELLED")
    .map((e: CourseEnrollment) => ({ id: e.courseId, title: e.courseTitle }))

  const teachingList: { id: number; title: string }[] = (teachingCourses || []).map(
    (c: CourseSummary) => ({ id: c.id, title: c.title })
  )

  const isPrimaryActive = (link: NavLink) => {
    const base = link.href.split("#")[0]
    // On a course page, keep the course-list entry highlighted instead of a hash section.
    if (/^\/courses\/\d+/.test(pathname)) {
      if (!link.section) return link.href === "/courses"
      // Students reach a course from "My Courses"; teachers/admins use course management.
      if (canEnroll && !isAdmin) return link.section === "classes"
      return false
    }
    // Plain routes (no hash section) also match their nested paths, e.g. /courses/[id].
    if (!link.section) {
      return pathname === link.href || pathname.startsWith(`${link.href}/`)
    }
    if (pathname !== base && pathname !== homePath) return false
    // Empty hash defaults to the first section of the page.
    const defaultSection = isAdmin ? "users" : canEnroll || canManageCourses ? "classes" : "courses"
    const effectiveHash = hash || defaultSection
    return effectiveHash === link.section
  }

  const activeCourseId = (() => {
    const m = pathname.match(/^\/courses\/(\d+)/)
    return m ? Number(m[1]) : null
  })()

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t("common.labels.closeMenu")}
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/30 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside
        id="app-sidebar"
        className={cn(
          "z-40 flex shrink-0 flex-col border-r bg-card transition-all duration-200",
          // Mobile: fixed drawer
          "fixed inset-y-16 left-0 w-64",
          // Desktop: sticky column that can collapse to 0 width
          "md:sticky md:top-16 md:z-20 md:min-h-[calc(100dvh-4rem)]",
          sidebarOpen
            ? "translate-x-0 md:w-64"
            : "-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-0"
        )}
      >
      <nav className="flex w-64 flex-1 flex-col gap-1 p-3">
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
                if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                  closeSidebar?.()
                }
              }}
            />
          ))}
        </div>

        {isCourseUser && !isAdmin && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-3">
            {canManageCourses && (
              <CourseSection
                label={t("dashboard.courseList.teaching")}
                empty={t("dashboard.courseList.emptyTeacher")}
                courses={teachingList}
                activeCourseId={activeCourseId}
                onNavigate={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                    closeSidebar?.()
                  }
                }}
              />
            )}
            {canEnroll && (
              <CourseSection
                label={t("dashboard.nav.myCourses")}
                empty={t("dashboard.courseList.emptyStudent")}
                courses={enrolledCourses}
                activeCourseId={activeCourseId}
                onNavigate={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                    closeSidebar?.()
                  }
                }}
              />
            )}
          </div>
        )}
      </nav>
      </aside>
    </>
  )
}

export default Sidebar
