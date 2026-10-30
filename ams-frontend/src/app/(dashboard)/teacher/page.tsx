"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useToast } from "@/lib/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatSkeleton, TableSkeleton } from "@/components/ui/loading"
import { ClassCard } from "@/components/classroom/ClassCard"
import { CreateClassDialog } from "@/components/classroom/CreateClassDialog"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { MyClass } from "@/components/classroom/classroomTypes"
import {
  FolderKanban,
  FileText,
  Hourglass,
  CheckCircle2,
  Plus,
  Loader2,
  ClipboardList,
} from "lucide-react"

export default function TeacherDashboardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [maxScore, setMaxScore] = useState("10")
  const [classId, setClassId] = useState<string>("")

  const { data: stats, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => (await api.get("/dashboard/teacher")).data,
  })

  const {
    data: myClasses,
    isLoading: classesLoading,
    isError: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["teacher-my-classes"],
    queryFn: async () => (await api.get("/subject-classes/my")).data as MyClass[],
  })

  const createAssignment = useMutation({
    mutationFn: async () => {
      await api.post("/assignments", {
        title: title.trim(),
        instructions: instructions.trim(),
        dueAt,
        maxScore: Number(maxScore) || 10,
        subjectClassId: classId ? Number(classId) : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-my-classes"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
      toast({ title: "Classwork created", variant: "success" })
      setTitle("")
      setInstructions("")
      setDueAt("")
      setMaxScore("10")
    },
    onError: (err: any) => {
      toast({
        title: "Could not create classwork",
        description: err.response?.data?.message || "Please check the form.",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teacher dashboard</h2>
          <p className="text-muted-foreground">
            Manage your classes, publish classwork, and grade submissions.
          </p>
        </div>
        <CreateClassDialog />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">class sections assigned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">classwork published</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Grade</CardTitle>
                <Hourglass className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingEvaluations}</div>
                <p className="text-xs text-muted-foreground">awaiting a score</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Graded</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedEvaluations}</div>
                <p className="text-xs text-muted-foreground">evaluations completed</p>
              </CardContent>
            </Card>
          </>
        ) : statsError ? (
          <ErrorState onRetry={() => refetchStats()} />
        ) : (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        )}
      </div>

      {/* New classwork */}
      <section id="new-assignment">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Publish new classwork
            </CardTitle>
            <CardDescription>Create an assignment and attach it to one of your classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Weekly programming exercise"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Assign to class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional — pick a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(myClasses || []).map((c) => (
                      <SelectItem key={c.id} value={String(c.classId ?? c.id)}>
                        {c.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Due date &amp; time *</Label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Max score</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Instructions</Label>
                <Textarea
                  placeholder="What should students do? Which file type to submit?"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <Button
                onClick={() => createAssignment.mutate()}
                disabled={!title || !dueAt || createAssignment.isPending}
              >
                {createAssignment.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Create classwork
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* My classes */}
      <section id="classes">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight">My classes</h3>
          <p className="text-sm text-muted-foreground">
            Open a class to manage its stream, assignments, and people.
          </p>
        </div>
        {classesError ? (
          <ErrorState onRetry={() => refetchClasses()} />
        ) : classesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : myClasses && myClasses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClasses.map((c) => (
              <ClassCard key={c.classId ?? c.id} data={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            description="Create a class to start publishing classwork."
          />
        )}
      </section>

      {stats && stats.pendingEvaluations > 0 && (
        <p className="text-sm text-muted-foreground">
          Tip: open a class and go to the <strong>Assignments</strong> tab to grade pending submissions.
        </p>
      )}
    </div>
  )
}
