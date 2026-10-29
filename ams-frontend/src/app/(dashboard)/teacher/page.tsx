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
import { FileText, CheckCircle2, Clock, ExternalLink, Award, Plus, Loader2 } from "lucide-react"

export default function TeacherDashboardPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)

  // Grading form state
  const [evalSubmissionId, setEvalSubmissionId] = useState<number | null>(null)
  const [evalScore, setEvalScore] = useState("")
  const [evalFeedback, setEvalFeedback] = useState("")

  // New assignment state
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [dueDays, setDueDays] = useState("7")
  const [targetClassId, setTargetClassId] = useState<string>("")

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => (await api.get("/dashboard/teacher")).data,
  })

  // Assignments
  const { data: assignments } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => (await api.get("/assignments")).data,
  })

  // Classes for allocation
  const { data: classes } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => (await api.get("/subject-classes")).data,
  })

  // Submissions for selected assignment
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["submissions", selectedAssignmentId],
    queryFn: async () => (await api.get(`/submissions/assignment/${selectedAssignmentId}`)).data,
    enabled: !!selectedAssignmentId,
  })

  // Create Assignment Mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const dueAt = new Date()
      dueAt.setDate(dueAt.getDate() + parseInt(dueDays))

      await api.post("/assignments", {
        title,
        instructions,
        dueAt: dueAt.toISOString(),
        subjectClassId: targetClassId ? parseInt(targetClassId) : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
      setTitle("")
      setInstructions("")
      toast({
        title: "Đã tạo bài tập",
        description: "Bài tập được phát thành công.",
        variant: "success",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Tạo bài tập thất bại",
        description: err.response?.data?.message || "Kiểm tra lại thông tin",
        variant: "destructive",
      })
    },
  })

  // Grade Submission Mutation
  const gradeMutation = useMutation({
    mutationFn: async () => {
      await api.post("/evaluations", {
        submissionId: evalSubmissionId,
        score: parseFloat(evalScore),
        feedback: evalFeedback,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", selectedAssignmentId] })
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] })
      setEvalSubmissionId(null)
      setEvalScore("")
      setEvalFeedback("")
      toast({
        title: "Đã chấm điểm",
        description: `Điểm của bài nộp #${evalSubmissionId} đã được lưu.`,
        variant: "success",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Chấm điểm thất bại",
        description: err.response?.data?.message || "Không thể lưu đánh giá",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teacher Workspace</h2>
        <p className="text-muted-foreground">Manage classroom assignments, review student submissions, and grade work.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats ? (
          <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Active in your classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Classes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching sections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pendingEvaluations || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your grading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Work</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.completedEvaluations || 0}</div>
            <p className="text-xs text-muted-foreground">Evaluations published</p>
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Assignment List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Course Assignments</CardTitle>
            <CardDescription>Select an assignment to inspect and grade student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments === undefined ? (
              <TableSkeleton rows={4} cols={3} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Title</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.map((a: any) => (
                  <TableRow
                    key={a.id}
                    className={selectedAssignmentId === a.id ? "bg-muted/80 font-semibold" : ""}
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{a.instructions}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(a.dueAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={selectedAssignmentId === a.id ? "default" : "outline"}
                        onClick={() => setSelectedAssignmentId(a.id)}
                      >
                        View Submissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Assignment
            </CardTitle>
            <CardDescription>Publish a new coursework task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Assignment Title</Label>
              <Input
                placeholder="e.g. Lab 2 - REST API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Instructions</Label>
              <Input
                placeholder="Submission guidelines..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Due in (Days)</Label>
              <Input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Allocate to Class</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.classCode} - {c.className}
                  </option>
                ))}
              </select>
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => createAssignmentMutation.mutate()}
              disabled={!title || createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Đang phát bài...
                </>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Section */}
      {selectedAssignmentId && (
        <Card className="border-primary/40 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Student Submissions</CardTitle>
            <CardDescription>
              Review uploaded files stored in Cloudinary and assign official grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading submissions...</p>
            ) : submissions?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student submissions found for this assignment yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded Cloud File</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">{s.studentName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.submissionStatus === "GRADED" ? "success" : "warning"}>
                          {s.submissionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.secureFileReference ? (
                          <a
                            href={s.secureFileReference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>View Cloudinary File</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No file</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {s.evaluation?.score !== undefined ? `${s.evaluation.score}/10` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {s.evaluation?.feedback || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEvalSubmissionId(s.id)
                            setEvalScore(s.evaluation?.score?.toString() || "")
                            setEvalFeedback(s.evaluation?.feedback || "")
                          }}
                        >
                          <Award className="h-3.5 w-3.5 mr-1" />
                          {s.evaluation ? "Re-grade" : "Grade"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Grading Form Modal / Inline */}
            {evalSubmissionId && (
              <div className="mt-6 rounded-lg border bg-muted/40 p-4 space-y-3">
                <h4 className="font-semibold text-sm">Grading Submission #{evalSubmissionId}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label>Score (0 - 10)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8.5"
                      value={evalScore}
                      onChange={(e) => setEvalScore(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label>Constructive Feedback</Label>
                    <Input
                      placeholder="Comment on submission..."
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEvalSubmissionId(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => gradeMutation.mutate()}
                    disabled={!evalScore || gradeMutation.isPending}
                  >
                    {gradeMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu điểm & nhận xét"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
