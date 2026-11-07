import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token' | 'tokenType'> | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAuth: (data: AuthResponse) => void;
  updateProfile: (profile: { fullName: string; avatarUrl?: string | null }) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
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
            avatarUrl: data.avatarUrl,
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
      updateProfile: (profile) => set((state) => ({ user: state.user ? { ...state.user, ...profile } : null })),
      hasRole: (role) => get().user?.roles.includes(`ROLE_${role}`) ?? false,
    }),
    {
      name: 'ams-auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
