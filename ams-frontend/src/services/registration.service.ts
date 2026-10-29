import api from '@/lib/axios';
import { ClassRegistration, Page } from '@/types';

export const registrationService = {
  getAll: async (page = 0, size = 10): Promise<Page<ClassRegistration>> => {
    const res = await api.get<Page<ClassRegistration>>('/class-registrations', {
      params: { page, size },
    });
    return res.data;
  },
  getById: async (id: number): Promise<ClassRegistration> => {
    const res = await api.get<ClassRegistration>(`/class-registrations/${id}`);
    return res.data;
  },
  register: async (subjectClassId: number): Promise<ClassRegistration> => {
    const res = await api.post<ClassRegistration>('/class-registrations', { subjectClassId });
    return res.data;
  },
  cancel: async (id: number): Promise<ClassRegistration> => {
    const res = await api.patch<ClassRegistration>(`/class-registrations/${id}/cancel`);
    return res.data;
  },
  getMyRegistrations: async (): Promise<ClassRegistration[]> => {
    const res = await api.get<ClassRegistration[]>('/class-registrations/my-registrations');
    return res.data;
  },
  getByClass: async (subjectClassId: number, page = 0, size = 10): Promise<Page<ClassRegistration>> => {
    const res = await api.get<Page<ClassRegistration>>(
      `/class-registrations/class/${subjectClassId}`,
      { params: { page, size } }
    );
    return res.data;
  },
};
