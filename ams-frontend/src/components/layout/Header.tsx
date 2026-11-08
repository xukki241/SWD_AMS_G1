"use client"

import React from "react"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, LogOut, BookOpen, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { LanguageSwitcher, roleLabel, useI18n } from "@/i18n"

function homeHrefForRoles(roles: string[] | undefined) {
  const list = roles || []
  if (list.some((r) => r.includes("ADMIN"))) return "/admin"
  if (list.some((r) => r.includes("TEACHER"))) return "/teacher"
  return "/student"
}

export function Header({
  onMenuToggle,
  mobileMenuOpen = false,
}: {
  onMenuToggle?: () => void
  mobileMenuOpen?: boolean
}) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { t } = useI18n()

  const roles = user?.roles || []
  const isAdmin = roles.some((r) => r.includes("ADMIN"))
  const isTeacher = roles.some((r) => r.includes("TEACHER"))
  const isStudent = roles.some((r) => r.includes("STUDENT"))
  // Exclusive roles: teacher/admin create; student joins via catalog.
  const canCreateCourse = isAdmin || isTeacher
  const showCourseAction = Boolean(user) && (canCreateCourse || isStudent)
  const courseActionHref = canCreateCourse ? "/courses/new" : "/catalog"
  const courseActionLabel = canCreateCourse
    ? t("common.actions.createCourse")
    : t("common.actions.joinCourse")
  const homeHref = homeHrefForRoles(roles)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("common.labels.menu")}
          aria-controls="app-sidebar"
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 rounded-lg outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("common.appName")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--success))] text-white shadow-gc">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="hidden text-lg font-medium tracking-tight text-foreground sm:block">
            {t("common.appName")}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-muted px-4 py-1.5 lg:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("common.actions.search")}
          </span>
        </div>

        <LanguageSwitcher />

        {showCourseAction && (
          <Link
            href={courseActionHref}
            className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))] px-4 py-2 text-sm font-medium text-white shadow-gc transition hover:shadow-gc-lg"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{courseActionLabel}</span>
          </Link>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full ring-2 ring-transparent transition hover:ring-border"
              >
                <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-gc">
              <DropdownMenuLabel className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {user.fullName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  @{user.username}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {user.roles?.map((r) => (
                    <span
                      key={r}
                      className={cn(
                        "rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary"
                      )}
                    >
                      {roleLabel(r)}
                    </span>
                  ))}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                {t("common.actions.profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.actions.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

export default Header
