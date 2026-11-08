import type { CourseDifficulty, CourseStatus, LessonType } from '@/types';
import { translate } from '@/i18n';

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
  if (isFree || !price) return translate('common.units.free');
  // Course fees are stored and charged in VND (SePay / VNPay).
  return `${new Intl.NumberFormat('vi-VN').format(Number(price))} VND`;
}

export function formatDuration(minutes?: number | null): string {
  const total = Math.max(minutes ?? 0, 0);
  if (total === 1) return translate('common.units.minute');
  if (total < 60) return translate('common.units.minutes', { count: total });
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (rest === 0) {
    return hours === 1
      ? translate('common.units.hour')
      : translate('common.units.hours', { count: hours });
  }
  return translate('common.units.hourMinute', { hours, minutes: rest });
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
    return translate('errors.thumbnailType');
  }
  if (file.size > MAX_THUMBNAIL_BYTES) {
    return translate('errors.thumbnailTooLarge');
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
