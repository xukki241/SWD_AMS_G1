"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { enrollmentService } from "@/services/enrollment.service"
import { paymentService } from "@/services/payment.service"
import { Input } from "@/components/ui/input"
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const labels:Record<string,string>={PENDING_PAYMENT:"Chờ thanh toán",ACTIVE:"Đã xác nhận",COMPLETED:"Hoàn thành",CANCELLED:"Đã hủy",PENDING:"Đang xử lý",SUCCESS:"Thành công",FAILED:"Thất bại",REFUNDED:"Đã hoàn tiền"}
function downloadReceipt(courseTitle:string,reference:string,provider:string,amount:number,createdAt:string){
 const content=["AMS Classroom - Payment Receipt",`Course: ${courseTitle}`,`Transaction ID: ${reference}`,`Provider: ${provider}`,`Amount: ${new Intl.NumberFormat("vi-VN").format(amount)} VND`,`Paid at: ${new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(createdAt))}`,"Status: SUCCESS"].join("\n")
 const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`receipt-${reference}.txt`;a.click();URL.revokeObjectURL(url)
}
export default function StudentEnrollmentsPage(){
 const [q,setQ]=useState("");const [filter,setFilter]=useState("ALL");const [paymentFilter,setPaymentFilter]=useState("ALL")
 const {data:enrollments=[],isLoading}=useQuery({queryKey:["my-enrollments"],queryFn:enrollmentService.getMyEnrollments})
 const {data:payments=[]}=useQuery({queryKey:["my-payments"],queryFn:paymentService.getMyPayments})
 const filtered=useMemo(()=>enrollments.filter(e=>{const transactions=payments.filter(p=>p.courseEnrollmentId===e.id);return (filter==="ALL"||e.status===filter)&&(paymentFilter==="ALL"||transactions.some(p=>p.transactionStatus===paymentFilter))&&`${e.registrationReference} ${e.courseTitle}`.toLowerCase().includes(q.toLowerCase())}),[enrollments,filter,paymentFilter,payments,q])
 const count=(status:string)=>enrollments.filter(e=>e.status===status).length
 return <main className="mx-auto max-w-5xl space-y-6 p-6"><header><h1 className="text-2xl font-semibold">Đăng ký & lịch sử thanh toán</h1><p className="text-sm text-muted-foreground">Tổng {enrollments.length} · Đã xác nhận {count("ACTIVE")} · Chờ thanh toán {count("PENDING_PAYMENT")}</p></header>
 <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]"><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm mã đăng ký hoặc khóa học"/><Select value={filter} onValueChange={setFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Mọi trạng thái đăng ký</SelectItem><SelectItem value="PENDING_PAYMENT">Chờ thanh toán</SelectItem><SelectItem value="ACTIVE">Đã xác nhận</SelectItem><SelectItem value="COMPLETED">Hoàn thành</SelectItem><SelectItem value="CANCELLED">Đã hủy</SelectItem></SelectContent></Select><Select value={paymentFilter} onValueChange={setPaymentFilter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Mọi trạng thái thanh toán</SelectItem><SelectItem value="PENDING">Đang xử lý</SelectItem><SelectItem value="SUCCESS">Thành công</SelectItem><SelectItem value="FAILED">Thất bại</SelectItem><SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem></SelectContent></Select></div>
 {isLoading?<p>Đang tải…</p>:filtered.length===0?<p className="rounded-xl border p-8 text-center text-muted-foreground">Không có đăng ký phù hợp.</p>:<div className="space-y-3">{filtered.map(e=><article key={e.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"><div><p className="text-xs text-muted-foreground">{e.registrationReference} · {new Intl.DateTimeFormat("vi-VN").format(new Date(e.registeredAt))}</p><h2 className="font-medium">{e.courseTitle}</h2><p className="text-sm text-muted-foreground">{labels[e.status]} · {new Intl.NumberFormat("vi-VN").format(e.amount)} VND</p><div className="mt-2 space-y-1">{payments.filter(p=>p.courseEnrollmentId===e.id).map(p=><div key={p.id} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{p.provider} · {p.providerReference||"—"} · {labels[p.transactionStatus]||p.transactionStatus} · {new Intl.DateTimeFormat("vi-VN").format(new Date(p.createdAt))}</span>{p.transactionStatus==="SUCCESS"&&<Button size="sm" variant="link" className="h-auto p-0" onClick={()=>downloadReceipt(e.courseTitle,p.providerReference||String(p.id),p.provider,p.amount,p.createdAt)}>Tải biên lai</Button>}</div>)}</div></div><div className="flex gap-2">{e.status==="PENDING_PAYMENT"&&<Button size="sm" asChild><Link href={`/catalog/payment/${e.id}`}>Tiếp tục thanh toán</Link></Button>}{e.status==="ACTIVE"&&<Button size="sm" variant="outline" asChild><Link href={`/courses/${e.courseId}`}>Vào học</Link></Button>}</div></article>)}</div>}
 </main>
}
