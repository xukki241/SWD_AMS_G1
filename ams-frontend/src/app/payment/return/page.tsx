"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    api.get("/payment/vnpay-return", { params })
      .then((res) => {
        setSuccess(res.data.success)
        setMessage(res.data.message)
      })
      .catch((err) => {
        setSuccess(false)
        setMessage(err.response?.data?.message || "Failed to process payment callback.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams])

  return (
    <Card className="w-full max-w-lg shadow-xl text-center">
      <CardHeader>
        {loading ? (
          <div className="mx-auto my-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        ) : success ? (
          <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        ) : (
          <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-10 w-10" />
          </div>
        )}

        <CardTitle className="text-2xl font-bold">
          {loading ? "Verifying Transaction..." : success ? "Payment Successful!" : "Payment Failed"}
        </CardTitle>
        <CardDescription>
          {loading ? "Please wait while we confirm your payment with VNPay Sandbox." : message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && (
          <Button onClick={() => router.push("/student")} className="w-full flex items-center justify-center gap-2">
            <span>Return to Student Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function PaymentReturnPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Suspense fallback={<div>Loading transaction details...</div>}>
        <PaymentContent />
      </Suspense>
    </div>
  )
}
