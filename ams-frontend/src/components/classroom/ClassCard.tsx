"use client"

import Link from "next/link"
import { Users, CalendarClock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/classroom/StatusBadge"
import { avatarColor, classInitial, formatVnd } from "@/components/classroom/format"
import type { MyClass, PublicClass } from "@/components/classroom/classroomTypes"

interface ClassCardProps {
  // MyClass or PublicClass (MyClass adds myRegistrationStatus)
  data: MyClass | PublicClass
  // Show the enrollment badge when a status is present (my-classes views)
  showMyStatus?: boolean
}

export function ClassCard({ data, showMyStatus }: ClassCardProps) {
  const id = (data as MyClass).classId ?? data.id
  const myStatus = (data as MyClass).myRegistrationStatus ?? null

  return (
    <Link
      href={`/classes/${id}`}
      className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-white ${avatarColor(
            data.className
          )}`}
        >
          {classInitial(data.className)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
              {data.className}
            </h3>
            {showMyStatus && myStatus ? <StatusBadge status={myStatus} /> : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {data.subjectCode} · {data.subjectName}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          <span>{data.term || "Term"}</span>
          {data.teacherName && (
            <span className="flex items-center gap-1.5 border-l pl-2 ml-2">
              <User className="h-3.5 w-3.5" />
              {data.teacherName}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {data.enrolledCount}
              {data.capacity > 0 ? ` / ${data.capacity}` : ""} {data.capacity > 0 ? "seats" : "students"}
            </span>
          </div>
          <Badge
            variant={Number(data.registrationFee) === 0 ? "success" : "outline"}
            className="text-xs"
          >
            {formatVnd(data.registrationFee)}
          </Badge>
        </div>
      </div>
    </Link>
  )
}

export default ClassCard
