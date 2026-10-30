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
export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
