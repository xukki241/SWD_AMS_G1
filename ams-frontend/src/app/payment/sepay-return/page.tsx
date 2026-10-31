"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { PaymentResultSkeleton } from "@/components/ui/loading"

function SePayReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    api.get("/payment/sepay-return", { params })
      .then((res) => {
        setSuccess(res.data.success)
        setMessage(res.data.message)
      })
      .catch((err) => {
        setSuccess(false)
        setMessage(err.response?.data?.message || "Failed to process the SePay callback.")
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  return (
    <>
      {loading ? (
        <PaymentResultSkeleton />
      ) : success ? (
        <Card className="w-full max-w-lg shadow-gc text-center animate-fade-up">
          <CardHeader>
            <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/student")}
              className="w-full flex items-center justify-center gap-2 rounded-full shadow-gc hover:shadow-gc-lg"
            >
              <span>Return to Student Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-lg shadow-gc text-center animate-fade-up">
          <CardHeader>
            <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold">Payment Not Confirmed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/student")}
              className="w-full flex items-center justify-center gap-2 rounded-full shadow-gc hover:shadow-gc-lg"
            >
              <span>Return to Student Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default function SePayReturnPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Suspense fallback={<div>Loading transaction details...</div>}>
        <SePayReturnContent />
      </Suspense>
    </div>
  )
}
