"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { SubjectItem, TemplateItem } from "@/components/classroom/classroomTypes"
import { assignmentService } from "@/services/assignment.service"
import { courseService } from "@/services/course.service"
import type { ExpertDashboard } from "@/types"
import {
  FolderKanban,
  Layers,
  Plus,
  Loader2,
  FileText,
  ScrollText,
} from "lucide-react"

export default function ExpertDashboardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [subjectId, setSubjectId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [defaultDueRule, setDefaultDueRule] = useState("Weekly")

  const { data: stats, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["expert-stats"],
    queryFn: async () => (await api.get("/dashboard/expert")).data as ExpertDashboard,
  })

  const {
    data: publishedCourses,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["expert-published-courses"],
    queryFn: async () =>
      (await courseService.listPublic({ size: 50 })).content,
  })

  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["expert-templates"],
    queryFn: async () => (await assignmentService.getTemplates(0, 50)).content,
  })

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/subjects")).data as SubjectItem[],
    enabled: open,
  })

  const createTemplate = useMutation({
    mutationFn: async () =>
      assignmentService.createTemplate({
        subjectId: parseInt(subjectId),
        title: title.trim(),
        instructions: instructions.trim(),
        defaultDueRule: defaultDueRule.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-templates"] })
      queryClient.invalidateQueries({ queryKey: ["expert-stats"] })
      toast({ title: "Template created", variant: "success" })
      setOpen(false)
      setTitle("")
      setInstructions("")
      setDefaultDueRule("Weekly")
      setSubjectId("")
    },
    onError: (err: any) => {
      toast({
        title: "Could not create template",
        description: err.response?.data?.message || "Please check the form.",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expert dashboard</h2>
          <p className="text-muted-foreground">
            Review published courses and build reusable assignment blueprints.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New template
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Courses</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedCourses}</div>
                <p className="text-xs text-muted-foreground">courses live in the catalog</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <Layers className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">reusable assignment blueprints</p>
              </CardContent>
            </Card>
          </>
        ) : statsError ? (
          <ErrorState onRetry={() => refetchStats()} />
        ) : (
          <>
            <StatSkeleton />
            <StatSkeleton />
          </>
        )}
      </div>

      {/* Published courses */}
      <section id="courses">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight">Published courses</h3>
          <p className="text-sm text-muted-foreground">
            Read-only overview of the live course catalog.
          </p>
        </div>
        {coursesError ? (
          <ErrorState onRetry={() => refetchCourses()} />
        ) : coursesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : publishedCourses && publishedCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedCourses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {c.code}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {c.isFree || c.price === 0 ? "Free" : `${c.price} VND`}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 font-medium text-foreground">{c.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {c.categoryName} · by {c.instructorName}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published courses"
            description="Courses appear here once teachers publish them."
          />
        )}
      </section>

      {/* Templates manager */}
      <section id="templates">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" /> Assignment templates
            </CardTitle>
            <CardDescription>
              Blueprints your teachers can reuse when publishing coursework
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templatesError ? (
              <ErrorState onRetry={() => refetchTemplates()} />
            ) : templatesLoading ? (
              <TableSkeleton rows={3} cols={3} />
            ) : templates && templates.length > 0 ? (
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{t.title}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t.subjectName} · by {t.expertName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t.defaultDueRule || "Custom due date"}
                      </span>
                    </div>
                    {t.instructions && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {t.instructions}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No templates yet"
                description="Create your first assignment blueprint."
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Create template dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setTitle("")
            setInstructions("")
            setDefaultDueRule("Weekly")
            setSubjectId("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New assignment template</DialogTitle>
            <DialogDescription>
              A reusable blueprint: subject, instructions, and a default due rule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects || []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.subjectCode} · {s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Lab report #1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Instructions</Label>
              <Textarea
                placeholder="Guidance students should follow…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Default due rule</Label>
              <Input
                placeholder="e.g. Weekly, 2 weeks, End of term"
                value={defaultDueRule}
                onChange={(e) => setDefaultDueRule(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTemplate.mutate()}
              disabled={!subjectId || !title.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Create template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
