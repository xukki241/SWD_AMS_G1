import type { CourseDifficulty, CourseStatus, LessonType } from '@/types';

export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export const DIFFICULTY_LABEL: Record<CourseDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  VIDEO: 'Video',
  READING: 'Reading',
  ASSIGNMENT: 'Assignment',
};

export function formatPrice(price: number, isFree: boolean): string {
  if (isFree || !price) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatDuration(minutes?: number | null): string {
  const total = Math.max(minutes ?? 0, 0);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message || fallback;
}

export function getValidationErrors(error: unknown): Record<string, string> {
  const err = error as {
    response?: { data?: { validationErrors?: Record<string, string> } };
  };
  return err?.response?.data?.validationErrors ?? {};
}

export function isTimeoutError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === 'ECONNABORTED' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'))
  );
}

/** Client-side thumbnail checks mirroring the server rules. */
export function validateThumbnailFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  if (type !== 'image/png' && type !== 'image/jpeg' && type !== 'image/jpg') {
    return 'Thumbnail must be a PNG or JPG image.';
  }
  if (file.size > MAX_THUMBNAIL_BYTES) {
    return 'Thumbnail must be 5MB or smaller.';
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function splitLines(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}
