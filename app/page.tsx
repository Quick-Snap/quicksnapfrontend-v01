'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';
import { useAuthStore } from '@/stores';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    // Once initialized, redirect logged-in users to dashboard
    if (initialized && !loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, initialized, router]);

  // Show nothing while checking auth state to prevent flash
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected - show loading state
  if (user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <LandingPage
      loginHref="/login"
      signupHref="/register"
      brandName="QUICKSNAP"
    />
  );
}
