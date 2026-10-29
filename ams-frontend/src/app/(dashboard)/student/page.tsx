"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GraduationCap,
  CreditCard,
  FileText,
  Award,
  Upload,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

export default function StudentDashboardPage() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadRegId, setUploadRegId] = useState<number | null>(null)
  const [uploadAssignId, setUploadAssignId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [payLoadingId, setPayLoadingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => (await api.get("/dashboard/student")).data,
  })

  // Available Classes
  const { data: availableClasses } = useQuery({
    queryKey: ["student-available-classes"],
    queryFn: async () => (await api.get("/subject-classes")).data,
  })

  // My Registrations
  const { data: myRegistrations } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: async () => (await api.get("/registrations/my")).data,
  })

  // My Submissions
  const { data: mySubmissions } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: async () => (await api.get("/submissions/my")).data,
  })

  // Register for a class
  const registerMutation = useMutation({
    mutationFn: async (subjectClassId: number) => {
      return (await api.post("/registrations", { subjectClassId })).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-registrations"] })
      queryClient.invalidateQueries({ queryKey: ["student-stats"] })
      setMessage("Class registered successfully! Please proceed to payment to activate access.")
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || "Registration failed")
    },
  })

  // Initiate VNPay Sandbox Payment
  const handlePayVNPay = async (registrationId: number) => {
    setPayLoadingId(registrationId)
    try {
      const res = await api.post(`/payment/create/${registrationId}`)
      const paymentUrl = res.data.paymentUrl
      // Redirect to VNPay Sandbox Payment Gateway
      window.location.href = paymentUrl
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to initiate payment")
      setPayLoadingId(null)
    }
  }

  // Upload Assignment Submission to Cloudinary
  const handleUploadSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadRegId || !uploadAssignId) return

    setUploading(true)
    const formData = new FormData()
    formData.append("classRegistrationId", uploadRegId.toString())
    formData.append("assignmentId", uploadAssignId.toString())
    formData.append("file", selectedFile)

    try {
      await api.post("/submissions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] })
      queryClient.invalidateQueries({ queryKey: ["student-stats"] })
      setSelectedFile(null)
      setUploadRegId(null)
      setUploadAssignId(null)
      setMessage("Assignment successfully submitted and uploaded to Cloudinary!")
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Submission failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Student Portal</h2>
        <p className="text-muted-foreground">Enroll in courses, pay tuition via VNPay, submit coursework, and view results.</p>
      </div>

      {message && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 text-sm text-primary">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeClasses || 0} active & paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tuition Status</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.activeClasses > 0 ? "Enrolled" : "Pending"}
            </div>
            <p className="text-xs text-muted-foreground">VNPay Gateway verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coursework Submitted</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.submittedAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.gradedAssignments || 0} Graded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumulative GPA</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.averageScore ? `${stats.averageScore}/10` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Based on evaluations</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: My Registrations & Tuition Payment (VNPay) */}
      <Card className="border-primary/20 shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                My Class Registrations & Tuition Payment
              </CardTitle>
              <CardDescription>
                Pay tuition fees via VNPay Sandbox (Test Card: 9704198526191432198, OTP: 123456)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myRegistrations?.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not registered for any classes yet. Browse classes below.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Class Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Tuition Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRegistrations?.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-mono text-xs font-bold">{reg.registrationReference}</TableCell>
                    <TableCell className="font-semibold text-primary">{reg.classCode}</TableCell>
                    <TableCell>{reg.subjectName}</TableCell>
                    <TableCell>
                      <Badge variant={reg.status === "ACTIVE" ? "success" : "warning"}>
                        {reg.status === "ACTIVE" ? "PAID & ACTIVE" : "PENDING PAYMENT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {reg.status === "ACTIVE" ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle className="h-4 w-4" />
                          <span>Paid (5,000,000 VND)</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
                          onClick={() => handlePayVNPay(reg.id)}
                          disabled={payLoadingId === reg.id}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          {payLoadingId === reg.id ? "Redirecting..." : "Pay with VNPay Sandbox"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Available Classes for Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Available Courses for Registration
          </CardTitle>
          <CardDescription>Select an open class section to enroll</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Code</TableHead>
                <TableHead>Class Title</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Assigned Teacher</TableHead>
                <TableHead>Tuition Fee</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableClasses?.map((c: any) => {
                const isRegistered = myRegistrations?.some((r: any) => r.subjectClassId === c.id)
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.classCode}</TableCell>
                    <TableCell>{c.className}</TableCell>
                    <TableCell><Badge variant="outline">{c.term}</Badge></TableCell>
                    <TableCell>{c.teacherName || "Assigned Faculty"}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">5,000,000 VND</TableCell>
                    <TableCell>
                      {isRegistered ? (
                        <Badge variant="secondary">Already Enrolled</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => registerMutation.mutate(c.id)}
                          disabled={registerMutation.isPending}
                        >
                          Enroll Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: My Submissions & Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Course Submissions & Grades
          </CardTitle>
          <CardDescription>
            Files uploaded to Cloudinary, evaluated by course teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mySubmissions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted Time</TableHead>
                  <TableHead>Cloudinary Artifact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubmissions?.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.assignmentTitle}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.submittedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {s.secureFileReference && (
                        <a
                          href={s.secureFileReference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View on Cloudinary</span>
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.submissionStatus === "GRADED" ? "success" : "secondary"}>
                        {s.submissionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {s.evaluation?.score !== undefined ? `${s.evaluation.score}/10` : "Pending"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.evaluation?.feedback || "Evaluation in progress"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Quick Submit File Form */}
          <div className="mt-6 rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Assignment Work (Direct to Cloudinary)
            </h4>
            <form onSubmit={handleUploadSubmission} className="grid grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium">Select Class</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={uploadRegId || ""}
                  onChange={(e) => setUploadRegId(parseInt(e.target.value))}
                  required
                >
                  <option value="">-- Paid Class --</option>
                  {myRegistrations?.filter((r: any) => r.status === "ACTIVE").map((r: any) => (
                    <option key={r.id} value={r.id}>{r.classCode} ({r.subjectName})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Assignment ID</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={uploadAssignId || ""}
                  onChange={(e) => setUploadAssignId(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Choose File</label>
                <input
                  type="file"
                  className="w-full text-xs"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <Button type="submit" size="sm" disabled={uploading}>
                {uploading ? "Uploading to Cloudinary..." : "Submit File"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
