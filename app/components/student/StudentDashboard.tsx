'use client';

import { useQuery } from 'react-query';
import { userApi, eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Image as ImageIcon, Calendar, TrendingUp, Download, Upload, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import JoinEventModal from './JoinEventModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { data: stats } = useQuery('userStats', () => userApi.getStats(), {
    enabled: !!user,
  });
  const { data: eventsData } = useQuery(
    ['upcomingEvents', user?.id], 
    () => eventApi.getAll({ isActive: true, page: 1, limit: 6 }),
    { enabled: !!user }
  );
  
  // Memoize the filtered events to properly react to user.events changes
  const myEvents = useMemo(() => {
    if (!eventsData?.data?.events || !user?.events) return [];
    return eventsData.data.events.filter((e: any) => user.events?.includes(e._id));
  }, [eventsData?.data?.events, user?.events]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 shadow-2xl shadow-emerald-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-emerald-200" />
            <span className="text-emerald-200 text-sm font-medium">Welcome back</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My Photos Dashboard</h1>
          <p className="text-emerald-100">Discover and manage your event photos with AI recognition</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">My Photos</p>
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
              <p className="text-gray-400 text-sm mb-1">Events Joined</p>
              <p className="text-3xl font-bold text-white">{stats?.data?.events || 0}</p>
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
              <p className="text-gray-400 text-sm mb-1">Total Views</p>
              <p className="text-3xl font-bold text-white">{stats?.data?.totalViews || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Downloads</p>
              <p className="text-3xl font-bold text-white">{stats?.data?.totalDownloads || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Download className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="action-card group text-left w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Plus className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Join Event by Code</p>
              <p className="text-sm text-gray-400">Use a 6-digit code to join</p>
            </div>
          </button>

          <Link href="/photos" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <ImageIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">My Photos</p>
              <p className="text-sm text-gray-400">View all your photos</p>
            </div>
          </Link>


          {!stats?.data?.faceRegistered && (
            <Link href="/register-face" className="action-card group">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Upload className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Register Face</p>
                <p className="text-sm text-gray-400">Enable photo recognition</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">My Events</h2>
          <Link href="/events" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            View all →
          </Link>
        </div>
        {myEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((event: any) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="card-hover group"
              >
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">{event.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2 text-violet-400" />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">No upcoming events</p>
            <Link
              href="/events"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Browse all events →
            </Link>
          </div>
        )}
      </div>

      <JoinEventModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div >
  );
}
