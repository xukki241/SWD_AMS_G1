// Auth
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegistrationPendingVerification { message: string; email: string }
export interface UserProfile { id: number; username: string; email: string; fullName: string; avatarUrl?: string | null }

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  roles: string[];
  /** False until the user picks Student or Teacher on first login. */
  onboardingCompleted: boolean;
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
  avatarUrl?: string | null;
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

// Course Enrollment
export interface CourseEnrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  courseCode: string;
  courseThumbnailUrl?: string | null;
  studentId: number;
  studentName: string;
  registrationReference: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  amount: number;
  registeredAt: string;
  activatedAt?: string | null;
}

// AssignmentTemplate
export interface AssignmentTemplate {
  id: number;
  subjectId: number;
  subjectName: string;
  createdById: number;
  createdByName: string;
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
export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

export interface CriterionScore {
  id: string;
  score: number;
  feedback?: string;
}

export interface Assignment {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  templateId?: number;
  title: string;
  instructions?: string;
  rubric?: string | null;
  rubricCriteria?: RubricCriterion[] | null;
  topic?: string;
  dueAt: string;
  maxScore: number;
  status: 'DRAFT' | 'PUBLISHED';
  attachmentUrl?: string | null;
  attachmentMetadata?: string | null;
}

export interface CreateAssignmentRequest {
  templateId?: number;
  title: string;
  instructions?: string;
  rubric?: string;
  rubricCriteria?: RubricCriterion[];
  topic?: string;
  dueAt: string;
  maxScore?: number;
  status?: 'DRAFT' | 'PUBLISHED';
}

/** Student's view of one course assignment with their own work state. */
export interface AssignmentOverviewItem {
  courseId: number;
  courseCode: string;
  courseTitle: string;
  enrollmentId: number;
  assignmentId: number;
  title: string;
  instructions?: string;
  topic?: string;
  dueAt: string;
  maxScore: number;
  workState: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'UNDER_EVALUATION';
  submissionId?: number;
  score?: number;
}

// PaymentTransaction
export interface PaymentTransaction {
  id: number;
  courseEnrollmentId: number;
  provider: string;
  providerReference?: string;
  amount: number;
  transactionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface TeacherPayment {
  id: number;
  courseEnrollmentId: number;
  courseCode: string;
  courseTitle: string;
  studentName: string;
  studentUsername: string;
  provider: string;
  providerReference?: string;
  amount: number;
  transactionStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  direction: 'RECEIVED' | 'OUTGOING';
  createdAt: string;
}

export interface PaymentUrlResponse {
  paymentUrl: string;
  transactionRef: string;
  amount: number;
}

export interface SePayCheckoutResponse {
  checkoutUrl: string;
  formFields: Record<string, string>;
  transactionRef: string;
  amount: number;
}

export interface PayOSCheckoutResponse {
  checkoutUrl: string;
  qrCode?: string | null;
  paymentLinkId?: string | null;
  transactionRef: string;
  amount: number;
}

// Submission
export interface Submission {
  id: number;
  courseEnrollmentId: number;
  studentId: number;
  studentName: string;
  assignmentId: number;
  assignmentTitle: string;
  submittedAt: string;
  secureFileReference?: string;
  fileMetadata?: string;
  answerText?: string | null;
  submissionStatus: 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED';
  evaluation?: AssignmentEvaluation;
}

// AssignmentEvaluation
export interface AssignmentEvaluation {
  id: number;
  submissionId: number;
  evaluatorId: number | null;
  evaluatorName: string;
  score?: number;
  feedback?: string;
  evaluationStatus: 'PENDING' | 'COMPLETED' | 'APPEALED';
  aiDraftScore?: number | null;
  aiDraftFeedback?: string | null;
  aiDraftCriteria?: CriterionScore[] | null;
  criteriaScores?: CriterionScore[] | null;
  published?: boolean;
  viewedAt?: string | null;
}

export interface CreateEvaluationRequest {
  submissionId: number;
  score?: number;
  feedback?: string;
  criteriaScores?: CriterionScore[];
}

export interface UpdateEvaluationRequest {
  score?: number;
  feedback?: string;
  evaluationStatus?: 'PENDING' | 'COMPLETED' | 'APPEALED';
}

// Dashboard stats
export interface StudentDashboard {
  totalEnrollments: number;
  activeCourses: number;
  submittedAssignments: number;
  gradedAssignments: number;
  averageScore?: number;
}

export interface TeacherDashboard {
  totalAssignments: number;
  totalCourses: number;
  pendingEvaluations: number;
  completedEvaluations: number;
}

export interface AdminDashboard {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalCourses: number;
  totalEnrollments: number;
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
