"use client"

import React, { useEffect, useRef } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAuthStore } from "@/stores/authStore"
import { useRouter, usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const firstRender = useRef(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    // Scroll the main pane back to top on route change.
    const main = document.querySelector("main")
    if (main) main.scrollTo({ top: 0, behavior: "instant" })
    if (firstRender.current) firstRender.current = false
  }, [pathname])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Key by pathname so React remounts the children on each navigation and the
  // entry animation re-runs (fade-up + slight scale, GC-style page transition).
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div
            key={pathname}
            className="animate-fade-up"
            style={{ willChange: "opacity, transform" }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
