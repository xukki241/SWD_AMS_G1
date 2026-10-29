"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, KeyRound, AlertCircle } from "lucide-react"

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <BookOpen className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold mt-2">Sign in to AMS</CardTitle>
          <CardDescription>
            Assignments Management System — Group 1 POC
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. student1, teacher1, admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Quick demo accounts (Password: Password@123):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill("admin")}
                className="rounded border bg-card p-2 text-left hover:border-primary transition"
              >
                <div className="font-semibold text-foreground">Admin</div>
                <div className="text-muted-foreground">admin</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill("teacher1")}
                className="rounded border bg-card p-2 text-left hover:border-primary transition"
              >
                <div className="font-semibold text-foreground">Teacher</div>
                <div className="text-muted-foreground">teacher1</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill("student1")}
                className="rounded border bg-card p-2 text-left hover:border-primary transition"
              >
                <div className="font-semibold text-foreground">Student</div>
                <div className="text-muted-foreground">student1</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill("expert1")}
                className="rounded border bg-card p-2 text-left hover:border-primary transition"
              >
                <div className="font-semibold text-foreground">Expert</div>
                <div className="text-muted-foreground">expert1</div>
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          Don&apos;t have an account?&nbsp;
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register as Student
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
