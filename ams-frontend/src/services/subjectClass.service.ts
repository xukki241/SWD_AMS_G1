import api from '@/lib/axios';
import { SubjectClass, CreateSubjectClassRequest, Page } from '@/types';

export const subjectClassService = {
  getAll: async (page = 0, size = 10): Promise<Page<SubjectClass>> => {
    const res = await api.get<Page<SubjectClass>>('/subject-classes', { params: { page, size } });
    return res.data;
  },
  getById: async (id: number): Promise<SubjectClass> => {
    const res = await api.get<SubjectClass>(`/subject-classes/${id}`);
    return res.data;
  },
  create: async (data: CreateSubjectClassRequest): Promise<SubjectClass> => {
    const res = await api.post<SubjectClass>('/subject-classes', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateSubjectClassRequest>): Promise<SubjectClass> => {
    const res = await api.put<SubjectClass>(`/subject-classes/${id}`, data);
    return res.data;
  },
  /** Partial update: className, section/term, room (owning teacher). */
  patch: async (
    id: number,
    data: { className?: string; section?: string; term?: string; room?: string }
  ): Promise<SubjectClass> => {
    const res = await api.patch<SubjectClass>(`/subject-classes/${id}`, data);
    return res.data;
  },
  archive: async (id: number): Promise<SubjectClass> => {
    const res = await api.post<SubjectClass>(`/subject-classes/${id}/archive`);
    return res.data;
  },
  removeStudent: async (classId: number, studentId: number): Promise<void> => {
    await api.delete(`/subject-classes/${classId}/students/${studentId}`);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/subject-classes/${id}`);
  },
  getBySubject: async (subjectId: number, page = 0, size = 10): Promise<Page<SubjectClass>> => {
    const res = await api.get<Page<SubjectClass>>(`/subject-classes/subject/${subjectId}`, {
      params: { page, size },
    });
    return res.data;
  },
  getMyClasses: async (): Promise<SubjectClass[]> => {
    const res = await api.get<SubjectClass[]>('/subject-classes/my-classes');
    return res.data;
  },
};
