import Link from "next/link"
import { Users, KeyRound, Settings } from "lucide-react"
import type { MyClass } from "@/components/classroom/classroomTypes"
import { classBannerColor, classInitial, formatVnd } from "@/components/classroom/format"
import { Button } from "@/components/ui/button"

export function ClassBanner({
  data,
  isStaff,
}: {
  data: MyClass
  isStaff: boolean
}) {
  const banner = classBannerColor(data.className)
  const classId = data.id ?? data.classId
  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 text-white shadow-gc"
      style={{
        background: `linear-gradient(135deg, ${banner.hex} 0%, #0b57d0 100%)`,
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold ring-1 ring-white/30 backdrop-blur-sm">
          {classInitial(data.className)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
            {data.className}
          </h1>
          <p className="text-sm text-white/80">
            {data.subjectCode} · {data.subjectName} · {data.term || "—"}
            {data.room ? ` · ${data.room}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/80">
            {data.teacherName && <span>Teacher: {data.teacherName}</span>}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {data.enrolledCount}
              {data.capacity > 0 ? ` / ${data.capacity}` : ""} enrolled
            </span>
            {Number(data.registrationFee) > 0 && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 font-medium">
                {formatVnd(data.registrationFee)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isStaff && classId != null && (
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white"
              title="Class settings"
            >
              <Link href={`/classes/${classId}/settings`} aria-label="Class settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          )}
          {isStaff && data.joinCode && (
            <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/20">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/70">
                <KeyRound className="h-3 w-3" /> Join code
              </span>
              <span className="font-mono text-lg font-bold tracking-[0.3em] text-white">
                {data.joinCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassBanner
