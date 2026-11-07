"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, Search } from "lucide-react"
import { courseService } from "@/services/course.service"
import { useAuthStore } from "@/stores/authStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CourseStatusBadge } from "@/components/courses/CourseStatusBadge"
import { formatPrice } from "@/components/courses/courseFormat"

export default function TeacherCoursesPage(){
 const userId=useAuthStore(s=>s.user?.userId);const [keyword,setKeyword]=useState("")
 const {data:courses=[],isLoading,isError}=useQuery({queryKey:["teacher-my-courses",userId],queryFn:async()=>{const page=await courseService.list({page:0,size:100});return page.content.filter(c=>c.instructorId===userId)},enabled:userId!=null})
 const visible=useMemo(()=>courses.filter(c=>`${c.title} ${c.code}`.toLowerCase().includes(keyword.toLowerCase())),[courses,keyword])
 return <main className="mx-auto max-w-6xl space-y-6 p-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Khóa học tôi giảng dạy</h1><p className="mt-1 text-sm text-muted-foreground">Mở khóa học để quản lý nội dung và bài tập.</p></div><Button asChild><Link href="/courses/new">Tạo khóa học</Link></Button></header>
 <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Tìm theo tên hoặc mã khóa học"/></div>
 {isLoading?<p className="text-sm text-muted-foreground">Đang tải khóa học…</p>:isError?<p role="alert" className="text-sm text-destructive">Không tải được khóa học.</p>:visible.length===0?<Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><BookOpen className="h-8 w-8 text-muted-foreground"/><p className="font-medium">Chưa có khóa học phù hợp</p><p className="text-sm text-muted-foreground">Tạo khóa học mới hoặc đổi từ khóa tìm kiếm.</p></CardContent></Card>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(course=><Card key={course.id} className="overflow-hidden border shadow-none"><div className="flex h-28 items-end justify-between gap-3 bg-primary/10 p-4"><div><p className="font-mono text-xs text-muted-foreground">{course.code}</p><h2 className="mt-1 font-semibold">{course.title}</h2></div><CourseStatusBadge status={course.status}/></div><CardContent className="space-y-4 p-4"><p className="text-sm text-muted-foreground">{course.categoryName} · {course.difficultyLevel}</p><div className="flex items-center justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Học phí</span><span>{formatPrice(course.price,course.isFree)}</span></div><Button asChild variant="outline" className="w-full"><Link href={`/courses/${course.id}`}>Mở khóa học & quản lý bài tập</Link></Button></CardContent></Card>)}</div>}
 </main>
}
