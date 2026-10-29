import api from '@/lib/axios';
import { LoginRequest, AuthResponse } from '@/types';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },
  register: async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
};
