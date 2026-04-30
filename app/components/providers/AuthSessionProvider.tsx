'use client';

import { SessionProvider } from 'next-auth/react';
import { GoogleSessionSync } from '@/app/components/auth/GoogleSessionSync';

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <GoogleSessionSync />
      {children}
    </SessionProvider>
  );
}
