import type { AuthResponse } from "@/types"

/** Where to send the user after login / Google / choose-role. */
export function homePathForAuth(data: Pick<AuthResponse, "roles" | "onboardingCompleted">): string {
  if (!data.onboardingCompleted) return "/choose-role"
  const roles = data.roles || []
  if (roles.some((r) => r.includes("ADMIN"))) return "/admin"
  if (roles.some((r) => r.includes("TEACHER"))) return "/teacher"
  return "/student"
}
