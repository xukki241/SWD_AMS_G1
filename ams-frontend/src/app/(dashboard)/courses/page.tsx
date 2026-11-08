"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  CheckCircle2,
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
import { authService } from "@/services/auth.service"
import { useAuthStore } from "@/stores/authStore"
import { CourseStaffGuard } from "@/components/courses/CourseStaffGuard"
import { CourseStatusBadge, DifficultyBadge } from "@/components/courses/CourseStatusBadge"
import { ConfirmDialog } from "@/components/courses/ConfirmDialog"
import { formatPrice } from "@/components/courses/courseFormat"
import { formatDate, getApiErrorMessage, useI18n } from "@/i18n"
import type { CourseStatus, CourseSummary } from "@/types"

const PAGE_SIZE = 10

export default function CoursesPage() {
  return (
    <CourseStaffGuard>
      <Suspense
        fallback={
          <div className="space-y-6">
            <CoursesTableSkeleton />
          </div>
        }
      >
        <CoursesList />
      </Suspense>
    </CourseStaffGuard>
  )
}

function CoursesList() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { t } = useI18n()
  const [keyword, setKeyword] = useState("")
  const [debouncedKeyword, setDebouncedKeyword] = useState("")

  // Sync TEACHER role into the JWT if it was granted after login (dual-role).
  useEffect(() => {
    let cancelled = false
    authService
      .refresh()
      .then((session) => {
        if (!cancelled) setAuth(session)
      })
      .catch(() => {
        /* keep existing session */
      })
    return () => {
      cancelled = true
    }
  }, [setAuth])
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState<"all" | CourseStatus>("all")
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<CourseSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const created = searchParams.get("created")
    const updated = searchParams.get("updated")
    const deleted = searchParams.get("deleted")
    if (created) setSuccessMessage(t("courses.list.created"))
    else if (updated) setSuccessMessage(t("courses.list.updated"))
    else if (deleted) setSuccessMessage(t("courses.list.deletedBanner"))
    if (created || updated || deleted) {
      // Remove the flag so refreshing the page does not repeat the banner.
      router.replace("/courses")
    }
  }, [searchParams, router, t])

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
      setSuccessMessage(t("courses.list.deletedBanner"))
      if ((data?.content.length ?? 0) <= 1 && page > 0) {
        setPage((prev) => prev - 1)
      }
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error: unknown) => {
      setActionError(
        getApiErrorMessage(error, t("courses.list.deleteError"))
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
          <h1 className="text-3xl font-bold tracking-tight">{t("courses.list.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("courses.list.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("courses.list.addNew")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("courses.list.searchPlaceholder")}
            className="pl-9"
            aria-label={t("courses.list.searchAria")}
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
            <SelectTrigger className="sm:w-48" aria-label={t("courses.list.filterCategoryAria")}>
              <SelectValue placeholder={t("courses.list.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("courses.list.allCategories")}</SelectItem>
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
            <SelectTrigger className="sm:w-40" aria-label={t("courses.list.filterStatusAria")}>
              <SelectValue placeholder={t("courses.list.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("courses.list.allStatuses")}</SelectItem>
              <SelectItem value="DRAFT">{t("common.status.draft")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("common.status.published")}</SelectItem>
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
              {t("courses.list.clear")}
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 px-4 py-3 text-sm text-[hsl(var(--success))]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded-full p-0.5 hover:bg-[hsl(var(--success))]/10"
            aria-label={t("courses.list.dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="rounded-full p-0.5 hover:bg-destructive/10"
            aria-label={t("courses.list.dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        {isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm font-medium">{t("courses.list.loadError")}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {t("courses.list.loadErrorHint")}
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              {t("common.actions.retry")}
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
              {t("courses.list.empty")}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? t("courses.list.emptyFiltered")
                : t("courses.list.emptyHint")}
            </p>
            {hasFilters ? (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                {t("courses.list.clearFilters")}
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/courses/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("courses.list.addNew")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[38%]">{t("courses.list.colCourse")}</TableHead>
                <TableHead>{t("courses.list.colCategory")}</TableHead>
                <TableHead>{t("courses.list.colStatus")}</TableHead>
                <TableHead>{t("courses.list.colLevel")}</TableHead>
                <TableHead>{t("courses.list.colPrice")}</TableHead>
                <TableHead>{t("courses.list.colInstructor")}</TableHead>
                <TableHead>{t("courses.list.colUpdated")}</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">{t("courses.list.actionsSr")}</span>
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
                          aria-label={t("courses.list.actionsFor", { title: course.title })}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-gc">
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("courses.list.viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("courses.list.edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}/content`}>
                            <Layers className="mr-2 h-4 w-4" />
                            {t("courses.list.manageContent")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onSelect={() => setDeleteTarget(course)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("courses.list.delete")}
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
            {t("courses.list.showing", { from, to, total })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("courses.list.previous")}
            </Button>
            <span className="px-1 text-xs text-muted-foreground">
              {t("courses.list.pageInfo", { page: page + 1, total: Math.max(totalPages, 1) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              {t("courses.list.next")}
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
        title={t("courses.list.deleteTitle")}
        description={t("courses.list.deleteDescription", {
          title: deleteTarget?.title ?? "",
        })}
        confirmLabel={t("courses.list.delete")}
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
