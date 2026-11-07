"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { useI18n } from "@/i18n"

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void
      renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void
    } } }
  }
}

export function GoogleSignInButton({ onCredential }: {
  onCredential: (credential: string) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const initialize = () => {
    if (!clientId) return
    if (!window.google || !mountRef.current) return
    mountRef.current.replaceChildren()
    window.google.accounts.id.initialize({ client_id: clientId, callback: result => onCredential(result.credential) })
    window.google.accounts.id.renderButton(mountRef.current, {
      theme: "outline",
      size: "large",
      width: Math.min(360, Math.floor(mountRef.current.clientWidth)),
    })
  }
  useEffect(() => { initialize() }, [])
  return (
    <>
      {clientId ? (
        <>
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initialize} />
          <div ref={mountRef} className="flex min-h-10 justify-center" />
        </>
      ) : (
        <p className="py-2 text-center text-xs text-muted-foreground" role="status">
          {t("auth.login.googleNotConfigured")}
        </p>
      )}
    </>
  )
}
