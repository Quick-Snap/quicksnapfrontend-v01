'use client';

import RoleGuard from '@/app/components/RoleGuard';
import OrganizerRequestsPanel from '@/app/components/admin/OrganizerRequestsPanel';

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <OrganizerRequestsPanel />
    </RoleGuard>
  );
}
