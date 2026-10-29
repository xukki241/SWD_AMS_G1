import api from '@/lib/axios';
import { Submission, CreateSubmissionRequest, Page } from '@/types';

export const submissionService = {
  getAll: async (page = 0, size = 10): Promise<Page<Submission>> => {
    const res = await api.get<Page<Submission>>('/submissions', { params: { page, size } });
    return res.data;
  },
  getById: async (id: number): Promise<Submission> => {
    const res = await api.get<Submission>(`/submissions/${id}`);
    return res.data;
  },
  create: async (data: CreateSubmissionRequest): Promise<Submission> => {
    const res = await api.post<Submission>('/submissions', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateSubmissionRequest>): Promise<Submission> => {
    const res = await api.put<Submission>(`/submissions/${id}`, data);
    return res.data;
  },
  submit: async (id: number): Promise<Submission> => {
    const res = await api.patch<Submission>(`/submissions/${id}/submit`);
    return res.data;
  },
  getMySubmissions: async (): Promise<Submission[]> => {
    const res = await api.get<Submission[]>('/submissions/my-submissions');
    return res.data;
  },
  getByAssignment: async (assignmentId: number, page = 0, size = 10): Promise<Page<Submission>> => {
    const res = await api.get<Page<Submission>>(`/submissions/assignment/${assignmentId}`, {
      params: { page, size },
    });
    return res.data;
  },
};
