'use client';

import { useQuery } from 'react-query';
import { userApi, eventApi, photoApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Image as ImageIcon, Calendar, Upload, Plus, Sparkles, ShieldCheck, ChevronRight, Award, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import JoinEventModal from './JoinEventModal';
import FloatingSpottedHub from './FloatingSpottedHub';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';

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

  const { data: coOccurringRes } = useQuery(
    ['coOccurringPhotos', user?.id],
    () => photoApi.getCoOccurring(),
    { enabled: !!user }
  );

  const registeredFriendsSummary = coOccurringRes?.data?.registeredFriendsSummary || [];
  const unregisteredSummary = coOccurringRes?.data?.unregisteredSummary || [];
  const referralCount = coOccurringRes?.data?.referralStats?.referralCount || 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero — airy, no heavy border */}
      <header className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-violet-50/98 via-white to-indigo-50/90 p-6 shadow-[0_20px_60px_-28px_rgba(91,33,182,0.28)] ring-1 ring-violet-200/60 dark:from-[#1a1428] dark:via-[#120f1c] dark:to-[#0c1222] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.65)] dark:ring-white/[0.08] sm:rounded-3xl sm:p-9 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-[0.35] dark:opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm shadow-sm ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.07] dark:ring-white/10">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
            <span className="text-zinc-700 dark:text-gray-200">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-white sm:text-3xl md:text-4xl">
              Your photos & events
            </h1>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-gray-400">
              Join events, register your face once, and find your shots faster — tuned for quick taps on mobile.
            </p>
          </div>
        </div>
      </header>

      {/* Floating Spotted Hub */}
      <FloatingSpottedHub
        unregisteredSummary={unregisteredSummary}
        registeredFriendsSummary={registeredFriendsSummary}
        referralCount={referralCount}
        userId={user?.id}
      />

      {/* Stats — mobile-first single column; comfortable tap targets */}
      <section aria-label="Overview stats" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Link
          href="/photos"
          className={`group block p-5 ${softSurface} ${softSurfaceHover} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/50`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-gray-500">My photos</p>
              <p className="mt-1.5 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-white">{stats?.data?.photos || 0}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
              <ImageIcon className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 opacity-90" />
        </Link>

        <Link
          href="/events"
          className={`group block p-5 ${softSurface} ${softSurfaceHover} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/50`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-gray-500">Events joined</p>
              <p className="mt-1.5 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-white">
                {stats?.data?.events || myEvents.length || 0}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/15">
              <Calendar className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 opacity-90" />
        </Link>

        {isFaceReady ? (
          <div className={`relative overflow-hidden p-5 ${softSurface}`}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl dark:bg-emerald-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-gray-500">Face ID</p>
                <p className="mt-1.5 text-3xl font-semibold text-zinc-900 dark:text-white">Ready</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-500">Recognition on</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/15">
                <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
            <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90" />
          </div>
        ) : (
          <Link
            href="/register-face"
            className={`relative block overflow-hidden p-5 ${softSurface} ${softSurfaceHover} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl dark:bg-amber-500/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-gray-500">Face ID</p>
                <p className="mt-1.5 text-3xl font-semibold text-zinc-900 dark:text-white">Set up</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-500">Tap to register — ~1 min</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
                <ShieldCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 opacity-90" />
          </Link>
        )}
      </section>

      {/* Quick actions — list rows on mobile, less “card in a card” */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 px-0.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-gray-500">Shortcuts</p>
            <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">Quick actions</h2>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left ${softSurface} ${softSurfaceHover}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
              <Plus className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-white">Join event by code</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Enter the code from your organizer</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 dark:text-gray-600" />
          </button>

          <Link
            href="/photos"
            className={`flex items-center gap-4 rounded-2xl p-4 ${softSurface} ${softSurfaceHover}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/15">
              <ImageIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-white">My photos</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Browse everything we matched to you</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 dark:text-gray-600" />
          </Link>

          {!stats?.data?.faceRegistered && (
            <Link
              href="/register-face"
              className={`flex items-center gap-4 rounded-2xl p-4 ${softSurface} ${softSurfaceHover}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-500/15">
                <Upload className="h-5 w-5 text-fuchsia-700 dark:text-fuchsia-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 dark:text-white">Register face</p>
                <p className="text-sm text-zinc-500 dark:text-gray-400">One quick selfie for smarter matching</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 dark:text-gray-600" />
            </Link>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 px-0.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-gray-500">Your schedule</p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">My events</h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {myEvents.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myEvents.map((event: any) => (
              <li key={event._id}>
                <Link
                  href={`/events/${event._id}`}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl p-5 ${softSurface} ${softSurfaceHover}`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 opacity-95" />
                  <h3 className="mt-1 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                    {event.name}
                  </h3>
                  {event.description ? (
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-gray-400">{event.description}</p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-500">
                    <Calendar className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                    <time dateTime={event.startDate}>{new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={`rounded-[1.65rem] px-6 py-14 text-center ${softSurface}`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
              <Calendar className="h-7 w-7 text-zinc-400 dark:text-gray-500" />
            </div>
            <p className="mb-1 font-medium text-zinc-800 dark:text-gray-200">No events yet</p>
            <p className="mb-6 text-sm text-zinc-500 dark:text-gray-400">Join one with a code or browse what&apos;s live.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500"
              >
                Join with code
              </button>
              <Link
                href="/events"
                className="rounded-xl border border-zinc-200/90 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Browse events
              </Link>
            </div>
          </div>
        )}
      </section>

      <JoinEventModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </div>
  );
}
