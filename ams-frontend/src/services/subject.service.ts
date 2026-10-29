import api from '@/lib/axios';
import { Subject, CreateSubjectRequest, Page } from '@/types';

export const subjectService = {
  getAll: async (page = 0, size = 10): Promise<Page<Subject>> => {
    const res = await api.get<Page<Subject>>('/subjects', { params: { page, size } });
    return res.data;
  },
  getById: async (id: number): Promise<Subject> => {
    const res = await api.get<Subject>(`/subjects/${id}`);
    return res.data;
  },
  create: async (data: CreateSubjectRequest): Promise<Subject> => {
    const res = await api.post<Subject>('/subjects', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateSubjectRequest>): Promise<Subject> => {
    const res = await api.put<Subject>(`/subjects/${id}`, data);
    return res.data;
  },
  activate: async (id: number): Promise<Subject> => {
    const res = await api.patch<Subject>(`/subjects/${id}/activate`);
    return res.data;
  },
  deactivate: async (id: number): Promise<Subject> => {
    const res = await api.patch<Subject>(`/subjects/${id}/deactivate`);
    return res.data;
  },
};
