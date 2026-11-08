import type { AuthResponse } from "@/types"
import { roleFlags } from "@/lib/roles"

/** Where to send the user after login / Google / choose-role. */
export function homePathForAuth(data: Pick<AuthResponse, "roles" | "onboardingCompleted">): string {
  if (!data.onboardingCompleted) return "/choose-role"
  const { isAdmin, canManageCourses } = roleFlags(data.roles)
  if (isAdmin) return "/admin"
  if (canManageCourses) return "/teacher"
  return "/student"
}
