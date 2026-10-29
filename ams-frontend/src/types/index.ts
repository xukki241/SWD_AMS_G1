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
}

export interface CreateSubjectClassRequest {
  subjectId: number;
  classCode: string;
  className: string;
  term: string;
  expertId?: number;
  teacherId?: number;
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
}
