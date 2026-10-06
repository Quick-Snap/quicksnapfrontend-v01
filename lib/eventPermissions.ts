import type { UserRole } from '@/types';

function getUserId(user: unknown): string {
  if (!user || typeof user !== 'object') return '';
  const u = user as Record<string, unknown>;
  const id = u.id || u._id || (u.user && typeof u.user === 'object' ? (u.user as Record<string, unknown>).id || (u.user as Record<string, unknown>)._id : '');
  return id ? String(id).trim() : '';
}

function getUserRoles(user: unknown): UserRole[] {
  if (!user || typeof user !== 'object') return [];
  const u = user as Record<string, unknown>;
  const roles: unknown[] = Array.isArray(u.roles) ? u.roles : [];
  if (u.role && typeof u.role === 'string') {
    roles.push(u.role);
  }
  return roles as UserRole[];
}

export function isOrganizerOfEvent(
  user: unknown,
  event: { organizer?: unknown } | null | undefined
): boolean {
  const userId = getUserId(user);
  if (!userId || !event) return false;
  const org = event.organizer as Record<string, unknown> | string | undefined;
  if (!org) return false;
  if (typeof org === 'string') return org.trim() === userId;
  const orgId = String(org._id || org.id || '').trim();
  return Boolean(orgId && orgId === userId);
}

export function isAssignedPhotographerForEvent(
  user: unknown,
  event: { photographers?: unknown[] } | null | undefined
): boolean {
  const userId = getUserId(user);
  if (!userId || !event?.photographers?.length) return false;
  return event.photographers.some((p: unknown) => {
    if (!p) return false;
    if (typeof p === 'string') return p.trim() === userId;
    if (typeof p === 'object') {
      const pId = String((p as Record<string, unknown>)._id || (p as Record<string, unknown>).id || '').trim();
      return Boolean(pId && pId === userId);
    }
    return false;
  });
}

/** Matches server rules: User is admin, event-level organizer, or assigned photographer. */
export function canRefreshAttendeePhotoMatches(
  user: unknown,
  event: { organizer?: unknown; photographers?: unknown[] } | null | undefined
): boolean {
  if (!user || !event) return false;
  const roles = getUserRoles(user);
  if (roles.includes('admin')) return true;
  return isOrganizerOfEvent(user, event) || isAssignedPhotographerForEvent(user, event);
}

/** Who may open `/events/[id]/manage` (read + allowed actions). */
export function canAccessEventManagePage(
  user: unknown,
  event: { organizer?: unknown; photographers?: unknown[] } | null | undefined
): boolean {
  return canRefreshAttendeePhotoMatches(user, event);
}

/** Organizer of this event or global admin — assign photographers, gallery curation, delete. */
export function canFullManageEvent(
  user: unknown,
  event: { organizer?: unknown } | null | undefined
): boolean {
  if (!user || !event) return false;
  const roles = getUserRoles(user);
  if (roles.includes('admin')) return true;
  return isOrganizerOfEvent(user, event);
}
