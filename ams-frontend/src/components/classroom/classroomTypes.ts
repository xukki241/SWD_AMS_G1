// Response shapes for the classroom endpoints (verified against backend DTOs).

export interface PublicClass {
  id: number
  subjectId: number
  subjectCode: string
  subjectName: string
  expertId?: number | null
  expertName?: string | null
  teacherId?: number | null
  teacherName?: string | null
  classCode: string
  className: string
  term: string
  joinCode: string
  capacity: number
  registrationFee: number
  enrolledCount: number
}

export interface MyClass extends PublicClass {
  classId?: number
  assignmentCount?: number
  ungradedCount?: number
  myRegistrationStatus?: "PENDING_PAYMENT" | "ACTIVE" | "CANCELLED" | null
}

export interface Registration {
  id: number
  studentId: number
  studentName: string
  subjectClassId: number
  classCode: string
  className: string
  subjectCode: string
  subjectName: string
  registrationReference: string
  status: "PENDING_PAYMENT" | "ACTIVE" | "CANCELLED"
  registeredAt: string
  activatedAt?: string | null
}

export interface PaymentTransaction {
  id: number
  classRegistrationId: number
  provider: string
  providerReference?: string | null
  amount: number
  transactionStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
  createdAt: string
}

export interface AssignmentItem {
  id: number
  teacherId: number
  teacherName: string
  templateId?: number | null
  title: string
  instructions: string
  dueAt: string
  maxScore: number
}

export interface AssignmentOverviewItem {
  classId: number
  classCode: string
  className: string
  assignmentId: number
  title: string
  instructions: string
  dueAt: string
  maxScore: number
  workState: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "LATE" | "GRADED"
  submissionId?: number | null
  score?: number | null
}

export interface Evaluation {
  id: number
  submissionId: number
  evaluatorId: number
  evaluatorName: string
  score?: number | null
  feedback?: string | null
  evaluationStatus: "PENDING" | "COMPLETED" | "APPEALED"
}

export interface SubmissionItem {
  id: number
  classRegistrationId: number
  studentId: number
  studentName: string
  assignmentId: number
  assignmentTitle: string
  submittedAt: string
  secureFileReference?: string | null
  fileMetadata?: string | null
  submissionStatus: "DRAFT" | "SUBMITTED" | "LATE" | "GRADED"
  evaluation?: Evaluation | null
}

export interface Post {
  id: number
  subjectClassId: number
  classCode: string
  authorId: number
  authorName: string
  body: string
  attachmentReference?: string | null
  attachmentFilename?: string | null
  attachmentSize?: number | null
  createdAt: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  fullName: string
  accountStatus: string
  createdAt: string
  roles: string[]
}

export interface Subject {
  id: number
  subjectCode: string
  subjectName: string
  description: string
  status: "ACTIVE" | "INACTIVE"
}

export interface TemplateItem {
  id: number
  subjectId: number
  subjectName: string
  expertId: number
  expertName: string
  title: string
  instructions: string
  defaultDueRule: string
}

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
  totalExperts: number
  totalSubjects: number
  totalClasses: number
  totalRegistrations: number
}
