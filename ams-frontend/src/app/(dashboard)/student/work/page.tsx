"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { CalendarClock, FileText } from "lucide-react"
import { assignmentService } from "@/services/assignment.service"
import { SubmitDialog } from "@/components/classroom/SubmitDialog"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssignmentOverviewItem } from "@/types"

export default function StudentWorkPage(){
 const [selected,setSelected]=useState<AssignmentOverviewItem|null>(null);const [keyword,setKeyword]=useState("");const queryClient=useQueryClient()
 const {data:items=[],isLoading,isError}=useQuery({queryKey:["student-work"],queryFn:assignmentService.getMyOverview})
 const visible=useMemo(()=>items.filter(item=>`${item.title} ${item.courseTitle} ${item.courseCode}`.toLowerCase().includes(keyword.toLowerCase())).sort((a,b)=>new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime()),[items,keyword])
 return <main className="mx-auto max-w-5xl space-y-6 p-6">
  <header><h1 className="text-2xl font-semibold">Việc cần làm</h1><p className="mt-1 text-sm text-muted-foreground">Bài tập trong các khóa học đang học, sắp xếp theo hạn nộp.</p></header>
  <Input className="max-w-md" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Tìm bài tập hoặc khóa học"/>
  {isLoading?<p className="text-sm text-muted-foreground">Đang tải bài tập…</p>:isError?<p role="alert" className="text-sm text-destructive">Không tải được danh sách bài tập.</p>:visible.length===0?<div className="rounded-lg border border-dashed p-10 text-center"><FileText className="mx-auto h-7 w-7 text-muted-foreground"/><p className="mt-3 font-medium">Không có bài tập cần làm</p><p className="mt-1 text-sm text-muted-foreground">Bài tập được giáo viên phân bổ sẽ xuất hiện tại đây.</p></div>:<div className="divide-y rounded-lg border">{visible.map(item=><article key={`${item.enrollmentId}-${item.assignmentId}`} className="space-y-3 p-5">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/courses/${item.courseId}`} className="text-xs text-muted-foreground hover:text-foreground">{item.courseTitle} · {item.courseCode}</Link><h2 className="mt-1 font-semibold">{item.title}</h2></div><StatusBadge status={item.workState}/></div>
   <p className="whitespace-pre-line text-sm text-muted-foreground">{item.instructions?.trim()||"Giảng viên chưa bổ sung yêu cầu đề bài."}</p>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5"/>Hạn nộp {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.dueAt))}</span><span>Tối đa {item.maxScore} điểm</span>{item.score!=null&&<span className="font-medium text-foreground">Điểm đã công bố: {item.score}/{item.maxScore}</span>}</div>{item.workState==="NOT_STARTED"?<Button size="sm" onClick={()=>setSelected(item)}>Nộp bài</Button>:item.workState==="UNDER_EVALUATION"?<span className="text-sm text-muted-foreground">Đang chờ giáo viên công bố điểm</span>:item.workState==="GRADED"?<Button asChild size="sm" variant="outline"><Link href="/student/submissions">Xem phản hồi</Link></Button>:<span className="text-sm text-muted-foreground">Đã nộp · bài nộp cuối không thể thay thế</span>}</div>
  </article>)}</div>}
  {selected&&<SubmitDialog open enrollmentId={selected.enrollmentId} assignmentId={selected.assignmentId} onClose={()=>setSelected(null)} onSubmitted={()=>{setSelected(null);queryClient.invalidateQueries({queryKey:["student-work"]})}}/>}
 </main>
}
