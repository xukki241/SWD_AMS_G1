import { translate, type TranslationKey } from "./runtime"

const ROLE_KEYS: Record<string, TranslationKey> = {
  ADMIN: "common.roles.admin",
  TEACHER: "common.roles.teacher",
  STUDENT: "common.roles.student",
}

/** Turn `ROLE_TEACHER`, `teacher` or `TEACHER` into the localized role name. */
export function roleLabel(role: string): string {
  const normalized = role.replace(/^ROLE_/, "").toUpperCase()
  const key = ROLE_KEYS[normalized]
  return key ? translate(key) : role.replace(/^ROLE_/, "")
}
