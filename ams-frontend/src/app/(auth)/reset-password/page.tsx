"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { authService } from "@/services/auth.service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"

function ResetPasswordContent() {
  const { t } = useI18n(); const token = useSearchParams().get("token") || ""
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("")
  const [done, setDone] = useState(false); const [error, setError] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("")
    if (!token) { setError(t("auth.register.linkFailed")); return }
    if (password !== confirm) { setError(t("auth.register.passwordMismatch")); return }
    try { await authService.resetPassword(token, password); setDone(true) }
    catch { setError(t("auth.register.linkFailed")) }
  }
  return <main className="flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8"><h1 className="text-2xl font-semibold">{t("auth.register.forgotTitle")}</h1><p className="text-sm text-muted-foreground">{t("auth.register.passwordRules")}</p>{done ? <p role="status" className="text-sm text-success">{t("auth.register.resetSuccess")}</p> : <><Input type="password" minLength={10} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.register.newPassword")} /><Input type="password" minLength={10} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t("auth.register.confirmPassword")} />{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full">{t("auth.register.savePassword")}</Button></>}<Link href="/login" className="block text-sm text-primary hover:underline">{t("auth.register.signIn")}</Link></form></main>
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="p-8 text-center">Loading…</main>}><ResetPasswordContent /></Suspense>
}
