"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { BookOpen } from "lucide-react"
import { enrollmentService } from "@/services/enrollment.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/classroom/StatusBadge"

export default function MyCoursesPage(){
 const {data:enrollments=[],isLoading,isError}=useQuery({queryKey:["my-enrollments"],queryFn:enrollmentService.getMyEnrollments})
 const courses=enrollments.filter(e=>e.status!=="CANCELLED")
 return <main className="mx-auto max-w-6xl space-y-7 p-6">
  <header><h1 className="text-2xl font-semibold">Khóa học của tôi</h1><p className="mt-1 text-sm text-muted-foreground">Các khóa học bạn đã đăng ký. Mở khóa học để xem giáo trình và bài tập.</p></header>
  {isLoading?<p className="text-sm text-muted-foreground">Đang tải khóa học…</p>:isError?<p role="alert" className="text-sm text-destructive">Không tải được danh sách khóa học.</p>:courses.length===0?<Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><BookOpen className="h-8 w-8 text-muted-foreground"/><p className="font-medium">Bạn chưa có khóa học nào</p><Button asChild><Link href="/catalog">Duyệt danh mục khóa học</Link></Button></CardContent></Card>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map(course=><Card key={course.id} className="border shadow-none"><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">{course.courseCode}</p><h2 className="mt-1 font-semibold">{course.courseTitle}</h2></div><StatusBadge status={course.status}/></div><div className="flex items-center justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Học phí</span><span className="tabular-nums">{new Intl.NumberFormat("vi-VN").format(course.amount)} VND</span></div>{course.status==="PENDING_PAYMENT"?<Button asChild className="w-full"><Link href={`/catalog/payment/${course.id}`}>Tiếp tục thanh toán</Link></Button>:<Button asChild variant="outline" className="w-full"><Link href={`/courses/${course.courseId}`}>Mở khóa học</Link></Button>}</CardContent></Card>)}</div>}
 </main>
}
