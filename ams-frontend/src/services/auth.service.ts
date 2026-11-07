import api from '@/lib/axios';
import { LoginRequest, AuthResponse, RegistrationPendingVerification } from '@/types';

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
  }): Promise<RegistrationPendingVerification> => {
    const res = await api.post<RegistrationPendingVerification>('/auth/register', data);
    return res.data;
  },
  verifyEmail: async (token: string): Promise<void> => { await api.get('/auth/verify-email', { params: { token } }); },
  forgotPassword: async (email: string): Promise<void> => { await api.post('/auth/forgot-password', { email }); },
  resetPassword: async (token: string, password: string): Promise<void> => { await api.post('/auth/reset-password', { token, password }); },
  google: async (idToken: string): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/google', { idToken })).data,
};
