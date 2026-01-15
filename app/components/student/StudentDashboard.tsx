'use client';

import { useQuery } from 'react-query';
import { userApi, eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Image as ImageIcon, Calendar, Upload, Plus, Sparkles, ShieldCheck } from 'lucide-react';
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
  const isFaceReady = !!stats?.data?.faceRegistered;
  
  // Memoize the filtered events to properly react to user.events changes
  const myEvents = useMemo(() => {
    if (!eventsData?.data?.events || !user?.events) return [];
    return eventsData.data.events.filter((e: any) => user.events?.includes(e._id));
  }, [eventsData?.data?.events, user?.events]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-white/5 bg-gradient-to-br from-[#1c1430] via-[#0f0b1d] to-[#0b1224] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/20 blur-3xl" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 border border-white/10">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <span className="text-sm text-gray-200">Welcome back{user?.name ? `, ${user.name}` : ''}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">My Photos Dashboard</h1>
          <p className="text-gray-300 max-w-2xl">
            Stay on top of your events, AI recognition, and photos — all within a calm, focused dashboard that mirrors the landing page aesthetic.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card group bg-gradient-to-br from-[#121022] via-[#0d0c19] to-[#0b0a14] border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">My Photos</p>
              <p className="text-3xl font-semibold text-white">{stats?.data?.photos || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <ImageIcon className="h-6 w-6 text-violet-300" />
            </div>
          </div>
          <div className="h-1 mt-5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
        </div>

        <div className="stat-card group bg-gradient-to-br from-[#121022] via-[#0d0c19] to-[#0b0a14] border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Events Joined</p>
              <p className="text-3xl font-semibold text-white">{stats?.data?.events || myEvents.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Calendar className="h-6 w-6 text-indigo-300" />
            </div>
          </div>
          <div className="h-1 mt-5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" />
        </div>

        <div className="stat-card group bg-gradient-to-br from-[#121022] via-[#0d0c19] to-[#0b0a14] border-white/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-400/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Face ID Status</p>
              <p className="text-3xl font-semibold text-white">{isFaceReady ? 'Ready' : 'Set up'}</p>
              <p className="text-xs text-gray-500 mt-1">{isFaceReady ? 'Recognition enabled' : 'Register to unlock matching'}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isFaceReady ? 'bg-emerald-500/10' : 'bg-amber-500/10'} group-hover:bg-white/10 transition-colors`}>
              <ShieldCheck className={`h-6 w-6 ${isFaceReady ? 'text-emerald-300' : 'text-amber-300'}`} />
            </div>
          </div>
          <div className={`h-1 mt-5 rounded-full ${isFaceReady ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400">Do more with fewer clicks</p>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300">
            Smarter workflow
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="action-card group text-left w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <Plus className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-white">Join Event by Code</p>
              <p className="text-sm text-gray-400">Enter a 6-digit code to join quickly</p>
            </div>
          </button>

          <Link href="/photos" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <ImageIcon className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <p className="font-semibold text-white">My Photos</p>
              <p className="text-sm text-gray-400">Browse and filter your gallery</p>
            </div>
          </Link>


          {!stats?.data?.faceRegistered && (
            <Link href="/register-face" className="action-card group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Upload className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <p className="font-semibold text-white">Register Face</p>
                <p className="text-sm text-gray-400">Enable AI matching on uploads</p>
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
                className="card-hover group bg-[#0f0d19] border-white/5"
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
