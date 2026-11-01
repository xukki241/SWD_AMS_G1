"use client"

import Link from "next/link"
import {
  FolderOpen,
  Users,
  FileText,
  MoreVertical,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { Avatar } from "@/components/ui/avatar"
import {
  classBannerColor,
  formatDate,
  formatVnd,
} from "@/components/classroom/format"
import type { MyClass, PublicClass } from "@/components/classroom/classroomTypes"
import { cn } from "@/lib/utils"

interface ClassCardProps {
  data: MyClass | PublicClass
  showMyStatus?: boolean
  /** Optional "Sắp đến hạn" snippet for the card body */
  upcomingTitle?: string | null
  upcomingDueAt?: string | null
}

export function ClassCard({
  data,
  showMyStatus,
  upcomingTitle,
  upcomingDueAt,
}: ClassCardProps) {
  const id = (data as MyClass).classId ?? data.id
  const myStatus = (data as MyClass).myRegistrationStatus ?? null
  const banner = classBannerColor(data.className)

  return (
    <Link
      href={`/classes/${id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-gc transition-all hover:shadow-gc-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Full-bleed colored header */}
      <div
        className={cn("relative h-[104px] px-4 pb-3 pt-4 text-white", banner.bg)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="truncate text-lg font-medium leading-tight tracking-tight">
              {data.className}
            </h3>
            <p className="mt-0.5 truncate text-xs text-white/85">
              {data.term || data.subjectCode}
              {data.subjectName ? ` · ${data.subjectName}` : ""}
            </p>
            {data.teacherName && (
              <p className="mt-1 truncate text-xs text-white/75">
                {data.teacherName}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {showMyStatus && myStatus && myStatus !== "ACTIVE" ? (
              <StatusBadge status={myStatus} />
            ) : null}
            <span
              className="rounded-full p-1 text-white/80 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            >
              <MoreVertical className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Fee demoted to a subtle corner chip */}
        {Number(data.registrationFee) > 0 && (
          <Badge
            variant="outline"
            className="absolute bottom-2 right-3 border-white/30 bg-black/20 text-[10px] font-normal text-white backdrop-blur-sm"
          >
            {formatVnd(data.registrationFee)}
          </Badge>
        )}
      </div>

      {/* Overlapping teacher avatar */}
      <div className="relative z-10 -mt-6 flex justify-end px-4">
        <Avatar
          name={data.teacherName || data.className}
          size="lg"
          className="ring-4 ring-card"
        />
      </div>

      {/* Body — upcoming snippet */}
      <div className="flex flex-1 flex-col px-4 pb-3 pt-1">
        <div className="min-h-[52px] text-sm text-muted-foreground">
          {upcomingTitle ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                Sắp đến hạn
              </p>
              <p className="mt-0.5 line-clamp-2 font-medium text-foreground">
                {upcomingTitle}
              </p>
              {upcomingDueAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(upcomingDueAt)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/70">Không có bài sắp đến hạn</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-2 text-muted-foreground">
          <div className="flex items-center gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>
              {data.enrolledCount}
              {data.capacity > 0 ? `/${data.capacity}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-full p-1.5 transition-colors group-hover:bg-muted group-hover:text-foreground">
              <FileText className="h-4 w-4" />
            </span>
            <span className="rounded-full p-1.5 transition-colors group-hover:bg-muted group-hover:text-foreground">
              <FolderOpen className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ClassCard
