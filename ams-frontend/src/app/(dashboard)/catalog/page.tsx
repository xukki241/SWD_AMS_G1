"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { courseService } from "@/services/course.service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select"
import { formatPrice } from "@/components/courses/courseFormat"
import { categoryService } from "@/services/category.service"

export default function CatalogPage() {
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(0)
  const [categoryId,setCategoryId]=useState("all")
  const [sort,setSort]=useState("title")
  const {data:categories=[]}=useQuery({queryKey:["course-categories"],queryFn:categoryService.list})
  const { data, isLoading } = useQuery({
    queryKey: ["public-course-catalog", keyword, categoryId, page],
    queryFn: () => courseService.listPublic({ keyword, categoryId:categoryId==="all"?undefined:Number(categoryId), page, size: 9 }),
  })
  const courses=[...(data?.content||[])].sort((a,b)=>sort==="price-asc"?a.price-b.price:sort==="price-desc"?b.price-a.price:a.title.localeCompare(b.title))
  return <main className="mx-auto max-w-6xl space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Danh mục khóa học</h1><p className="mt-1 text-sm text-muted-foreground">Tìm khóa học đã xuất bản và xem thông tin trước khi đăng ký.</p></header>
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_200px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0) }} placeholder="Tìm theo tên hoặc mã khóa học" /></div><Select value={categoryId} onValueChange={value=>{setCategoryId(value);setPage(0)}}><SelectTrigger><SelectValue placeholder="Danh mục"/></SelectTrigger><SelectContent><SelectItem value="all">Tất cả danh mục</SelectItem>{categories.map(category=><SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select><Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="title">Tên A–Z</SelectItem><SelectItem value="price-asc">Giá thấp đến cao</SelectItem><SelectItem value="price-desc">Giá cao đến thấp</SelectItem></SelectContent></Select></div>
    {isLoading ? <p>Đang tải khóa học…</p> : courses.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map(course => <article key={course.id} className="overflow-hidden rounded-xl border bg-card">
      {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-40 w-full object-cover"/> : <div className="h-40 bg-primary/10"/>}
      <div className="space-y-3 p-4"><div><p className="text-xs text-muted-foreground">{course.code}</p><h2 className="font-semibold">{course.title}</h2></div><p className="text-sm text-muted-foreground">{course.categoryName} · {course.instructorName}</p><div className="flex items-center justify-between"><span className="font-medium">{formatPrice(course.price, course.isFree)}</span><Button asChild size="sm"><Link href={`/catalog/${course.id}`}>Xem chi tiết</Link></Button></div></div>
    </article>)}</div> : <div className="rounded-xl border p-8 text-center text-muted-foreground">Không tìm thấy khóa học phù hợp.</div>}
    {!!data && data.totalPages > 1 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page===0} onClick={()=>setPage(page-1)}>Trước</Button><span className="text-sm">Trang {page+1}/{data.totalPages}</span><Button variant="outline" disabled={page+1>=data.totalPages} onClick={()=>setPage(page+1)}>Sau</Button></div>}
  </main>
}
