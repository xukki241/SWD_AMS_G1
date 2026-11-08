"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { signInWithPopup } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width: number }
          ) => void
        }
      }
    }
  }
}

type Props = {
  onCredential: (credential: string) => void
  onError?: (message: string) => void
}

export function GoogleSignInButton({ onCredential, onError }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const gisClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const useFirebase = isFirebaseConfigured()

  const initializeGis = () => {
    if (!gisClientId || useFirebase) return
    if (!window.google || !mountRef.current) return
    mountRef.current.replaceChildren()
    window.google.accounts.id.initialize({
      client_id: gisClientId,
      callback: (result) => onCredential(result.credential),
    })
    window.google.accounts.id.renderButton(mountRef.current, {
      theme: "outline",
      size: "large",
      width: Math.min(360, Math.floor(mountRef.current.clientWidth || 320)),
    })
  }

  useEffect(() => {
    initializeGis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFirebaseGoogle = async () => {
    setLoading(true)
    onError?.("")
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider())
      const idToken = await result.user.getIdToken()
      onCredential(idToken)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return
      }
      if (code === "auth/unauthorized-domain") {
        onError?.(
          "Thêm localhost vào Firebase → Authentication → Settings → Authorized domains."
        )
        return
      }
      if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
        onError?.(
          "Firebase chưa bật Google. Authentication → Sign-in method → bật Google rồi Save."
        )
        return
      }
      onError?.(
        (err as { message?: string })?.message || t("auth.login.errorFallback")
      )
    } finally {
      setLoading(false)
    }
  }

  if (useFirebase) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleFirebaseGoogle}
        className="h-10 w-full rounded-full"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.8 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
          />
        </svg>
        {loading ? t("auth.login.submitting") : "Continue with Google"}
      </Button>
    )
  }

  if (gisClientId) {
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initializeGis}
        />
        <div ref={mountRef} className="flex min-h-10 justify-center" />
      </>
    )
  }

  return (
    <p className="py-2 text-center text-xs text-muted-foreground" role="status">
      {t("auth.login.googleNotConfigured")}
    </p>
  )
}
