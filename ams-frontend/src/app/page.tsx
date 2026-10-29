'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const roles = user?.roles || [];
    if (roles.includes('ROLE_ADMIN')) router.push('/admin');
    else if (roles.includes('ROLE_EXPERT')) router.push('/expert');
    else if (roles.includes('ROLE_TEACHER')) router.push('/teacher');
    else router.push('/student');
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
