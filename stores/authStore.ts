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

/** Debounce + dedupe concurrent /auth/me calls (prevents 429 storms). */
let loadUserInFlight: Promise<void> | null = null;
let lastLoadUserSuccessAt = 0;
const LOAD_USER_DEBOUNCE_MS = 4000;

interface AuthState {
  user: User | null;
  loading: boolean;
  activeRole: UserRole | null;
  initialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  loadUser: (options?: { force?: boolean }) => Promise<void>;
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
          await loadUser({ force: true });
        } else {
          set({ loading: false, initialized: true });
        }
      },

      loadUser: async (options) => {
        const force = options?.force === true;
        const now = Date.now();

        if (loadUserInFlight) {
          return loadUserInFlight;
        }

        if (
          !force &&
          get().user &&
          now - lastLoadUserSuccessAt < LOAD_USER_DEBOUNCE_MS
        ) {
          set({ loading: false, initialized: true });
          return;
        }

        const run = async () => {
          const hadUser = !!get().user;
          if (!hadUser) {
            set({ loading: true });
          }

          try {
            const response = await authApi.getMe();

            if (response.success && response.data) {
              const userData = response.data;

              const roles = userData.roles || [userData.role || 'guest'];
              const normalizedRoles = roles.map(normalizeRole);

              const user: User = {
                id: userData._id || userData.id || '',
                email: userData.email || '',
                name: userData.name || '',
                avatar: userData.avatar,
                role: normalizedRoles[0] || 'user',
                roles: normalizedRoles,
                faceRegistered: !!userData.faceId || !!userData.faceRegistered,
                createdAt: userData.createdAt,
                settings: userData.settings,
                events: userData.events?.map((e: { _id?: string } | string) =>
                  typeof e === 'string' ? e : e._id
                ),
              };

              const savedRole = localStorage.getItem('activeRole') as UserRole | null;
              const activeRole =
                savedRole && normalizedRoles.includes(savedRole)
                  ? savedRole
                  : normalizedRoles[0];

              lastLoadUserSuccessAt = Date.now();
              set({ user, activeRole, loading: false, initialized: true });
            } else {
              set({ loading: false, initialized: true });
            }
          } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;

            if (status === 429) {
              console.warn('[AuthStore] Rate limited on /auth/me — keeping session, will retry later');
              set({ loading: false, initialized: true });
              return;
            }

            if (status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('activeRole');
              set({ user: null, activeRole: null, loading: false, initialized: true });
              return;
            }

            console.error('Failed to load user:', error);
            set({ loading: false, initialized: true });
          }
        };

        loadUserInFlight = run().finally(() => {
          loadUserInFlight = null;
        });

        return loadUserInFlight;
      },

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });

          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);

            toast.success('Logged in successfully!');

            const { loadUser } = get();
            await loadUser({ force: true });
          }
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (data: { email: string; password: string; name: string }) => {
        try {
          const response = await authApi.register(data);

          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);

            toast.success('Account created successfully!');

            const { loadUser } = get();
            await loadUser({ force: true });
          }
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        try {
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
        } catch {
          /* ignore */
        }
        localStorage.removeItem('token');
        localStorage.removeItem('activeRole');
        lastLoadUserSuccessAt = 0;
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
          toast.success(
            `Switched to ${role === 'user' ? 'Guest' : role.charAt(0).toUpperCase() + role.slice(1)} view`
          );
          window.location.href = '/dashboard';
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
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
