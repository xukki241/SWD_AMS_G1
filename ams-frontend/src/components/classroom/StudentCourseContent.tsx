"use client"

import { useQuery } from "@tanstack/react-query"
import { courseContentService } from "@/services/course.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers } from "lucide-react"

export function StudentCourseContent({courseId}:{courseId:number}){
 const {data,isLoading,isError}=useQuery({queryKey:["student-course-content",courseId],queryFn:()=>courseContentService.getForStudent(courseId)})
 if(isLoading||isError)return null
 return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5"/>Nội dung khóa học</CardTitle></CardHeader><CardContent className="space-y-4">{data?.modules?.length?data.modules.map((m,i)=><section key={m.id} className="rounded-lg border p-4"><h3 className="font-medium">{i+1}. {m.title}</h3>{m.lessons.length?<ul className="mt-2 space-y-2">{m.lessons.map(lesson=><li key={lesson.id} className="flex items-center justify-between text-sm"><span>{lesson.title}</span><span className="text-xs text-muted-foreground">{lesson.type}{lesson.duration?` · ${lesson.duration} phút`:""}</span></li>)}</ul>:<p className="mt-2 text-xs text-muted-foreground">Chưa có bài học trong chương này.</p>}</section>):<p className="text-sm text-muted-foreground">Giảng viên chưa cập nhật nội dung.</p>}</CardContent></Card>
}
