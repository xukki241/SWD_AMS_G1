"use client"

import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Loader2 } from "lucide-react"

export function JoinClassDialog({
  trigger,
  defaultLabel = "Join a class",
}: {
  trigger?: React.ReactNode
  defaultLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reset = () => {
    setCode("")
    setError(null)
  }

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.post("/registrations/join", { code: trimmed })
      const status: string = res.data.status
      queryClient.invalidateQueries({ queryKey: ["student-registrations"] })
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["student-stats"] })
      if (status === "ACTIVE") {
        toast({
          title: "Enrolled",
          description: `You joined ${res.data.className}. This class is free — you are now active.`,
          variant: "success",
        })
      } else {
        toast({
          title: "Joining… payment needed",
          description: `You joined ${res.data.className}. Complete the tuition payment to activate it.`,
        })
      }
      setOpen(false)
      reset()
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (err.response?.status === 409) {
        setError(
          msg || "You are already in this class or the class is full."
        )
      } else if (err.response?.status === 404) {
        setError(msg || "No class found for that code.")
      } else {
        setError(msg || "Could not join the class. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button>
            <KeyRound className="h-4 w-4 mr-1.5" />
            {defaultLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find a class</DialogTitle>
          <DialogDescription>
            Enter the 6-character join code your teacher shared. Free classes enroll
            you instantly; paid classes ask you to pay tuition first.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="join-code">Join code</Label>
            <Input
              id="join-code"
              placeholder="e.g. K7Q2M9"
              value={code}
              maxLength={8}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="font-mono uppercase tracking-widest text-center text-lg"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={submitting || !code.trim()}>
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Join class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default JoinClassDialog
