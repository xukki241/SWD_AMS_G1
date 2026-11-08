import type { Submission } from "@/types"
import { parseFileMeta } from "@/components/classroom/format"

const AI_READABLE_EXTENSIONS = new Set([
  ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".txt", ".md", ".csv", ".docx", ".pptx", ".zip",
])

export function getAiFileLimitation(submission: Submission): string | null {
  if (!submission.secureFileReference) return null
  const name = parseFileMeta(submission.fileMetadata)?.name || submission.secureFileReference.split(/[?#]/)[0]
  const extension = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0]
  return extension && AI_READABLE_EXTENSIONS.has(extension) ? null : extension || "file"
}
