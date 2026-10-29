"use client"

import React from "react"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User as UserIcon, BookOpen } from "lucide-react"

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">AMS System</h1>
          <p className="text-xs text-muted-foreground">Assignments Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 justify-end">
                <UserIcon className="h-4 w-4 text-primary" />
                {user.fullName}
              </div>
              <div className="flex gap-1 justify-end mt-0.5">
                {user.roles?.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px] uppercase px-1.5 py-0">
                    {r.replace("ROLE_", "")}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out" className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
