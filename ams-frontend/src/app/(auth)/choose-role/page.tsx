"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, GraduationCap, Loader2, Users } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { homePathForAuth } from "@/lib/authRedirect"
import { getApiErrorMessage, useI18n } from "@/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Choice = "STUDENT" | "TEACHER"

export default function ChooseRolePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { setAuth, user, isAuthenticated, hasHydrated, logout } = useAuthStore()
  const [selected, setSelected] = useState<Choice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (hasHydrated && isAuthenticated && user?.onboardingCompleted) {
    router.replace(homePathForAuth({ roles: user.roles || [], onboardingCompleted: true }))
  }

  if (hasHydrated && !isAuthenticated) {
    router.replace("/login")
  }

  const submit = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const data = await authService.chooseRole(selected)
      setAuth(data)
      router.replace(homePathForAuth(data))
    } catch (err) {
      setError(getApiErrorMessage(err, t("auth.chooseRole.errorFallback")))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl rounded-lg border bg-card p-8 shadow-gc">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.chooseRole.title")}</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("auth.chooseRole.subtitle")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelected("STUDENT")}
            className={cn(
              "rounded-xl border p-5 text-left transition",
              selected === "STUDENT"
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <Users className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">{t("auth.chooseRole.studentTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.chooseRole.studentDescription")}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSelected("TEACHER")}
            className={cn(
              "rounded-xl border p-5 text-left transition",
              selected === "TEACHER"
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <GraduationCap className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">{t("auth.chooseRole.teacherTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.chooseRole.teacherDescription")}
            </p>
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            className="w-full rounded-full"
            disabled={!selected || loading}
            onClick={submit}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("auth.chooseRole.continue")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full"
            onClick={() => {
              logout()
              router.replace("/login")
            }}
          >
            {t("common.actions.signOut")}
          </Button>
        </div>
      </div>
    </div>
  )
}
