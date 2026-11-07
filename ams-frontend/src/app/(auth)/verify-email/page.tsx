"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { authService } from "@/services/auth.service"
import { useI18n } from "@/i18n"

function VerifyEmailContent() {
  const { t } = useI18n(); const token = useSearchParams().get("token") || ""
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  useEffect(() => { if (!token) { setState("error"); return } authService.verifyEmail(token).then(() => setState("success")).catch(() => setState("error")) }, [token])
  return <main className="flex min-h-screen items-center justify-center p-4"><div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 text-center"><p role="status">{state === "loading" ? t("common.labels.loading") : state === "success" ? t("auth.register.linkSuccess") : t("auth.register.linkFailed")}</p>{state !== "loading" && <Link href="/login" className="text-sm text-primary hover:underline">{t("auth.register.signIn")}</Link>}</div></main>
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="p-8 text-center">Loading…</main>}><VerifyEmailContent /></Suspense>
}
