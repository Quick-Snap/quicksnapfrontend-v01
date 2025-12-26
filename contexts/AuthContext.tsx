'use client';

import React, { useEffect, ReactNode } from 'react';
import { useQueryClient } from 'react-query';
import { useAuthStore } from '@/stores/authStore';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
}

/**
 * AuthProvider - Initializes the Zustand auth store and provides backward compatibility
 * This wrapper ensures the store is initialized on mount and integrates with react-query
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initialize = useAuthStore((state) => state.initialize);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Clear react-query cache when user logs out
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.user,
      (user, prevUser) => {
        if (prevUser && !user) {
          // User logged out - clear react-query cache
          queryClient.clear();
        }
      }
    );
    return unsubscribe;
  }, [queryClient]);

  return <>{children}</>;
}

/**
 * useAuth - Hook that provides the same API as the old context
 * This maintains backward compatibility with all existing usages
 */
export function useAuth(): AuthContextType {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const activeRole = useAuthStore((state) => state.activeRole);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const switchRole = useAuthStore((state) => state.switchRole);

  return {
    user,
    loading,
    activeRole,
    login,
    register,
    logout,
    updateUser,
    switchRole,
  };
}
