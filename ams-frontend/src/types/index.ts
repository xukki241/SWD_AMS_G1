// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

// User
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: string[];
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles?: string[];
}

// Subject
export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateSubjectRequest {
  subjectCode: string;
  subjectName: string;
  description: string;
}

// SubjectClass
export interface SubjectClass {
  id: number;
  subjectId: number;
  subjectName: string;
  expertId?: number;
  expertName?: string;
  teacherId?: number;
  teacherName?: string;
  classCode: string;
  className: string;
  term: string;
  room?: string;
  joinCode?: string;
  capacity?: number;
  registrationFee?: number;
  enrolledCount?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
}

/** Google Classroom-shaped create payload. Server sets teacher, codes, fee, capacity. */
export interface CreateSubjectClassRequest {
  className: string;
  section?: string;
  subjectName: string;
  room?: string;
}

// AssignmentTemplate
export interface AssignmentTemplate {
  id: number;
  subjectId: number;
  subjectName: string;
  expertId: number;
  expertName: string;
  title: string;
  instructions: string;
  defaultDueRule: string;
}

export interface CreateAssignmentTemplateRequest {
  subjectId: number;
  title: string;
  instructions: string;
  defaultDueRule: string;
}

// Assignment
export interface Assignment {
  id: number;
  teacherId: number;
  teacherName: string;
  templateId?: number;
  title: string;
  instructions: string;
  dueAt: string;
}

export interface CreateAssignmentRequest {
  templateId?: number;
  title: string;
  instructions: string;
  dueAt: string;
}

// AssignmentClass
export interface AssignmentClass {
  id: number;
  assignmentId: number;
  subjectClassId: number;
  subjectClassName: string;
  allocatedAt: string;
  allocationStatus: 'ACTIVE' | 'CANCELLED';
}

export interface AllocateAssignmentRequest {
  assignmentId: number;
  subjectClassId: number;
}

// ClassRegistration
export interface ClassRegistration {
  id: number;
  studentId: number;
  studentName: string;
  subjectClassId: number;
  subjectClassName: string;
  registrationReference: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED';
  registeredAt: string;
  activatedAt?: string;
}

// PaymentTransaction
export interface PaymentTransaction {
  id: number;
  classRegistrationId: number;
  provider: string;
  providerReference?: string;
  amount: number;
  transactionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface InitiatePaymentRequest {
  classRegistrationId: number;
  amount: number;
  returnUrl: string;
}

export interface InitiatePaymentResponse {
  paymentUrl: string;
  transactionId: number;
}

// Submission
export interface Submission {
  id: number;
  classRegistrationId: number;
  assignmentId: number;
  assignmentTitle: string;
  submittedAt: string;
  secureFileReference?: string;
  fileMetadata?: string;
  submissionStatus: 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED';
}

export interface CreateSubmissionRequest {
  classRegistrationId: number;
  assignmentId: number;
  secureFileReference?: string;
  fileMetadata?: string;
}

// AssignmentEvaluation
export interface AssignmentEvaluation {
  id: number;
  submissionId: number;
  evaluatorId: number;
  evaluatorName: string;
  score?: number;
  feedback?: string;
  evaluationStatus: 'PENDING' | 'COMPLETED' | 'APPEALED';
}

export interface CreateEvaluationRequest {
  submissionId: number;
  score?: number;
  feedback?: string;
}

export interface UpdateEvaluationRequest {
  score?: number;
  feedback?: string;
  evaluationStatus?: 'PENDING' | 'COMPLETED' | 'APPEALED';
}

// Dashboard stats
export interface StudentDashboard {
  totalRegistrations: number;
  activeClasses: number;
  pendingSubmissions: number;
  gradedSubmissions: number;
  averageScore?: number;
}

export interface TeacherDashboard {
  totalAssignments: number;
  totalClasses: number;
  pendingEvaluations: number;
  completedEvaluations: number;
}

export interface AdminDashboard {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalClasses: number;
  totalRegistrations: number;
}

// Categories
export interface Category {
  id: number
  name: string
}

// Course management
export type CourseStatus = "DRAFT" | "PUBLISHED"
export type CourseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
export type LessonType = "VIDEO" | "READING" | "ASSIGNMENT"

export interface CourseSummary {
  id: number
  title: string
  code: string
  categoryId: number
  categoryName: string
  thumbnailUrl?: string | null
  price: number
  isFree: boolean
  status: CourseStatus
  difficultyLevel: CourseDifficulty
  instructorId: number
  instructorName: string
  createdAt: string
  updatedAt: string
}

export interface CourseMetrics {
  moduleCount: number
  lessonCount: number
  totalDurationMinutes: number
}

export interface CurriculumModuleSummary {
  id: number
  title: string
  orderIndex: number
  lessonCount: number
}

export interface CourseDetail extends CourseSummary {
  description: string
  about?: string | null
  whatStudentsWillLearn?: string | null
  prerequisites?: string | null
  metrics: CourseMetrics
  curriculum: CurriculumModuleSummary[]
}

export interface CourseRequestPayload {
  title: string
  code: string
  categoryId: number
  description: string
  thumbnailUrl?: string | null
  price: number
  isFree: boolean
  status: CourseStatus
  difficultyLevel: CourseDifficulty
  about?: string | null
  whatStudentsWillLearn?: string | null
  prerequisites?: string | null
}

export interface CourseListParams {
  keyword?: string
  categoryId?: number
  status?: CourseStatus
  page?: number
  size?: number
}

// Course content (modules + lessons)
export interface Lesson {
  id: number
  moduleId: number
  title: string
  type: LessonType
  duration: number
  status: CourseStatus
  orderIndex: number
}

export interface CourseModule {
  id: number
  courseId: number
  title: string
  orderIndex: number
  lessons: Lesson[]
}

export interface CourseContent {
  courseId: number
  courseTitle: string
  modules: CourseModule[]
  moduleCount: number
  lessonCount: number
  totalDurationMinutes: number
}

export interface LessonRequestPayload {
  title: string
  type: LessonType
  duration: number
  status?: CourseStatus
}

export interface ModuleOrderPayload {
  id: number
  lessonIds: number[]
}

// AI outline
export interface OutlineLesson {
  title: string
  type?: LessonType
  duration?: number
}

export interface OutlineModule {
  title: string
  lessons: OutlineLesson[]
}

export interface OutlineRequestPayload {
  topic?: string
  level?: string
  moduleCount?: number
}

export interface OutlineResponse {
  topic?: string
  level?: string
  moduleCount: number
  modules: OutlineModule[]
}

// Pagination
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// API Error
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  validationErrors?: Record<string, string>;
}
