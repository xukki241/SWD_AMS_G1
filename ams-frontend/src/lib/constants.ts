export const ROLES = ['ADMIN', 'EXPERT', 'TEACHER', 'STUDENT'] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const REGISTRATION_STATUSES = ['PENDING_PAYMENT', 'ACTIVE', 'CANCELLED'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const SUBMISSION_STATUSES = ['DRAFT', 'SUBMITTED', 'LATE', 'GRADED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EVALUATION_STATUSES = ['PENDING', 'COMPLETED', 'APPEALED'] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const SUBJECT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];

export const ALLOCATION_STATUSES = ['ACTIVE', 'CANCELLED'] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const NAV_ITEMS = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Users', href: '/admin/users', icon: 'Users' },
    { label: 'Subjects', href: '/admin/subjects', icon: 'BookOpen' },
    { label: 'Classes', href: '/admin/classes', icon: 'School' },
  ],
  EXPERT: [
    { label: 'Dashboard', href: '/expert', icon: 'LayoutDashboard' },
    { label: 'Templates', href: '/expert/templates', icon: 'FileText' },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/teacher', icon: 'LayoutDashboard' },
    { label: 'Assignments', href: '/teacher/assignments', icon: 'ClipboardList' },
    { label: 'Evaluations', href: '/teacher/evaluations', icon: 'Star' },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: 'LayoutDashboard' },
    { label: 'My Classes', href: '/student/classes', icon: 'School' },
    { label: 'Assignments', href: '/student/assignments', icon: 'ClipboardList' },
    { label: 'Submissions', href: '/student/submissions', icon: 'Upload' },
  ],
} as const;
