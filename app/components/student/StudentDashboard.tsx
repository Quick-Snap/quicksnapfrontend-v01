'use client';

import { useQuery } from 'react-query';
import { userApi, eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Image as ImageIcon, Calendar, Upload, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import JoinEventModal from './JoinEventModal';

const statShell =
  'border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-white shadow-sm shadow-zinc-900/5 dark:border-white/10 dark:from-[#121022] dark:via-[#0d0c19] dark:to-[#0b0a14] dark:shadow-none';

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

  const myEvents = useMemo(() => {
    if (!eventsData?.data?.events || !user?.events) return [];
    return eventsData.data.events.filter((e: any) => user.events?.includes(e._id));
  }, [eventsData?.data?.events, user?.events]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#1c1430] dark:via-[#0f0b1d] dark:to-[#0b1224] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-70" />
        <div className="absolute -right-10 -top-10 h-48 w-48 bg-violet-300/40 blur-3xl dark:bg-purple-500/20" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-4 py-1 dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            <span className="text-sm text-zinc-700 dark:text-gray-200">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
            My Photos Dashboard
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
            Stay on top of your events, AI recognition, and photos — all within a calm, focused dashboard that mirrors the
            landing page aesthetic.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/photos"
          className={`stat-card group block ${statShell} text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">My Photos</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{stats?.data?.photos || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <ImageIcon className="h-6 w-6 text-violet-700 dark:text-violet-300" />
            </div>
          </div>
          <div className="mt-5 h-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        </Link>

        <Link
          href="/events"
          className={`stat-card group block ${statShell} text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Events Joined</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">
                {stats?.data?.events || myEvents.length || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 transition-colors group-hover:bg-indigo-200/80 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20">
              <Calendar className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />
            </div>
          </div>
          <div className="mt-5 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
        </Link>

        {isFaceReady ? (
          <div className={`stat-card group relative overflow-hidden ${statShell}`}>
            <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-300/30 blur-3xl dark:bg-green-400/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Face ID Status</p>
                <p className="text-3xl font-semibold text-zinc-900 dark:text-white">Ready</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-500">Recognition enabled</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-white/10">
                <ShieldCheck className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
            <div className="mt-5 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" />
          </div>
        ) : (
          <Link
            href="/register-face"
            className={`stat-card group relative block overflow-hidden ${statShell} text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50`}
          >
            <div className="absolute right-0 top-0 h-24 w-24 bg-amber-200/50 blur-3xl dark:bg-green-400/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Face ID Status</p>
                <p className="text-3xl font-semibold text-zinc-900 dark:text-white">Set up</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-500">Register to unlock matching</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-white/10">
                <ShieldCheck className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <div className="mt-5 h-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" />
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0d0b14] dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-gray-400">Do more with fewer clicks</p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            Smarter workflow
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="action-card group w-full text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Plus className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Join Event by Code</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Enter a 6-digit code to join quickly</p>
            </div>
          </button>

          <Link href="/photos" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 transition-colors group-hover:bg-indigo-200/80 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20">
              <ImageIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">My Photos</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Browse and filter your gallery</p>
            </div>
          </Link>

          {!stats?.data?.faceRegistered && (
            <Link href="/register-face" className="action-card group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 transition-colors group-hover:bg-purple-200/80 dark:bg-purple-500/10 dark:group-hover:bg-purple-500/20">
                <Upload className="h-5 w-5 text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Register Face</p>
                <p className="text-sm text-zinc-500 dark:text-gray-400">Enable AI matching on uploads</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">My Events</h2>
          <Link
            href="/events"
            className="font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            View all →
          </Link>
        </div>
        {myEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myEvents.map((event: any) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="card-hover group border-zinc-200/90 bg-white dark:border-white/5 dark:bg-[#0f0d19]"
              >
                <h3 className="mb-2 text-xl font-semibold text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-400">
                  {event.name}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-gray-400">{event.description}</p>
                <div className="flex items-center text-sm text-zinc-500 dark:text-gray-500">
                  <Calendar className="mr-2 h-4 w-4 text-violet-600 dark:text-violet-400" />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-gray-600" />
            <p className="mb-4 text-zinc-600 dark:text-gray-300">No upcoming events</p>
            <Link
              href="/events"
              className="font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Browse all events →
            </Link>
          </div>
        )}
      </div>

      <JoinEventModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </div>
  );
}
