"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { StatSkeleton } from "@/components/ui/loading"
import { ClassCard } from "@/components/classroom/ClassCard"
import { ErrorState } from "@/components/classroom/ErrorState"
import { EmptyState } from "@/components/classroom/EmptyState"
import { MyClass } from "@/components/classroom/classroomTypes"
import { FolderKanban } from "lucide-react"

export default function ClassesIndexPage() {
  const { user } = useAuthStore()
  const roles = user?.roles || []
  const isStaff = roles.some((r) =>
    ["ROLE_ADMIN", "ROLE_TEACHER", "ROLE_EXPERT"].some((x) => r.includes(x))
  )

  const {
    data: myClasses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-classes-index"],
    queryFn: async () =>
      (await api.get("/subject-classes/my")).data as MyClass[],
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My classes</h2>
        <p className="text-muted-foreground">
          {isStaff
            ? "Class sections you teach or oversee."
            : "Classes you are enrolled in."}
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : myClasses && myClasses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((c) => (
            <ClassCard key={c.classId ?? c.id} data={c} showMyStatus={!isStaff} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classes yet"
          description={
            isStaff
              ? "Create a class to get started."
              : "Join a class from your home screen."
          }
        />
      )}

      {isStaff && (
        <p className="text-sm text-muted-foreground">
          Open any class to manage its stream, assignments, and people.{" "}
          <Link href="/teacher" className="text-primary hover:underline">
            Manage classes
          </Link>
        </p>
      )}
    </div>
  )
}
