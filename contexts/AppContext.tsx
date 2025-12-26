'use client';

import React, { ReactNode } from 'react';
import { useAppStore, AppUser, AppEvent, AppPhoto } from '@/stores/appStore';

interface AppContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  events: AppEvent[];
  photos: AppPhoto[];
  loading: boolean;
}

/**
 * AppProvider - Wrapper for backward compatibility
 * The actual state is managed by Zustand, this just provides the old context API
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * useApp - Hook that provides the same API as the old context
 * This maintains backward compatibility with all existing usages
 */
export function useApp(): AppContextType {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const events = useAppStore((state) => state.events);
  const photos = useAppStore((state) => state.photos);
  const loading = useAppStore((state) => state.loading);

  return {
    user,
    setUser,
    events,
    photos,
    loading,
  };
}

// Re-export types for backward compatibility
export type { AppUser, AppEvent, AppPhoto };
