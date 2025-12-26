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
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 animate-pulse font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render role-based dashboard
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'organizer') {
    return <OrganizerDashboard />;
  }

  if (role === 'photographer') {
    return <PhotographerDashboard />;
  }

  // Default to student dashboard
  return <StudentDashboard />;
}
