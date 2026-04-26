import type { User, UserRole } from '@/types';

const ELEVATED_ROLES: UserRole[] = ['admin', 'organizer', 'photographer'];

function hasElevatedJwtRole(user: Pick<User, 'roles'> | null | undefined): boolean {
  const roles = user?.roles ?? [];
  return ELEVATED_ROLES.some((r) => roles.includes(r));
}

function isOrganizerOfEvent(
  user: Pick<User, 'id'> | null | undefined,
  event: { organizer?: unknown } | null | undefined
): boolean {
  if (!user?.id || !event) return false;
  const org = event.organizer as { _id?: string } | string | undefined;
  if (typeof org === 'string') return org === user.id;
  return org?._id === user.id;
}

function isAssignedPhotographerForEvent(
  user: Pick<User, 'id'> | null | undefined,
  event: { photographers?: unknown[] } | null | undefined
): boolean {
  if (!user?.id || !event?.photographers?.length) return false;
  return event.photographers.some((p: unknown) => {
    if (typeof p === 'string') return p === user.id;
    if (p && typeof p === 'object' && '_id' in p) {
      return (p as { _id?: string })._id === user.id;
    }
    return false;
  });
}

/** Matches server rules: JWT must be organizer/photographer/admin, and event-level organizer / assigned photographer / admin. */
export function canRefreshAttendeePhotoMatches(
  user: Pick<User, 'id' | 'roles'> | null | undefined,
  event: { organizer?: unknown; photographers?: unknown[] } | null | undefined
): boolean {
  if (!user || !event) return false;
  if (!hasElevatedJwtRole(user)) return false;
  if (user.roles?.includes('admin')) return true;
  return isOrganizerOfEvent(user, event) || isAssignedPhotographerForEvent(user, event);
}

/** Who may open `/events/[id]/manage` (read + allowed actions). */
export function canAccessEventManagePage(
  user: Pick<User, 'id' | 'roles'> | null | undefined,
  event: { organizer?: unknown; photographers?: unknown[] } | null | undefined
): boolean {
  return canRefreshAttendeePhotoMatches(user, event);
}

/** Organizer of this event or global admin — assign photographers, gallery curation, delete. */
export function canFullManageEvent(
  user: Pick<User, 'id' | 'roles'> | null | undefined,
  event: { organizer?: unknown } | null | undefined
): boolean {
  if (!user || !event) return false;
  if (user.roles?.includes('admin')) return true;
  return isOrganizerOfEvent(user, event);
}
