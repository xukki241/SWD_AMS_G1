import api from '@/lib/axios';
import {
  Assignment,
  AssignmentOverviewItem,
  AssignmentTemplate,
  CreateAssignmentRequest,
  CreateAssignmentTemplateRequest,
  Page,
} from '@/types';

export const assignmentService = {
  getAll: async (): Promise<Assignment[]> => {
    const res = await api.get<Assignment[]>('/assignments');
    return res.data;
  },
  getById: async (id: number): Promise<Assignment> => {
    const res = await api.get<Assignment>(`/assignments/${id}`);
    return res.data;
  },
  getByCourse: async (courseId: number): Promise<Assignment[]> => {
    const res = await api.get<Assignment[]>(`/assignments/course/${courseId}`);
    return res.data;
  },
  getMyOverview: async (): Promise<AssignmentOverviewItem[]> => {
    const res = await api.get<AssignmentOverviewItem[]>('/assignments/overview');
    return res.data;
  },
  /** Create an assignment for a course (instructor or admin), optional handout file. */
  createForCourse: async (
    courseId: number,
    data: CreateAssignmentRequest,
    file?: File | null
  ): Promise<Assignment> => {
    if (file) {
      const form = new FormData();
      form.append(
        'data',
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      );
      form.append('file', file);
      const res = await api.post<Assignment>(`/assignments/course/${courseId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
    const res = await api.post<Assignment>(`/assignments/course/${courseId}`, data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateAssignmentRequest>): Promise<Assignment> => {
    const res = await api.put<Assignment>(`/assignments/${id}`, data);
    return res.data;
  },
  /** Partial update: title, dueAt, instructions, topic, maxScore (owning teacher). */
  patch: async (
    id: number,
    data: {
      title?: string;
      instructions?: string;
      rubric?: string;
      topic?: string;
      dueAt?: string;
      maxScore?: number;
      status?: 'DRAFT' | 'PUBLISHED';
    }
  ): Promise<Assignment> => {
    const res = await api.patch<Assignment>(`/assignments/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },

  // Reusable assignment templates
  getTemplates: async (page = 0, size = 10): Promise<Page<AssignmentTemplate>> => {
    const res = await api.get<Page<AssignmentTemplate>>('/assignment-templates', {
      params: { page, size },
    });
    return res.data;
  },
  getTemplateById: async (id: number): Promise<AssignmentTemplate> => {
    const res = await api.get<AssignmentTemplate>(`/assignment-templates/${id}`);
    return res.data;
  },
  createTemplate: async (data: CreateAssignmentTemplateRequest): Promise<AssignmentTemplate> => {
    const res = await api.post<AssignmentTemplate>('/assignment-templates', data);
    return res.data;
  },
  updateTemplate: async (
    id: number,
    data: Partial<CreateAssignmentTemplateRequest>
  ): Promise<AssignmentTemplate> => {
    const res = await api.put<AssignmentTemplate>(`/assignment-templates/${id}`, data);
    return res.data;
  },
  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/assignment-templates/${id}`);
  },
};
