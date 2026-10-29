import api from '@/lib/axios';
import {
  Assignment,
  AssignmentTemplate,
  CreateAssignmentRequest,
  CreateAssignmentTemplateRequest,
  AssignmentClass,
  AllocateAssignmentRequest,
  Page,
} from '@/types';

export const assignmentService = {
  // Assignments
  getAll: async (page = 0, size = 10): Promise<Page<Assignment>> => {
    const res = await api.get<Page<Assignment>>('/assignments', { params: { page, size } });
    return res.data;
  },
  getById: async (id: number): Promise<Assignment> => {
    const res = await api.get<Assignment>(`/assignments/${id}`);
    return res.data;
  },
  create: async (data: CreateAssignmentRequest): Promise<Assignment> => {
    const res = await api.post<Assignment>('/assignments', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateAssignmentRequest>): Promise<Assignment> => {
    const res = await api.put<Assignment>(`/assignments/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
  getMyAssignments: async (): Promise<Assignment[]> => {
    const res = await api.get<Assignment[]>('/assignments/my-assignments');
    return res.data;
  },

  // Assignment Templates
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

  // Assignment Class Allocation
  allocate: async (data: AllocateAssignmentRequest): Promise<AssignmentClass> => {
    const res = await api.post<AssignmentClass>('/assignment-classes', data);
    return res.data;
  },
  getAllocations: async (assignmentId: number): Promise<AssignmentClass[]> => {
    const res = await api.get<AssignmentClass[]>(`/assignment-classes/assignment/${assignmentId}`);
    return res.data;
  },
  cancelAllocation: async (id: number): Promise<AssignmentClass> => {
    const res = await api.patch<AssignmentClass>(`/assignment-classes/${id}/cancel`);
    return res.data;
  },
};
