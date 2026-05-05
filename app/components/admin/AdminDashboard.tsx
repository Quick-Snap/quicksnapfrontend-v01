'use client';

import { useQuery } from 'react-query';
import { eventApi, photoApi, userApi } from '@/lib/api';
import { 
  Users, 
  Calendar, 
  Image as ImageIcon, 
  Shield, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: eventsData } = useQuery('allEvents', () => eventApi.getAll({}));
  const { data: pendingPhotos } = useQuery('pendingPhotos', () => 
    photoApi.getMyPhotos({ page: 1, limit: 10 })
  );
  const { data: stats } = useQuery('adminStats', () => userApi.getStats());

  const pendingCount = pendingPhotos?.data?.photos?.filter(
    (p: any) => p.moderationStatus === 'pending'
  ).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/25 dark:border-transparent dark:shadow-violet-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-100" />
              <span className="text-sm font-medium text-violet-100">Full System Access</span>
            </div>
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-violet-50">Manage the entire QuickSnap platform</p>
          </div>
          <div className="hidden rounded-xl border border-white/20 bg-white/15 px-4 py-2 backdrop-blur-sm md:block">
            <p className="text-sm text-white/90">System Status</p>
            <p className="text-lg font-semibold text-emerald-200">All Systems Operational</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Total Events</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{eventsData?.data?.events?.length || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-200/80 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
              <Calendar className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Pending Moderation</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{pendingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
              <AlertCircle className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Total Photos</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats?.data?.photos || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
              <ImageIcon className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">System Health</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <TrendingUp className="h-6 w-6 text-violet-700 dark:text-violet-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/events" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Calendar className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Manage Events</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">View and manage all events</p>
            </div>
          </Link>

          <Link href="/admin/moderate" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Moderate Photos</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Review pending photos</p>
            </div>
          </Link>

          <Link href="/admin/users" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200/80 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">View and manage users</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">Recent Events</h2>
          <div className="space-y-3">
            {eventsData?.data?.events?.slice(0, 5).map((event: any) => (
              <div
                key={event._id}
                className="flex items-center justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 transition-colors hover:border-violet-300/60 dark:border-white/5 dark:bg-white/5 dark:hover:border-violet-500/20"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{event.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-gray-400">{event.venue}</p>
                </div>
                <Link
                  href={`/events/${event._id}`}
                  className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  View →
                </Link>
              </div>
            ))}
            {(!eventsData?.data?.events || eventsData.data.events.length === 0) && (
              <div className="py-8 text-center text-zinc-500 dark:text-gray-500">No events found</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">Pending Moderation</h2>
          <div className="space-y-3">
            {pendingPhotos?.data?.photos
              ?.filter((p: any) => p.moderationStatus === 'pending')
              .slice(0, 5)
              .map((photo: any) => (
                <div
                  key={photo._id}
                  className="flex items-center justify-between rounded-xl border border-amber-200/90 bg-amber-50/80 p-4 dark:border-amber-500/20 dark:bg-amber-500/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{photo.fileName}</p>
                      <p className="text-xs text-zinc-500 dark:text-gray-400">Awaiting review</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/moderate/${photo._id}`}
                    className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            {pendingCount === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-500 dark:text-gray-500">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                <p>All caught up! No pending reviews.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
