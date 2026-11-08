/** Exclusive AMS roles: Student joins only; Teacher creates/manages only; Admin is separate. */

export type RoleFlags = {
  isAdmin: boolean
  isTeacher: boolean
  isStudent: boolean
  /** True only for pure teachers (or admins). Dual TEACHER+STUDENT is treated as not manageable. */
  canManageCourses: boolean
  /** True only for pure students. */
  canEnroll: boolean
  /** Dual TEACHER+STUDENT leftover from older builds — needs refresh after DB cleanup. */
  hasConflictingRoles: boolean
}

export function roleFlags(roles: string[] | undefined | null): RoleFlags {
  const list = roles || []
  const isAdmin = list.some((r) => r.toUpperCase().includes("ADMIN"))
  const isTeacher = list.some((r) => r.toUpperCase().includes("TEACHER"))
  const isStudent = list.some((r) => r.toUpperCase().includes("STUDENT"))
  const hasConflictingRoles = !isAdmin && isTeacher && isStudent
  return {
    isAdmin,
    isTeacher,
    isStudent,
    // Student must never author courses, even if an old TEACHER grant lingers.
    canManageCourses: isAdmin || (isTeacher && !isStudent),
    canEnroll: isStudent && !isTeacher && !isAdmin,
    hasConflictingRoles,
  }
}
