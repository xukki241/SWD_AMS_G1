import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token' | 'tokenType'> | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (data) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ams_token', data.token);
        }
        set({
          token: data.token,
          user: {
            userId: data.userId,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            roles: data.roles,
          },
          isAuthenticated: true,
        });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ams_token');
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
      hasRole: (role) => get().user?.roles.includes(`ROLE_${role}`) ?? false,
    }),
    { name: 'ams-auth-store' }
  )
);
