"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await authService.register(formData)
      setAuth(data)
      router.push("/student")
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check your information.")
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
      />
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-lg border bg-card p-8 shadow-gc">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-[28px] font-light tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register to enroll in courses and submit assignments
          </p>
        </div>

        {error && (
          <p className="mb-3 text-sm font-medium text-destructive">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {field("fullName", "Full name", "text", "Nguyen Van A")}
          {field("username", "Username", "text", "student_code")}
          {field("email", "Email", "email", "example@student.edu.vn")}
          {field("password", "Password", "password", "Minimum 6 characters")}

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-full shadow-gc hover:shadow-gc-lg"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
