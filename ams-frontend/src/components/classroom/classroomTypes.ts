// Shared shapes for the classroom-flavoured components, now on the course domain.
// Canonical types live in @/types; these aliases keep component imports stable.

import type {
  Assignment,
  AssignmentOverviewItem,
  AssignmentEvaluation,
  CourseEnrollment,
  CourseSummary,
  Submission,
  User,
  Subject,
  AssignmentTemplate,
} from "@/types"

export type CourseItem = CourseSummary
export type Enrollment = CourseEnrollment
export type AssignmentItem = Assignment
export type { AssignmentOverviewItem }
export type Evaluation = AssignmentEvaluation
export type SubmissionItem = Submission
export type UserInfo = User
export type SubjectItem = Subject
export type TemplateItem = AssignmentTemplate

export interface AuditLogEntry {
  id: number
  actorId?: number | null
  action: string
  resourceType: string
  resourceReference?: string | null
  occurredAt: string
}

export interface AdminDashboard {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalSubjects: number
  totalCourses: number
  totalEnrollments: number
}
