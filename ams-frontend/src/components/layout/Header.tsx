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

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const roles = user?.roles || []
  const canCreateCourse =
    roles.some((r) => r.includes("TEACHER")) ||
    roles.some((r) => r.includes("EXPERT"))

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          {/* AMS mark — green GC-adjacent brand chip */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--success))] text-white shadow-gc">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="hidden text-lg font-medium tracking-tight text-foreground sm:block">
            AMS Classroom
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-muted px-4 py-1.5 lg:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search</span>
        </div>

        {canCreateCourse && (
          <Link
            href="/courses/new"
            className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))] px-4 py-2 text-sm font-medium text-white shadow-gc transition hover:shadow-gc-lg"
          >
            <Plus className="h-4 w-4" />
            Create course
          </Link>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full ring-2 ring-transparent transition hover:ring-border"
              >
                <Avatar name={user.fullName} size="sm" />
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
                      {r.replace("ROLE_", "")}
                    </span>
                  ))}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

export default Header
