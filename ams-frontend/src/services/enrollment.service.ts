import api from '@/lib/axios';
import { CourseEnrollment } from '@/types';

export const enrollmentService = {
  /** Enroll current student: free -> ACTIVE, paid -> PENDING_PAYMENT. */
  enroll: async (courseId: number): Promise<CourseEnrollment> => {
    const res = await api.post<CourseEnrollment>(`/courses/${courseId}/enroll`);
    return res.data;
  },
  getMyEnrollments: async (): Promise<CourseEnrollment[]> => {
    const res = await api.get<CourseEnrollment[]>('/enrollments/my');
    return res.data;
  },
  getMyEnrollmentInCourse: async (courseId: number): Promise<CourseEnrollment> => {
    const res = await api.get<CourseEnrollment>(`/courses/${courseId}/enrollments/me`);
    return res.data;
  },
  /** Roster for a course (teacher owner or admin). */
  getByCourse: async (courseId: number): Promise<CourseEnrollment[]> => {
    const res = await api.get<CourseEnrollment[]>(`/courses/${courseId}/enrollments`);
    return res.data;
  },
  cancel: async (enrollmentId: number): Promise<void> => {
    await api.delete(`/enrollments/${enrollmentId}`);
  },
};
