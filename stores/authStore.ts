import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Helper to normalize roles from backend
const normalizeRole = (role: string): UserRole => {
  if (role === 'student') return 'user';
  if (role === 'guest') return 'user';
  return role as UserRole;
};

interface AuthState {
  user: User | null;
  loading: boolean;
  activeRole: UserRole | null;
  initialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  loadUser: () => Promise<void>;
  initialize: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  loading: true,
  activeRole: null,
  initialized: false,
};

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      ...initialState,

      setLoading: (loading: boolean) => set({ loading }),

      reset: () => set({ ...initialState, loading: false }),

      initialize: async () => {
        const { initialized, loadUser } = get();
        if (initialized) return;

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          await loadUser();
        } else {
          set({ loading: false, initialized: true });
        }
      },

      loadUser: async () => {
        try {
          set({ loading: true });
          const response = await authApi.getMe();
          
          if (response.success && response.data) {
            const userData = response.data;
            console.log('[AuthStore] Raw user data from API:', userData);
            
            const roles = userData.roles || [userData.role || 'guest'];
            const normalizedRoles = roles.map(normalizeRole);
            console.log('[AuthStore] Normalized roles:', normalizedRoles);

            const user: User = {
              id: userData._id || userData.id || '',
              email: userData.email || '',
              name: userData.name || '',
              avatar: userData.avatar,
              role: normalizedRoles[0] || 'user',
              roles: normalizedRoles,
              faceRegistered: !!userData.faceId,
              createdAt: userData.createdAt,
              settings: userData.settings,
              events: userData.events?.map((e: any) => typeof e === 'string' ? e : e._id),
            };

            // Load saved active role
            const savedRole = localStorage.getItem('activeRole') as UserRole | null;
            const activeRole = savedRole && normalizedRoles.includes(savedRole) 
              ? savedRole 
              : normalizedRoles[0];

            set({ user, activeRole, loading: false, initialized: true });
          } else {
            set({ loading: false, initialized: true });
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('activeRole');
          set({ user: null, activeRole: null, loading: false, initialized: true });
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);
            
            // Show success toast immediately
            toast.success('Logged in successfully!');
            
            // Fetch complete user data (including full events array) from /auth/me
            const { loadUser } = get();
            await loadUser();
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (data: { email: string; password: string; name: string }) => {
        try {
          const response = await authApi.register(data);
          
          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);
            
            // Show success toast immediately
            toast.success('Account created successfully!');
            
            // Fetch complete user data from /auth/me
            const { loadUser } = get();
            await loadUser();
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeRole');
        set({ user: null, activeRole: null });
        toast.success('Logged out successfully');
        window.location.href = '/login';
      },

      updateUser: (updatedUser: User) => {
        set({ user: updatedUser });
      },

      switchRole: (role: UserRole) => {
        const { user } = get();
        if (user && user.roles.includes(role)) {
          set({ activeRole: role });
          localStorage.setItem('activeRole', role);
          toast.success(`Switched to ${role === 'user' ? 'Guest' : role.charAt(0).toUpperCase() + role.slice(1)} view`);
          window.location.href = '/dashboard';
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist minimal data - actual user data is fetched on load
        activeRole: state.activeRole,
      }),
    }
    )
  )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useActiveRole = () => useAuthStore((state) => state.activeRole);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);

