"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage, useI18n } from "@/i18n"
import { BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const { t } = useI18n()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await authService.register(formData)
      setSentTo(data.email)
    } catch (err: any) {
      setError(getApiErrorMessage(err, t("auth.register.errorFallback")))
    } finally {
      setLoading(false)
    }
  }

  const field = (
    id: keyof typeof formData,
    label: string,
    type: string,
    placeholder: string,
    required = true
  ) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={formData[id]}
        onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
        className="h-10 rounded-full"
        required={required}
        minLength={id === "password" ? 10 : undefined}
      />
    </div>
  )

  if (sentTo) return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md space-y-3 p-8 text-center"><h1 className="text-xl font-semibold">{t("auth.register.verifyTitle")}</h1><p className="text-sm text-muted-foreground">{t("auth.register.verifyDescription", { email: sentTo })}</p><Link href="/login" className="text-sm font-medium text-primary hover:underline">{t("auth.register.signIn")}</Link></Card></div>

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-lg border bg-card p-8 shadow-gc">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-[28px] font-light tracking-tight text-foreground">
            {t("auth.register.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.register.subtitle")}
          </p>
        </div>

        {error && (
          <p className="mb-3 text-sm font-medium text-destructive">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {field("fullName", t("auth.register.fullName"), "text", t("auth.register.fullNamePlaceholder"))}
          {field("username", t("auth.register.username"), "text", t("auth.register.usernamePlaceholder"))}
          {field("email", t("auth.register.email"), "email", t("auth.register.emailPlaceholder"))}
          {field("password", t("auth.register.password"), "password", t("auth.register.passwordPlaceholder"))}
          <p className="-mt-3 text-xs text-muted-foreground">{t("auth.register.passwordRules")}</p>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-full shadow-gc hover:shadow-gc-lg"
          >
            {loading ? t("auth.register.submitting") : t("auth.register.submit")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.register.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.register.signIn")}
          </Link>
        </div>
      </div>
    </div>
  )
}
