'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import AdminDashboard from '../components/admin/AdminDashboard';
import OrganizerDashboard from '../components/organizer/OrganizerDashboard';
import StudentDashboard from '../components/student/StudentDashboard';
import PhotographerDashboard from '../components/photographer/PhotographerDashboard';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-white/15 dark:border-t-violet-500" />
        </div>
        <p className="mt-6 text-center text-sm font-medium text-zinc-500 dark:text-gray-400">Loading your dashboard…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'organizer') {
    return <OrganizerDashboard />;
  }

  if (role === 'photographer') {
    return <PhotographerDashboard />;
  }

  return <StudentDashboard />;
}
