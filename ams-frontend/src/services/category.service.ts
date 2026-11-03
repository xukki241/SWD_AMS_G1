import api from '@/lib/axios';
import { Category } from '@/types';

export const categoryService = {
  list: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },
};
