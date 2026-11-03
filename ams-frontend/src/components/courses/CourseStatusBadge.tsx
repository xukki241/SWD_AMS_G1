import { Badge } from '@/components/ui/badge';
import type { CourseDifficulty, CourseStatus } from '@/types';
import { COURSE_STATUS_LABEL, DIFFICULTY_LABEL } from '@/components/courses/courseFormat';

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge variant={status === 'PUBLISHED' ? 'success' : 'secondary'}>
      {COURSE_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function DifficultyBadge({ level }: { level: CourseDifficulty }) {
  return (
    <Badge variant="outline" className="font-medium">
      {DIFFICULTY_LABEL[level] ?? level}
    </Badge>
  );
}
