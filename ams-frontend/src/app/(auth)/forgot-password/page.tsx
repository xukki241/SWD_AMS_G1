"use client"

import { useState } from "react"
import Link from "next/link"
import { authService } from "@/services/auth.service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("")
    try { await authService.forgotPassword(email); setSent(true) }
    catch { setError(t("auth.login.errorFallback")) }
  }
  return <main className="flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8"><h1 className="text-2xl font-semibold">{t("auth.register.forgotTitle")}</h1><p className="text-sm text-muted-foreground">{t("auth.register.forgotDescription")}</p>{sent ? <p role="status" className="text-sm text-success">{t("auth.register.sentLink")}</p> : <><Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.register.emailPlaceholder")} />{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full">{t("auth.register.sendLink")}</Button></>}<Link href="/login" className="block text-sm text-primary hover:underline">{t("auth.register.signIn")}</Link></form></main>
}
