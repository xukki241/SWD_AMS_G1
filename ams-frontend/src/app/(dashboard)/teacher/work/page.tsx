"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, ClipboardList, Search } from "lucide-react"
import { assignmentService } from "@/services/assignment.service"
import { submissionService } from "@/services/submission.service"
import { useAuthStore } from "@/stores/authStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function TeacherWorkPage(){
 const userId=useAuthStore(s=>s.user?.userId);const [keyword,setKeyword]=useState("")
 const {data:queue=[],isLoading,isError}=useQuery({queryKey:["teacher-work-queue",userId],queryFn:async()=>{
  const assignments=await assignmentService.getAll();const mine=assignments.filter(a=>a.teacherId===userId&&a.status==="PUBLISHED")
  const rows=await Promise.all(mine.map(async assignment=>{const submissions=await submissionService.getByAssignment(assignment.id);const ungradedCount=submissions.filter(s=>["SUBMITTED","LATE"].includes(s.submissionStatus)&&s.evaluation?.score==null).length;return {assignment,ungradedCount,submissionCount:submissions.length}}))
  return rows.filter(row=>row.ungradedCount>0).sort((a,b)=>b.ungradedCount-a.ungradedCount)
 },enabled:userId!=null})
 const visible=useMemo(()=>queue.filter(row=>`${row.assignment.title} ${row.assignment.courseTitle} ${row.assignment.courseCode}`.toLowerCase().includes(keyword.toLowerCase())),[queue,keyword])
 const total=queue.reduce((sum,row)=>sum+row.ungradedCount,0)
 return <main className="mx-auto max-w-5xl space-y-6 p-6"><header><h1 className="text-2xl font-semibold">Việc cần làm</h1><p className="mt-1 text-sm text-muted-foreground">Bài tập đang chờ bạn chấm và công bố điểm.</p></header>
 <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4"><div><p className="text-sm text-muted-foreground">Tổng bài nộp cần chấm</p><p className="text-2xl font-semibold tabular-nums">{total}</p></div><div className="relative w-full max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Tìm bài tập hoặc khóa học"/></div></div>
 {isLoading?<p className="text-sm text-muted-foreground">Đang tải hàng chờ…</p>:isError?<p role="alert" className="text-sm text-destructive">Không tải được hàng chờ chấm bài.</p>:visible.length===0?<div className="rounded-lg border border-dashed p-10 text-center"><ClipboardList className="mx-auto h-7 w-7 text-muted-foreground"/><p className="mt-3 font-medium">Không có bài nộp đang chờ chấm</p><p className="mt-1 text-sm text-muted-foreground">Khi học viên nộp bài, assignment sẽ xuất hiện tại đây.</p></div>:<div className="divide-y rounded-lg border">{visible.map(({assignment,ungradedCount,submissionCount})=><article key={assignment.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><Link href={`/courses/${assignment.courseId}#classwork`} className="text-xs text-muted-foreground hover:text-foreground">{assignment.courseTitle} · {assignment.courseCode}</Link><h2 className="mt-1 font-semibold">{assignment.title}</h2><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5"/>Hạn nộp {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(assignment.dueAt))}</span><span>{submissionCount} bài nộp</span><span>Tối đa {assignment.maxScore} điểm</span></div></div><Button asChild size="sm"><Link href={`/courses/${assignment.courseId}#classwork`}>Mở để chấm ({ungradedCount})</Link></Button></article>)}</div>}
 </main>
}
