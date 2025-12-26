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
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-violet-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-violet-200" />
              <span className="text-violet-200 text-sm font-medium">Full System Access</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-violet-100">Manage the entire QuickSnap platform</p>
          </div>
          <div className="hidden md:block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-sm text-white/80">System Status</p>
            <p className="text-lg font-semibold text-emerald-300">All Systems Operational</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Events</p>
              <p className="text-3xl font-bold text-white">{eventsData?.data?.events?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Moderation</p>
              <p className="text-3xl font-bold text-white">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Photos</p>
              <p className="text-3xl font-bold text-white">{stats?.data?.photos || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <ImageIcon className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">System Health</p>
              <p className="text-3xl font-bold text-emerald-400">100%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/events" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <Calendar className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Manage Events</p>
              <p className="text-sm text-gray-400">View and manage all events</p>
            </div>
          </Link>

          <Link href="/admin/moderate" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Moderate Photos</p>
              <p className="text-sm text-gray-400">Review pending photos</p>
            </div>
          </Link>

          <Link href="/admin/users" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Manage Users</p>
              <p className="text-sm text-gray-400">View and manage users</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
          <div className="space-y-3">
            {eventsData?.data?.events?.slice(0, 5).map((event: any) => (
              <div
                key={event._id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/20 transition-colors"
              >
                <div>
                  <p className="font-semibold text-white">{event.name}</p>
                  <p className="text-sm text-gray-400">{event.venue}</p>
                </div>
                <Link
                  href={`/events/${event._id}`}
                  className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
                >
                  View →
                </Link>
              </div>
            ))}
            {(!eventsData?.data?.events || eventsData.data.events.length === 0) && (
              <div className="text-center py-8 text-gray-500">No events found</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Pending Moderation</h2>
          <div className="space-y-3">
            {pendingPhotos?.data?.photos
              ?.filter((p: any) => p.moderationStatus === 'pending')
              .slice(0, 5)
              .map((photo: any) => (
                <div
                  key={photo._id}
                  className="flex items-center justify-between p-4 bg-amber-500/5 rounded-xl border border-amber-500/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{photo.fileName}</p>
                      <p className="text-xs text-gray-400">Awaiting review</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/moderate/${photo._id}`}
                    className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            {pendingCount === 0 && (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p>All caught up! No pending reviews.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
