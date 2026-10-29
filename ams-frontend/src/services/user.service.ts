import api from '@/lib/axios';
import { User, CreateUserRequest, UpdateUserRequest, Page } from '@/types';

export const userService = {
  getAll: async (page = 0, size = 10): Promise<Page<User>> => {
    const res = await api.get<Page<User>>('/admin/users', { params: { page, size } });
    return res.data;
  },
  getById: async (id: number): Promise<User> => {
    const res = await api.get<User>(`/admin/users/${id}`);
    return res.data;
  },
  create: async (data: CreateUserRequest): Promise<User> => {
    const res = await api.post<User>('/admin/users', data);
    return res.data;
  },
  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const res = await api.put<User>(`/admin/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
  search: async (query: string, page = 0, size = 10): Promise<Page<User>> => {
    const res = await api.get<Page<User>>('/admin/users/search', {
      params: { query, page, size },
    });
    return res.data;
  },
};
