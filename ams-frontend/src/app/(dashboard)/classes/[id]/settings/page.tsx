"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { useToast } from "@/lib/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { formatDate } from "@/components/classroom/format"
import { toApiDateTime } from "@/lib/datetime"
import type {
  AssignmentItem,
  MyClass,
  Registration,
} from "@/components/classroom/classroomTypes"
import {
  ArrowLeft,
  Archive,
  ExternalLink,
  Loader2,
  Save,
  Trash2,
  UserMinus,
} from "lucide-react"

function toDatetimeLocal(iso: string | undefined | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ClassSettingsPage() {
  const params = useParams<{ id: string }>()
  const classId = Number(params.id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const roles = user?.roles || []
  const isTeacher = roles.some((r) => r.includes("TEACHER") || r.includes("ADMIN"))

  const {
    data: cls,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: async () => (await api.get(`/subject-classes/${classId}`)).data as MyClass,
    enabled: Number.isFinite(classId),
  })

  const [className, setClassName] = useState("")
  const [section, setSection] = useState("")
  const [room, setRoom] = useState("")
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Registration | null>(null)

  useEffect(() => {
    if (!cls) return
    setClassName(cls.className || "")
    setSection(cls.term || "")
    setRoom(cls.room || "")
  }, [cls])

  useEffect(() => {
    if (!user) return
    if (!isTeacher) {
      router.replace(`/classes/${classId}`)
    }
  }, [user, isTeacher, router, classId])

  const detailsDirty = useMemo(() => {
    if (!cls) return false
    return (
      className.trim() !== (cls.className || "") ||
      section.trim() !== (cls.term || "") ||
      room.trim() !== (cls.room || "")
    )
  }, [cls, className, section, room])

  const saveDetails = useMutation({
    mutationFn: async () => {
      await api.patch(`/subject-classes/${classId}`, {
        className: className.trim(),
        section: section.trim() || undefined,
        term: section.trim() || undefined,
        room: room.trim() || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-detail", classId] })
      queryClient.invalidateQueries({ queryKey: ["teacher-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["sidebar-my-classes"] })
      toast({ title: "Class details saved", variant: "success" })
    },
    onError: (err: any) => {
      toast({
        title: "Could not save class details",
        description: err.response?.data?.message || "Try again.",
        variant: "destructive",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/subject-classes/${classId}/archive`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["sidebar-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["class-detail", classId] })
      toast({ title: "Class archived", variant: "success" })
      setArchiveOpen(false)
      router.push("/teacher")
    },
    onError: (err: any) => {
      toast({
        title: "Could not archive class",
        description: err.response?.data?.message || "Try again.",
        variant: "destructive",
      })
    },
  })

  const removeStudent = useMutation({
    mutationFn: async (studentId: number) => {
      await api.delete(`/subject-classes/${classId}/students/${studentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-people", classId] })
      queryClient.invalidateQueries({ queryKey: ["class-detail", classId] })
      toast({ title: "Student removed", variant: "success" })
      setRemoveTarget(null)
    },
    onError: (err: any) => {
      toast({
        title: "Could not remove student",
        description: err.response?.data?.message || "Try again.",
        variant: "destructive",
      })
    },
  })

  if (!isTeacher) {
    return <StatSkeleton />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href={`/classes/${classId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to class
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Class settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rename the class, manage people, edit deadlines, or archive.
        </p>
      </div>

      {isLoading ? (
        <StatSkeleton />
      ) : isError || !cls ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* Class details */}
          <section className="rounded-xl border bg-card p-5 shadow-gc">
            <h2 className="text-base font-semibold text-foreground">Class details</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Subject is read-only. Section maps to the class term.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="cls-name">Class name</Label>
                <Input
                  id="cls-name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-subject">Subject</Label>
                <Input
                  id="cls-subject"
                  value={`${cls.subjectCode} · ${cls.subjectName}`}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-section">Section / term</Label>
                <Input
                  id="cls-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Fall 2026"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="cls-room">Room</Label>
                <Input
                  id="cls-room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. A101"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => saveDetails.mutate()}
                disabled={!className.trim() || !detailsDirty || saveDetails.isPending}
              >
                {saveDetails.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save details
              </Button>
            </div>
          </section>

          {/* People */}
          <PeopleSection
            classId={classId}
            onRemove={(r) => setRemoveTarget(r)}
          />

          {/* Classwork deadlines */}
          <ClassworkSection classId={classId} />

          {/* Archive */}
          <section className="rounded-xl border border-destructive/30 bg-card p-5 shadow-gc">
            <h2 className="text-base font-semibold text-foreground">Archive class</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Soft-archive hides this class from your Teaching list. Classwork and people stay
              in the database.
            </p>
            <div className="mt-4">
              <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
                <Archive className="mr-1.5 h-4 w-4" />
                Archive class
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Remove student confirm */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove student?</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `Withdraw ${removeTarget.studentName} from this class. They will lose access.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={removeStudent.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!removeTarget || removeStudent.isPending}
              onClick={() =>
                removeTarget && removeStudent.mutate(removeTarget.studentId)
              }
            >
              {removeStudent.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="mr-1.5 h-4 w-4" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this class?</DialogTitle>
            <DialogDescription>
              {cls
                ? `"${cls.className}" will leave your Teaching list. You can still look it up by ID later.`
                : "This class will leave your Teaching list."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={archiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-4 w-4" />
              )}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PeopleSection({
  classId,
  onRemove,
}: {
  classId: number
  onRemove: (r: Registration) => void
}) {
  const {
    data: people,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-people", classId],
    queryFn: async () =>
      (await api.get(`/registrations/class/${classId}`)).data as Registration[],
  })

  const active = useMemo(
    () => (people || []).filter((r) => r.status === "ACTIVE"),
    [people]
  )

  return (
    <section className="rounded-xl border bg-card p-5 shadow-gc">
      <h2 className="text-base font-semibold text-foreground">People</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Active students enrolled in this class.
      </p>
      <div className="mt-4">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : active.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {active.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                <Avatar name={r.studentName} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.studentName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {formatDate(r.registeredAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(r)}
                >
                  <UserMinus className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No active students"
            description="Share the join code so students can enroll."
          />
        )}
      </div>
    </section>
  )
}

function ClassworkSection({ classId }: { classId: number }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const {
    data: assignments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: async () =>
      (await api.get(`/assignments/class/${classId}`)).data as AssignmentItem[],
  })

  const [drafts, setDrafts] = useState<
    Record<number, { title: string; dueAt: string }>
  >({})
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    if (!assignments) return
    const next: Record<number, { title: string; dueAt: string }> = {}
    for (const a of assignments) {
      next[a.id] = { title: a.title, dueAt: toDatetimeLocal(a.dueAt) }
    }
    setDrafts(next)
  }, [assignments])

  const saveAssignment = async (id: number) => {
    const draft = drafts[id]
    if (!draft || !draft.title.trim() || !draft.dueAt) return
    setSavingId(id)
    try {
      await api.patch(`/assignments/${id}`, {
        title: draft.title.trim(),
        dueAt: toApiDateTime(draft.dueAt),
      })
      queryClient.invalidateQueries({ queryKey: ["class-assignments", classId] })
      toast({ title: "Assignment updated", variant: "success" })
    } catch (err: any) {
      toast({
        title: "Could not update assignment",
        description: err.response?.data?.message || "Try again.",
        variant: "destructive",
      })
    } finally {
      setSavingId(null)
    }
  }

  const isDirty = (a: AssignmentItem) => {
    const d = drafts[a.id]
    if (!d) return false
    return d.title.trim() !== a.title || d.dueAt !== toDatetimeLocal(a.dueAt)
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-gc">
      <h2 className="text-base font-semibold text-foreground">Classwork deadlines</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Edit title and due date for assignments in this class.
      </p>
      <div className="mt-4">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : assignments && assignments.length > 0 ? (
          <ul className="space-y-3">
            {assignments.map((a) => {
              const d = drafts[a.id] || { title: a.title, dueAt: toDatetimeLocal(a.dueAt) }
              const dirty = isDirty(a)
              return (
                <li
                  key={a.id}
                  className="rounded-lg border p-3 sm:p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`asg-title-${a.id}`}>Title</Label>
                        <Input
                          id={`asg-title-${a.id}`}
                          value={d.title}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [a.id]: { ...d, title: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`asg-due-${a.id}`}>Due</Label>
                        <Input
                          id={`asg-due-${a.id}`}
                          type="datetime-local"
                          value={d.dueAt}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [a.id]: { ...d, dueAt: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button asChild variant="ghost" size="sm" className="px-0">
                          <Link href={`/classes/${classId}/assignments/${a.id}`}>
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Open assignment
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={!dirty || !d.title.trim() || !d.dueAt || savingId === a.id}
                      onClick={() => saveAssignment(a.id)}
                    >
                      {savingId === a.id ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="No classwork yet"
            description="Create assignments from the Classwork tab."
          />
        )}
      </div>
    </section>
  )
}
