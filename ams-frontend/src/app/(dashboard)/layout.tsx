"use client"

import React, { useEffect, useRef, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAuthStore } from "@/stores/authStore"
import { useRouter, usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const firstRender = useRef(true)
  // Desktop + mobile: hamburger toggles this. Default open on large screens.
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    // Scroll the main pane back to top on route change.
    const main = document.querySelector("main")
    if (main) main.scrollTo({ top: 0, behavior: "instant" })
    if (firstRender.current) firstRender.current = false
    // On mobile, close the drawer after navigation.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false)
    }
  }, [pathname])

  if (!hasHydrated || !isAuthenticated) {
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
      <Header
        mobileMenuOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((open) => !open)}
      />
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 max-h-[calc(100dvh-4rem)]">
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
