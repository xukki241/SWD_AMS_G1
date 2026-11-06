"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { CourseStatusBadge } from "@/components/courses/CourseStatusBadge"
import { formatDateTime, formatVnd } from "@/components/classroom/format"
import { AuditLogEntry, UserInfo } from "@/components/classroom/classroomTypes"
import { getApiErrorMessage, formatNumber, roleLabel, useI18n } from "@/i18n"
import { courseService } from "@/services/course.service"
import type { AdminDashboard, CourseSummary } from "@/types"
import {
  Users,
  FolderKanban,
  Loader2,
  ScrollText,
  GraduationCap,
  ClipboardList,
} from "lucide-react"

const ROLE_OPTIONS = ["ROLE_STUDENT", "ROLE_TEACHER", "ROLE_ADMIN"]

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState("users")

  // Keep the sidebar hash links (#users, #courses, …) and the tabs in sync.
  useEffect(() => {
    const syncFromHash = () => {
      let hash = window.location.hash.replace("#", "")
      // Legacy #classes bookmarks land on the courses tab.
      if (hash === "classes") hash = "courses"
      if (["users", "courses", "audit"].includes(hash)) setTab(hash)
      // Legacy #subjects bookmarks land on users (accounts-only admin).
      if (hash === "subjects") setTab("users")
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
        <h2 className="text-3xl font-bold tracking-tight">{t("dashboard.admin.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.admin.subtitle")}</p>
      </div>

      <AdminKpis />

      <Tabs value={tab} onValueChange={changeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-1.5" /> {t("dashboard.admin.tabs.users")}
          </TabsTrigger>
          <TabsTrigger value="courses">
            <FolderKanban className="h-4 w-4 mr-1.5" /> {t("dashboard.admin.tabs.courses")}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="h-4 w-4 mr-1.5" /> {t("dashboard.admin.tabs.audit")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="courses">
          <CoursesTab />
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
  const { t } = useI18n()
  const {
    data: stats,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/dashboard/admin")).data as AdminDashboard,
  })

  if (isError) return <ErrorState onRetry={() => refetch()} />

  const cards = stats
    ? [
        {
          label: t("dashboard.admin.kpi.users"),
          value: formatNumber(stats.totalUsers),
          hint: t("dashboard.admin.kpi.usersHint", {
            students: formatNumber(stats.totalStudents),
            teachers: formatNumber(stats.totalTeachers),
          }),
        },
        {
          label: t("dashboard.admin.kpi.courses"),
          value: formatNumber(stats.totalCourses),
          hint: t("dashboard.admin.kpi.coursesHint"),
        },
        {
          label: t("dashboard.admin.kpi.enrollments"),
          value: formatNumber(stats.totalEnrollments),
          hint: t("dashboard.admin.kpi.enrollmentsHint"),
        },
        {
          label: t("dashboard.admin.kpi.subjects"),
          value: formatNumber(stats.totalSubjects),
          hint: t("dashboard.admin.kpi.subjectsHint"),
        },
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
  const { t } = useI18n()
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
      toast({ title: t("dashboard.admin.users.roleAssigned"), variant: "success" })
    },
    onError: (err: any) => {
      toast({
        title: t("dashboard.admin.users.roleAssignFailed"),
        description: getApiErrorMessage(err, t("common.actions.tryAgain")),
        variant: "destructive",
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.admin.users.title")}</CardTitle>
        <CardDescription>{t("dashboard.admin.users.description")}</CardDescription>
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
                  <TableHead>{t("dashboard.admin.users.id")}</TableHead>
                  <TableHead>{t("dashboard.admin.users.name")}</TableHead>
                  <TableHead>{t("dashboard.admin.users.email")}</TableHead>
                  <TableHead>{t("dashboard.admin.users.roles")}</TableHead>
                  <TableHead>{t("dashboard.admin.users.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("dashboard.admin.users.assignRole")}
                  </TableHead>
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
                            {roleLabel(r)}
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
                        {u.accountStatus === "ACTIVE"
                          ? t("common.status.active")
                          : u.accountStatus === "INACTIVE"
                            ? t("common.status.inactive")
                            : u.accountStatus === "SUSPENDED"
                              ? t("common.status.suspended")
                              : u.accountStatus}
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
                            <SelectValue placeholder={t("dashboard.admin.users.pickRole")} />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {roleLabel(r)}
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
                            t("dashboard.admin.users.apply")
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

/* ---------------- Courses tab (read-only) ---------------- */

function CoursesTab() {
  const { t } = useI18n()
  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await courseService.list({ page: 0, size: 50 })).content,
  })

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("dashboard.admin.courses.description")}
      </p>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <AdminCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("dashboard.admin.courses.emptyTitle")}
          description={t("dashboard.admin.courses.emptyDescription")}
        />
      )}
    </div>
  )
}

function AdminCourseCard({ course }: { course: CourseSummary }) {
  const { t } = useI18n()
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex h-20 items-end rounded-t-xl bg-primary/90 p-3">
        <span className="line-clamp-2 text-base font-semibold text-primary-foreground">
          {course.title}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {course.code}
          </span>
          <CourseStatusBadge status={course.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {course.instructorName} · {course.categoryName}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {course.difficultyLevel === "BEGINNER"
              ? t("dashboard.difficulty.beginner")
              : course.difficultyLevel === "INTERMEDIATE"
                ? t("dashboard.difficulty.intermediate")
                : t("dashboard.difficulty.advanced")}
          </span>
          <span className="font-medium text-foreground">{formatVnd(course.price)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ---------------- Audit tab ---------------- */

function AuditTab() {
  const { t } = useI18n()
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
        <CardTitle>{t("dashboard.nav.auditTrail")}</CardTitle>
        <CardDescription>
          {t("dashboard.admin.audit.recent", { count: shown.length })}
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
                  <TableHead>{t("dashboard.admin.audit.when")}</TableHead>
                  <TableHead>{t("dashboard.admin.audit.action")}</TableHead>
                  <TableHead>{t("dashboard.admin.audit.resource")}</TableHead>
                  <TableHead>{t("dashboard.admin.audit.ref")}</TableHead>
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
          <EmptyState
            title={t("dashboard.admin.audit.emptyTitle")}
            description={t("dashboard.admin.audit.emptyDescription")}
          />
        )}
      </CardContent>
    </Card>
  )
}
