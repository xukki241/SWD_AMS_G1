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

const AUTH_TOKEN_KEY = 'ams_token';
const AUTH_STORE_KEY = 'ams-auth-store';

function writeAuthStorage(
  next: Pick<AuthState, 'token' | 'user' | 'isAuthenticated'>
) {
  if (typeof window === 'undefined') return;
  if (next.token) localStorage.setItem(AUTH_TOKEN_KEY, next.token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
  try {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    localStorage.setItem(
      AUTH_STORE_KEY,
      JSON.stringify({
        ...parsed,
        state: {
          ...(parsed.state || {}),
          token: next.token,
          user: next.user,
          isAuthenticated: next.isAuthenticated,
        },
      })
    );
  } catch {
    // ignore storage write failures
  }
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
        const next = {
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
        };
        writeAuthStorage(next);
        set(next);
      },
      logout: () => {
        writeAuthStorage({ token: null, user: null, isAuthenticated: false });
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateProfile: (profile) => set((state) => ({ user: state.user ? { ...state.user, ...profile } : null })),
      hasRole: (role) => get().user?.roles.includes(`ROLE_${role}`) ?? false,
    }),
    {
      name: AUTH_STORE_KEY,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Always mark hydrated (even when storage was empty / state undefined)
        useAuthStore.setState({ hasHydrated: true });
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem(AUTH_TOKEN_KEY, state.token);
        }
      },
    }
  )
);
