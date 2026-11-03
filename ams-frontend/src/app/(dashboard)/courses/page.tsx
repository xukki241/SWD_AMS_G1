"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { courseService } from "@/services/course.service"
import { categoryService } from "@/services/category.service"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseStatusBadge, DifficultyBadge } from "@/components/courses/CourseStatusBadge"
import { ConfirmDialog } from "@/components/courses/ConfirmDialog"
import {
  formatDate,
  formatPrice,
  getApiErrorMessage,
} from "@/components/courses/courseFormat"
import type { CourseStatus, CourseSummary } from "@/types"

const PAGE_SIZE = 10

export default function CoursesPage() {
  return (
    <CourseStaffGuard>
      <CoursesList />
    </CourseStaffGuard>
  )
}

function CoursesList() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState("")
  const [debouncedKeyword, setDebouncedKeyword] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState<"all" | CourseStatus>("all")
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<CourseSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [keyword])

  const filters = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      categoryId: categoryId === "all" ? undefined : Number(categoryId),
      status: status === "all" ? undefined : status,
      page,
      size: PAGE_SIZE,
    }),
    [debouncedKeyword, categoryId, status, page]
  )

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["courses", filters],
    queryFn: () => courseService.list(filters),
    placeholderData: (previous) => previous,
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseService.delete(id),
    onSuccess: () => {
      setActionError(null)
      if ((data?.content.length ?? 0) <= 1 && page > 0) {
        setPage((prev) => prev - 1)
      }
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error: unknown) => {
      setActionError(
        getApiErrorMessage(error, "Could not delete this course. Please try again.")
      )
      setDeleteTarget(null)
    },
  })

  const hasFilters =
    Boolean(debouncedKeyword) || categoryId !== "all" || status !== "all"

  const clearFilters = () => {
    setKeyword("")
    setDebouncedKeyword("")
    setCategoryId("all")
    setStatus("all")
    setPage(0)
  }

  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create courses, build their curriculum, and publish them to students.
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New course
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title or course code"
            className="pl-9"
            aria-label="Search courses"
          />
          {isFetching && !isLoading && (
            <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value)
              setPage(0)
            }}
          >
            <SelectTrigger className="sm:w-48" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories ?? []).map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as "all" | CourseStatus)
              setPage(0)
            }}
          >
            <SelectTrigger className="sm:w-40" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="col-span-2 sm:col-span-1"
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="rounded-full p-0.5 hover:bg-destructive/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        {isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm font-medium">Could not load courses</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Check your connection and try again.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <CoursesTableSkeleton />
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {hasFilters ? "No courses match these filters" : "No courses yet"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "Try a different keyword or clear the filters."
                : "Create your first course to start building a curriculum."}
            </p>
            {hasFilters ? (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/courses/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create course
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[38%]">Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.content ?? []).map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CourseThumb course={course} />
                      <div className="min-w-0">
                        <Link
                          href={`/courses/${course.id}`}
                          className="line-clamp-1 font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {course.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {course.code}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.categoryName}
                  </TableCell>
                  <TableCell>
                    <CourseStatusBadge status={course.status} />
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge level={course.difficultyLevel} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium">
                    {formatPrice(course.price, course.isFree)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {course.instructorName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(course.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${course.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-gc">
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit course
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}/content`}>
                            <Layers className="mr-2 h-4 w-4" />
                            Manage content
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onSelect={() => setDeleteTarget(course)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{from}</span>–
            <span className="font-medium text-foreground">{to}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> courses
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="px-1 text-xs text-muted-foreground">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this course?"
        description={
          <>
            <span className="font-medium text-foreground">
              {deleteTarget?.title}
            </span>{" "}
            will be removed from the catalog. Courses with enrollments cannot be
            deleted. This action cannot be undone.
          </>
        }
        confirmLabel="Delete course"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}

function CourseThumb({ course }: { course: CourseSummary }) {
  if (course.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.thumbnailUrl}
        alt=""
        className="h-11 w-[72px] shrink-0 rounded-md border object-cover"
      />
    )
  }
  return (
    <div
      className={cn(
        "flex h-11 w-[72px] shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-accent to-muted"
      )}
      aria-hidden
    >
      <BookOpen className="h-5 w-5 text-primary/60" />
    </div>
  )
}

function CoursesTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-11 w-[72px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-6 w-20 md:block" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
