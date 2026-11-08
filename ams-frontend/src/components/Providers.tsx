'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';

/** Ensure auth persist always finishes — prevents infinite landing spinner. */
function AuthHydration() {
  useEffect(() => {
    const mark = () => useAuthStore.getState().setHasHydrated(true);
    if (useAuthStore.persist.hasHydrated()) mark();
    const unsub = useAuthStore.persist.onFinishHydration(mark);
    const fallback = window.setTimeout(mark, 150);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <I18nProvider>
          <AuthHydration />
          {children}
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
