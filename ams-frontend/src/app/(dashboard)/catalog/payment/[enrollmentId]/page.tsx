"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { enrollmentService } from "@/services/enrollment.service"
import { paymentService } from "@/services/payment.service"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EnrollmentPaymentPage() {
  const id=Number(useParams<{enrollmentId:string}>().enrollmentId); const router=useRouter(); const qc=useQueryClient()
  const [provider,setProvider]=useState("PAYOS"); const [accepted,setAccepted]=useState(false); const [error,setError]=useState("")
  const {data:e,isLoading}=useQuery({queryKey:["enrollment",id],queryFn:()=>enrollmentService.getMyEnrollments().then(list=>list.find(x=>x.id===id)||null)})
  const checkout=useMutation({mutationFn:async()=>{if(provider==="PAYOS")return paymentService.createPayOSPayment(id); if(provider==="SEPAY")return paymentService.createSePayPayment(id); return paymentService.payVnPay(id)},onSuccess:result=>{if("paymentUrl" in result){window.location.assign(result.paymentUrl);return} if("formFields" in result){const form=document.createElement("form");form.method="POST";form.action=result.checkoutUrl;for(const [name,value] of Object.entries(result.formFields)){const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.appendChild(input)}document.body.appendChild(form);form.submit();return} window.location.assign(result.checkoutUrl)},onError:(err:unknown)=>setError(err instanceof Error?err.message:"Không tạo được yêu cầu thanh toán.")})
  const cancel=useMutation({mutationFn:()=>enrollmentService.cancel(id),onSuccess:async()=>{await qc.invalidateQueries({queryKey:["my-enrollments"]});router.push("/catalog")}})
  if(isLoading)return <main className="p-6">Đang tải đăng ký…</main>
  if(!e)return <main className="p-6">Không tìm thấy đăng ký này.</main>
  if(e.status!=="PENDING_PAYMENT")return <main className="mx-auto max-w-2xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Đăng ký {e.status==="ACTIVE"?"đã xác nhận":"đã đóng"}</h1><p>{e.courseTitle}</p><Button onClick={()=>router.push(`/courses/${e.courseId}`)}>Vào khóa học</Button></main>
  return <main className="mx-auto max-w-2xl space-y-5 p-6"><h1 className="text-2xl font-semibold">Xác nhận đăng ký & thanh toán</h1><section className="space-y-4 rounded-xl border bg-card p-6"><div><p className="text-sm text-muted-foreground">Khóa học</p><p className="font-semibold">{e.courseTitle} ({e.courseCode})</p></div><div className="flex justify-between border-t pt-3"><span>Học phí</span><strong>{new Intl.NumberFormat("vi-VN").format(e.amount)} VND</strong></div><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={accepted} onChange={x=>setAccepted(x.target.checked)} className="mt-1"/>Tôi xác nhận thông tin đăng ký và đồng ý với điều khoản thanh toán.</label><div className="space-y-2"><span className="text-sm">Cổng thanh toán</span><Select value={provider} onValueChange={setProvider}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="PAYOS">PayOS</SelectItem><SelectItem value="SEPAY">SePay</SelectItem><SelectItem value="VNPAY">VNPay</SelectItem></SelectContent></Select></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button disabled={!accepted||checkout.isPending} onClick={()=>{setError("");checkout.mutate()}}>Tạo yêu cầu thanh toán</Button><Button variant="outline" disabled={cancel.isPending} onClick={()=>cancel.mutate()}>Hủy đăng ký</Button></div><p className="text-xs text-muted-foreground">Giữ trang thanh toán mở đến khi cổng thanh toán xác nhận giao dịch. Quyền học được mở sau xác nhận.</p></section></main>
}
