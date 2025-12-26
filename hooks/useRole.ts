import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export type { UserRole };

export function useRole() {
  const { user, activeRole } = useAuth();

  // Use activeRole if set, otherwise fall back to first role
  const currentRole = activeRole || user?.roles?.[0] || 'user';

  const isUser = currentRole === 'user' || currentRole === 'guest';
  const isOrganizer = currentRole === 'organizer';
  const isPhotographer = currentRole === 'photographer';
  const isAdmin = currentRole === 'admin';
  const isOrganizerOrAdmin = isOrganizer || isAdmin;
  const isPhotographerOrOrganizer = isPhotographer || isOrganizer || isAdmin;

  // Check if user HAS a role (not just active)
  const hasRole = (role: UserRole) => user?.roles?.includes(role) || false;

  const canCreateEvents = isOrganizerOrAdmin;
  const canModeratePhotos = isOrganizerOrAdmin;
  const canManageUsers = isAdmin;
  const canDeleteAnyEvent = isAdmin;
  const canModerateAnyPhoto = isAdmin;

  return {
    role: currentRole as UserRole,
    roles: user?.roles || [],
    isUser,
    isOrganizer,
    isPhotographer,
    isAdmin,
    isOrganizerOrAdmin,
    isPhotographerOrOrganizer,
    hasRole,
    canCreateEvents,
    canModeratePhotos,
    canManageUsers,
    canDeleteAnyEvent,
    canModerateAnyPhoto,
  };
}
