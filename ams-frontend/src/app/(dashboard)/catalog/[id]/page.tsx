"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseService } from "@/services/course.service"
import { enrollmentService } from "@/services/enrollment.service"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/components/courses/courseFormat"

export default function CatalogCourseDetailPage() {
  const id = Number(useParams<{id:string}>().id)
  const router = useRouter(); const qc = useQueryClient(); const [error,setError] = useState("")
  const {data:course,isLoading} = useQuery({queryKey:["public-course",id],queryFn:()=>courseService.getPublicById(id),enabled:Number.isFinite(id)})
  const {data:enrollments=[]} = useQuery({queryKey:["my-enrollments"],queryFn:enrollmentService.getMyEnrollments})
  const enrolled = enrollments.find(e=>e.courseId===id && e.status!=="CANCELLED")
  if(isLoading)return <main className="p-6">Đang tải…</main>
  if(!course)return <main className="p-6">Không tìm thấy khóa học.</main>
  return <main className="mx-auto max-w-4xl space-y-6 p-6"><Button variant="link" onClick={()=>router.push("/catalog")}>← Danh mục khóa học</Button>
    <section className="space-y-4 rounded-xl border bg-card p-6"><p className="text-sm text-muted-foreground">{course.code} · {course.categoryName}</p><h1 className="text-3xl font-semibold">{course.title}</h1><p className="text-muted-foreground">Giảng viên: {course.instructorName}</p><p className="whitespace-pre-line">{course.description}</p>
      {course.whatStudentsWillLearn&&<div><h2 className="font-semibold">Bạn sẽ học</h2><p className="whitespace-pre-line text-muted-foreground">{course.whatStudentsWillLearn}</p></div>}{course.prerequisites&&<div><h2 className="font-semibold">Yêu cầu tiên quyết</h2><p className="whitespace-pre-line text-muted-foreground">{course.prerequisites}</p></div>}
      <div><h2 className="font-semibold">Nội dung khóa học</h2>{course.curriculum?.length?<ul className="list-inside list-disc text-muted-foreground">{course.curriculum.map(m=><li key={m.id}>{m.title} ({m.lessonCount} bài học)</li>)}</ul>:<p className="text-sm text-muted-foreground">Nội dung sẽ được cập nhật.</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><span className="text-lg font-semibold">{formatPrice(course.price,course.isFree)}</span>{enrolled?<Button onClick={()=>router.push(enrolled.status==="PENDING_PAYMENT"?`/catalog/payment/${enrolled.id}`:`/courses/${id}`)}>{enrolled.status==="PENDING_PAYMENT"?"Tiếp tục thanh toán":"Vào học"}</Button>:<Button onClick={()=>router.push(`/catalog/confirm/${id}`)}>Đăng ký khóa học</Button>}</div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    </section></main>
}
