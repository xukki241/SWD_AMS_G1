"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { useToast } from "@/lib/use-toast"
import { Users, BookOpen, Layers, ShieldAlert, Plus, Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"users" | "subjects" | "classes" | "audit">("users")

  // New subject state
  const [newSubCode, setNewSubCode] = useState("")
  const [newSubName, setNewSubName] = useState("")
  const [newSubDesc, setNewSubDesc] = useState("")

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/dashboard/admin")).data,
  })

  // Fetch Users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/users")).data,
  })

  // Fetch Subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => (await api.get("/subjects")).data,
  })

  // Fetch Classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => (await api.get("/subject-classes")).data,
  })

  // Fetch Audit Logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await api.get("/audit-logs")).data,
    enabled: activeTab === "audit",
  })

  // Create Subject Mutation
  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      await api.post("/subjects", {
        subjectCode: newSubCode,
        subjectName: newSubName,
        description: newSubDesc,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      setNewSubCode("")
      setNewSubName("")
      setNewSubDesc("")
      toast({
        title: "Đã thêm môn học",
        description: `${newSubCode} - ${newSubName} đã được tạo.`,
        variant: "success",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Thêm môn học thất bại",
        description: err.response?.data?.message || "Mã môn học có thể đã tồn tại",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Administration Dashboard</h2>
        <p className="text-muted-foreground">Manage user accounts, academic curricula, classes, and system audit logs.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalStudents || 0} Students, {stats?.totalTeachers || 0} Teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curriculum Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Active academic courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Offerings</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">{stats.totalRegistrations} Total registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Governance</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Immutable</div>
            <p className="text-xs text-muted-foreground">All actions recorded</p>
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant={activeTab === "users" ? "default" : "outline"} onClick={() => setActiveTab("users")} size="sm">
          Users & Roles
        </Button>
        <Button variant={activeTab === "subjects" ? "default" : "outline"} onClick={() => setActiveTab("subjects")} size="sm">
          Subjects
        </Button>
        <Button variant={activeTab === "classes" ? "default" : "outline"} onClick={() => setActiveTab("classes")} size="sm">
          Subject Classes
        </Button>
        <Button variant={activeTab === "audit" ? "default" : "outline"} onClick={() => setActiveTab("audit")} size="sm">
          Audit Trail
        </Button>
      </div>

      {/* Tab: Users */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>System Accounts</CardTitle>
            <CardDescription>All registered users and their assigned roles</CardDescription>
          </CardHeader>
          <CardContent>
            {users === undefined ? (
              <TableSkeleton rows={5} cols={4} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.id}</TableCell>
                    <TableCell className="font-semibold">{u.username}</TableCell>
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.accountStatus === "ACTIVE" ? "success" : "destructive"}>
                        {u.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      {u.roles?.map((r: string) => (
                        <Badge key={r} variant="secondary" className="text-[10px]">
                          {r.replace("ROLE_", "")}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Subjects */}
      {activeTab === "subjects" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Subject Catalog</CardTitle>
              <CardDescription>Academic courses defined in AMS</CardDescription>
            </CardHeader>
            <CardContent>
              {subjects === undefined ? (
                <TableSkeleton rows={3} cols={4} />
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-bold text-primary">{s.subjectCode}</TableCell>
                      <TableCell className="font-semibold">{s.subjectName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.description}</TableCell>
                      <TableCell>
                        <Badge variant="success">{s.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Subject
              </CardTitle>
              <CardDescription>Register a new academic subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Subject Code</Label>
                <Input placeholder="e.g. PRN231" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Subject Name</Label>
                <Input placeholder="Building Distributed Apps" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input placeholder="Course description..." value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} />
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => createSubjectMutation.mutate()}
                disabled={!newSubCode || !newSubName || createSubjectMutation.isPending}
              >
                {createSubjectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Save Subject"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Classes */}
      {activeTab === "classes" && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Classes</CardTitle>
            <CardDescription>Scheduled classes, assigned teachers, and academic terms</CardDescription>
          </CardHeader>
          <CardContent>
            {classes === undefined ? (
              <TableSkeleton rows={4} cols={5} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Expert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-primary">{c.classCode}</TableCell>
                    <TableCell className="font-semibold">{c.className}</TableCell>
                    <TableCell>{c.subjectCode} - {c.subjectName}</TableCell>
                    <TableCell><Badge variant="outline">{c.term}</Badge></TableCell>
                    <TableCell>{c.teacherName || "Unassigned"}</TableCell>
                    <TableCell>{c.expertName || "Unassigned"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Audit Log */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle>Security & Governance Audit Trail</CardTitle>
            <CardDescription>Append-only audit log of critical system operations</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs === undefined ? (
              <TableSkeleton rows={5} cols={4} />
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hành động nào được ghi nhận.</p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Reference / Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {new Date(log.occurredAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{log.resourceType}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.resourceReference}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
