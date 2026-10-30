"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await authService.login({ username, password })
      setAuth(data)

      const roles = data.roles || []
      if (roles.includes("ROLE_ADMIN")) router.push("/admin")
      else if (roles.includes("ROLE_TEACHER")) router.push("/teacher")
      else if (roles.includes("ROLE_EXPERT")) router.push("/expert")
      else router.push("/student")
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (u: string) => {
    setUsername(u)
    setPassword("Password@123")
  }

  const demoAccounts = [
    { label: "Admin", value: "admin" },
    { label: "Teacher", value: "teacher1" },
    { label: "Student", value: "student1" },
    { label: "Expert", value: "expert1" },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-lg border bg-card p-8 shadow-gc">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-[28px] font-light tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your AMS account</p>
        </div>

        {error && (
          <p className="mb-3 text-sm font-medium text-destructive">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="text-xs font-medium text-muted-foreground"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. student1, teacher1, admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 rounded-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-full"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-full shadow-gc hover:shadow-gc-lg"
          >
            {loading ? "Authenticating…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 border-t pt-5">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            Demo accounts · password Password@123
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => quickFill(a.value)}
                className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          New to AMS?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
