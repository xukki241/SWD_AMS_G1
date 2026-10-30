// Shared display helpers for the classroom UI.

export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—"
  if (Number(amount) === 0) return "Free"
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + " VND"
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return ""
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`
  return formatDate(iso)
}

export function isPastDue(dueAt?: string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < Date.now()
}

export function formatBytes(n?: number | null): string | null {
  if (!n) return null
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

// Safe parse of the backend's fileMetadata JSON string ({originalName, bytes, format}).
export function parseFileMeta(
  fileMetadata?: string | null
): { name: string; sizeLabel: string | null; format: string } | null {
  if (!fileMetadata) return null
  try {
    const raw = JSON.parse(fileMetadata) as Record<string, unknown>
    const name =
      (typeof raw.originalName === "string" && raw.originalName) ||
      (typeof raw.name === "string" && raw.name) ||
      null
    const bytes = typeof raw.bytes === "number" ? raw.bytes : undefined
    const format = typeof raw.format === "string" ? raw.format : ""
    return {
      name: name || (format ? `file.${format}` : "file"),
      sizeLabel: formatBytes(bytes),
      format,
    }
  } catch {
    return null
  }
}

// Relative due-date text. Color decision (warning vs destructive vs muted)
// is left to the call site based on the sign of `days`.
export function dueCountdown(dueAt?: string | null): { text: string; days: number } | null {
  if (!dueAt) return null
  const due = new Date(dueAt).getTime()
  const diff = due - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, days }
  if (days === 0) return { text: "Due today", days }
  if (days === 1) return { text: "Due tomorrow", days }
  if (days <= 7) return { text: `${days} days left`, days }
  return { text: `Due ${formatDate(dueAt)}`, days }
}

export function classInitial(name?: string | null): string {
  return (name || "?").trim().charAt(0).toUpperCase()
}

// Deterministic avatar color from a string, GC-style.
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-pink-600",
]
// Hex values that mirror AVATAR_COLORS for CSS gradients (per-class banner).
const AVATAR_HEX = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#e11d48",
  "#d97706",
  "#0d9488",
  "#4f46e5",
  "#db2777",
]
function seedHash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}
export function avatarColor(seed: string): string {
  return AVATAR_COLORS[seedHash(seed) % AVATAR_COLORS.length]
}
export function avatarHex(seed: string): string {
  return AVATAR_HEX[seedHash(seed) % AVATAR_HEX.length]
}
