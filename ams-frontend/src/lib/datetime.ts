/** Convert `<input type="datetime-local">` value to ISO LocalDateTime for Spring. */
export function toApiDateTime(value: string): string {
  if (!value) return value
  // Already has seconds
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return value
  // datetime-local is usually yyyy-MM-ddTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}
