"use client"

import { useQuery } from "@tanstack/react-query"
import { submissionService } from "@/services/submission.service"
import { FileText } from "lucide-react"

export default function SubmissionHistoryPage(){
 const {data:submissions=[],isLoading}=useQuery({queryKey:["student-submissions"],queryFn:submissionService.getMySubmissions})
 return <main className="mx-auto max-w-4xl space-y-5 p-6"><header><h1 className="text-2xl font-semibold">Bài đã nộp & phản hồi</h1><p className="text-sm text-muted-foreground">Điểm và nhận xét chỉ xuất hiện sau khi giáo viên công bố.</p></header>
 {isLoading?<p>Đang tải bài nộp…</p>:submissions.length===0?<p className="rounded-xl border p-8 text-center text-muted-foreground">Bạn chưa có bài nộp nào.</p>:<div className="space-y-3">{[...submissions].sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime()).map(s=><article key={s.id} className="space-y-3 rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-4"><div><h2 className="font-medium">{s.assignmentTitle}</h2><p className="text-sm text-muted-foreground">Nộp lúc {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(s.submittedAt))}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{s.evaluation?.published?"Đã công bố":s.submissionStatus==="GRADED"?"Đã công bố":"Đang chấm"}</span></div>
 {s.secureFileReference&&<a href={s.secureFileReference} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4"/>Xem tệp đã nộp</a>}
 {s.evaluation?.published&&<div className="rounded-lg bg-muted/50 p-3"><p className="font-semibold">Điểm: {s.evaluation.score}</p>{s.evaluation.feedback&&<p className="mt-1 whitespace-pre-line text-sm">{s.evaluation.feedback}</p>}<p className="mt-2 text-xs text-muted-foreground">{s.evaluation.viewedAt?"Đã xem":"Điểm đã được mở"}</p></div>}
 </article>)}</div>}</main>
}
