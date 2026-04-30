'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores';

/**
 * When the user signs in with Google, NextAuth holds our API JWT. Mirror it
 * into `localStorage` and refresh the Zustand user so existing API clients work.
 */
export function GoogleSessionSync() {
  const { data: session, status } = useSession();
  const loadUser = useAuthStore((s) => s.loadUser);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      lastSynced.current = null;
      return;
    }
    if (status !== 'authenticated' || !session?.accessToken) return;
    if (lastSynced.current === session.accessToken) return;
    lastSynced.current = session.accessToken;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('token', session.accessToken);
    } catch {
      return;
    }
    void loadUser();
  }, [status, session?.accessToken, loadUser]);

  return null;
}
