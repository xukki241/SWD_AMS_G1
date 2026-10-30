"use client"

import React from "react"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, LogOut, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted md:block"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:block">
            AMS
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-muted px-4 py-1.5 lg:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search classes</span>
        </div>

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
