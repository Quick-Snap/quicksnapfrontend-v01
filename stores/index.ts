// Auth Store - User authentication and session management
export { 
  useAuthStore,
  useUser,
  useActiveRole,
  useAuthLoading,
  useIsAuthenticated,
} from './authStore';

// App Store - Application state (events, photos, UI)
export { 
  useAppStore,
  useEvents,
  usePhotos,
  useAppLoading,
  useUI,
  useSidebarOpen,
  useTheme,
  useEventById,
  usePhotosByEvent,
  useApprovedPhotos,
  usePendingPhotos,
} from './appStore';

// Re-export types
export type { AppUser, AppEvent, AppPhoto } from './appStore';

