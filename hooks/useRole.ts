import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export type { UserRole };

export function useRole() {
  const { user, activeRole } = useAuth();

  // Deduplicate and sanitize roles
  const rawRoles = user?.roles || [];
  const uniqueRoles = Array.from(new Set(rawRoles.filter(Boolean))) as UserRole[];

  // Use activeRole if set, otherwise fall back to first role
  const currentRole = activeRole || uniqueRoles[0] || 'user';

  const isUser = currentRole === 'user' || currentRole === 'guest';
  const isOrganizer = currentRole === 'organizer';
  const isPhotographer = currentRole === 'photographer';
  const isAdmin = currentRole === 'admin';
  const isOrganizerOrAdmin = isOrganizer || isAdmin;
  const isPhotographerOrOrganizer = isPhotographer || isOrganizer || isAdmin;

  // Check if user HAS a role (not just active)
  const hasRole = (role: UserRole) => uniqueRoles.includes(role);

  const canCreateEvents = isOrganizerOrAdmin;
  const canModeratePhotos = isOrganizerOrAdmin;
  const canManageUsers = isAdmin;
  const canDeleteAnyEvent = isAdmin;
  const canModerateAnyPhoto = isAdmin;

  return {
    role: currentRole as UserRole,
    roles: uniqueRoles.length > 0 ? uniqueRoles : (['user'] as UserRole[]),
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
