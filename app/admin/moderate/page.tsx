'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import PhotoModerator from '../../components/admin/PhotoModerator';
import RoleGuard from '../../components/RoleGuard';

export default function ModeratePage() {
  const { user, loading } = useAuth();
  const { isAdmin, isOrganizer } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && !isAdmin && !isOrganizer) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, isOrganizer, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'organizer']}>
      <PhotoModerator />
    </RoleGuard>
  );
}

