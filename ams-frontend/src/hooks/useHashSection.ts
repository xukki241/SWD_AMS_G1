"use client"

import { useEffect } from "react"

/**
 * Keep hash sections (#classes, #todo, #work, …) in sync with the sidebar:
 * scroll into view on hash change / mount, and listen for hashchange.
 */
export function useHashSection() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "")
      if (!id) return
      // Defer until layout paints (sections may mount after data load)
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      })
    }

    scrollToHash()
    window.addEventListener("hashchange", scrollToHash)
    return () => window.removeEventListener("hashchange", scrollToHash)
  }, [])
}
