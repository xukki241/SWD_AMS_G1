"use client"

import React, { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { ClassCard } from "@/components/classroom/ClassCard"
import { CreateClassDialog } from "@/components/classroom/CreateClassDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { formatDateTime, formatVnd } from "@/components/classroom/format"
import {
  AdminDashboard,
  AuditLogEntry,
  MyClass,
  Subject,
  UserInfo,
} from "@/components/classroom/classroomTypes"
import {
  Users,
  BookMarked,
  FolderKanban,
  Loader2,
  Plus,
  ScrollText,
} from "lucide-react"

const ROLE_OPTIONS = ["ROLE_STUDENT", "ROLE_TEACHER", "ROLE_EXPERT", "ROLE_ADMIN"]

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("users")

  // Keep the sidebar hash links (#users, #subjects, …) and the tabs in sync.
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "")
      if (["users", "subjects", "classes", "audit"].includes(hash)) setTab(hash)
    }
    syncFromHash()
    window.addEventListener("hashchange", syncFromHash)
    return () => window.removeEventListener("hashchange", syncFromHash)
  }, [])

  const changeTab = (value: string) => {
    setTab(value)
    if (window.history.replaceState) {
      window.history.replaceState(null, "", `${window.location.pathname}#${value}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin dashboard</h2>
        <p className="text-muted-foreground">
          Manage users, subjects, classes, and review the audit trail.
        </p>
      </div>

      <AdminKpis />

      <Tabs value={tab} onValueChange={changeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-1.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookMarked className="h-4 w-4 mr-1.5" /> Subjects
          </TabsTrigger>
          <TabsTrigger value="classes">
            <FolderKanban className="h-4 w-4 mr-1.5" /> Classes
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="h-4 w-4 mr-1.5" /> Audit trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
        <TabsContent value="classes">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------- KPI cards ---------------- */

function AdminKpis() {
  const {
    data: stats,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () =>
      (await api.get("/dashboard/admin")).data as AdminDashboard,
  })

  if (isError) return <ErrorState onRetry={() => refetch()} />

  const cards = stats
    ? [
        {
          label: "Users",
          value: stats.totalUsers,
          hint: `${stats.totalStudents} students · ${stats.totalTeachers} teachers · ${stats.totalExperts} experts`,
        },
        { label: "Subjects", value: stats.totalSubjects, hint: "catalog entries" },
        { label: "Classes", value: stats.totalClasses, hint: "class sections" },
        { label: "Registrations", value: stats.totalRegistrations, hint: "enrollments" },
      ]
    : null

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards ? (
        cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{c.value}</div>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <>
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </>
      )}
    </div>
  )
}

/* ---------------- Users tab ---------------- */

function UsersTab() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({})

  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/users")).data as UserInfo[],
  })

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await api.post(`/users/${userId}/roles`, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Role assigned", variant: "success" })
    },
    onError: (err: any) => {
      toast({
        title: "Could not assign role",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users &amp; roles</CardTitle>
        <CardDescription>
          Assign a role to a user — the role is added alongside any existing roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Assign role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {u.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {r.replace("ROLE_", "")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.accountStatus === "ACTIVE" ? "success" : "destructive"
                        }
                        className="text-xs"
                      >
                        {u.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={selectedRoles[u.id] || ""}
                          onValueChange={(v) =>
                            setSelectedRoles((s) => ({ ...s, [u.id]: v }))
                          }
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Pick a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r.replace("ROLE_", "")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            assignRole.mutate({ userId: u.id, role: selectedRoles[u.id] })
                          }
                          disabled={!selectedRoles[u.id] || assignRole.isPending}
                        >
                          {assignRole.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------------- Subjects tab ---------------- */

function SubjectsTab() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<string>("ACTIVE")

  const {
    data: subjects,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => (await api.get("/subjects")).data as Subject[],
  })

  const createSubject = useMutation({
    mutationFn: async () => {
      await api.post("/subjects", {
        subjectCode: code.trim(),
        subjectName: name.trim(),
        description: description.trim() || undefined,
        status: status as "ACTIVE" | "INACTIVE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["subjects"] })
      toast({ title: "Subject created", variant: "success" })
      setCode("")
      setName("")
      setDescription("")
      setStatus("ACTIVE")
    },
    onError: (err: any) => {
      toast({
        title: "Could not create subject",
        description: err.response?.data?.message || "Please check the form.",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>The subject catalog available to class creators</CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : subjects && subjects.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.subjectCode}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.subjectName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === "ACTIVE" ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No subjects yet" description="Add the first subject to get started." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Code *</Label>
            <Input placeholder="e.g. CS402" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. Web Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => createSubject.mutate()}
            disabled={!code.trim() || !name.trim() || createSubject.isPending}
          >
            {createSubject.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Create subject
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- Classes tab ---------------- */

function ClassesTab() {
  const {
    data: allClasses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => (await api.get("/subject-classes")).data as MyClass[],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every class section, with its join code, capacity, and tuition fee.
        </p>
        <CreateClassDialog />
      </div>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : allClasses && allClasses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allClasses.map((c) => (
            <div key={c.id} className="relative">
              <ClassCard data={c} />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5 font-mono">
                  join: {c.joinCode}
                </span>
                <span>
                  capacity {c.capacity > 0 ? c.capacity : "unlimited"}
                </span>
                <span>fee {formatVnd(c.registrationFee)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classes yet"
          description="Create the first class section."
        />
      )}
    </div>
  )
}

/* ---------------- Audit tab ---------------- */

function AuditTab() {
  const {
    data: logs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await api.get("/audit-logs")).data as AuditLogEntry[],
  })

  const shown = (logs || []).slice(0, 50)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>
          The most recent {shown.length} system events (newest first)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : shown.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(l.occurredAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{l.action}</TableCell>
                    <TableCell className="text-muted-foreground">{l.resourceType}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.resourceReference || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No audit events" description="Actions will appear here as they happen." />
        )}
      </CardContent>
    </Card>
  )
}
