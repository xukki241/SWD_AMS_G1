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
import { FileText, Plus, BookOpen, Clock } from "lucide-react"

export default function ExpertDashboardPage() {
  const queryClient = useQueryClient()
  const [subjectId, setSubjectId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [defaultDueRule, setDefaultDueRule] = useState("14 days after release")

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["expert-stats"],
    queryFn: async () => (await api.get("/dashboard/expert")).data,
  })

  // Subjects
  const { data: subjects } = useQuery({
    queryKey: ["expert-subjects"],
    queryFn: async () => (await api.get("/subjects")).data,
  })

  // Templates
  const { data: templates } = useQuery({
    queryKey: ["expert-templates"],
    queryFn: async () => (await api.get("/assignment-templates")).data,
  })

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      await api.post("/assignment-templates", {
        subjectId: parseInt(subjectId),
        title,
        instructions,
        defaultDueRule,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-templates"] })
      setTitle("")
      setInstructions("")
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subject Matter Expert Workspace</h2>
        <p className="text-muted-foreground">Standardize academic curriculum with reusable Assignment Templates.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Templates</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTemplates || 0}</div>
            <p className="text-xs text-muted-foreground">Standardized blueprints available to teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Supervision</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.managedClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Classes operating with expert content</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Template List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Standard Assignment Templates</CardTitle>
            <CardDescription>Blueprints designed for subject courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Default Schedule</TableHead>
                  <TableHead>Expert Author</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{t.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.instructions}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.subjectName}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {t.defaultDueRule}
                    </TableCell>
                    <TableCell className="text-xs">{t.expertName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Assignment Blueprint
            </CardTitle>
            <CardDescription>Author a reusable assignment guideline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Target Subject</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">-- Choose Subject --</option>
                {subjects?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectCode} - {s.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Template Title</Label>
              <Input
                placeholder="e.g. Midterm Sprint Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Detailed Instructions</Label>
              <Input
                placeholder="Requirement details..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Default Due Rule</Label>
              <Input
                placeholder="e.g. 14 days after assignment"
                value={defaultDueRule}
                onChange={(e) => setDefaultDueRule(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => createTemplateMutation.mutate()}
              disabled={!subjectId || !title || createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? "Saving..." : "Publish Template"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
