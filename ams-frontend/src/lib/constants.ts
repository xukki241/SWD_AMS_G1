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
    { label: 'Users & Roles', href: '/admin#users', icon: 'Users' },
    { label: 'Subjects', href: '/admin#subjects', icon: 'BookOpen' },
    { label: 'Classes', href: '/admin#classes', icon: 'School' },
    { label: 'Audit Trail', href: '/admin#audit', icon: 'ShieldCheck' },
  ],
  EXPERT: [
    { label: 'Dashboard', href: '/expert', icon: 'LayoutDashboard' },
    { label: 'My Classes', href: '/expert#classes', icon: 'School' },
    { label: 'Templates', href: '/expert#templates', icon: 'FileText' },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/teacher', icon: 'LayoutDashboard' },
    { label: 'My Classes', href: '/teacher#classes', icon: 'School' },
    { label: 'New Classwork', href: '/teacher#new-assignment', icon: 'ClipboardList' },
  ],
  STUDENT: [
    { label: 'Home', href: '/student', icon: 'LayoutDashboard' },
    { label: 'My Classes', href: '/student#classes', icon: 'School' },
    { label: 'Find a Class', href: '/student#find', icon: 'KeyRound' },
    { label: 'Payments', href: '/student#payments', icon: 'CreditCard' },
    { label: 'My Work', href: '/student#work', icon: 'Upload' },
  ],
} as const;
