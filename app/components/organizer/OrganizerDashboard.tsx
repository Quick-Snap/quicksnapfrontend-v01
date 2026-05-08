'use client';

import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Users,
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';

export default function OrganizerDashboard() {
  const [assignEmail, setAssignEmail] = useState('');
  const [assignEventId, setAssignEventId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { data: myEvents } = useQuery('myOrganizedEvents', () => eventApi.getMyOrganizedEvents());
  const myOrganizedEvents = useMemo(() => myEvents?.data ?? [], [myEvents?.data]);

  const upcomingEvents = myOrganizedEvents.filter(
    (event: any) => new Date(event.startDate) > new Date()
  );

  useEffect(() => {
    if (!assignEventId && myOrganizedEvents.length > 0) {
      setAssignEventId(myOrganizedEvents[0]._id);
    }
  }, [assignEventId, myOrganizedEvents]);

  const handleAssignPhotographer = async () => {
    if (!assignEmail || !assignEventId) return;
    setAssigning(true);
    try {
      await eventApi.assignPhotographer(assignEventId, assignEmail);
      toast.success('Photographer role assigned');
      setAssignEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign photographer');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-violet-50/98 via-white to-indigo-50/90 p-6 shadow-[0_20px_60px_-28px_rgba(91,33,182,0.28)] ring-1 ring-violet-200/60 dark:from-[#1a1428] dark:via-[#120f1c] dark:to-[#0c1222] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.65)] dark:ring-white/[0.08] sm:rounded-3xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-[0.35] dark:opacity-50" />
        <div className="pointer-events-none absolute -bottom-12 -left-14 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15" />
        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/12" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-sm ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.07] dark:ring-white/10">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-800 dark:text-gray-200">
                Organizer
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="flex items-center gap-2 text-[1.65rem] font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl md:text-4xl">
                <Calendar className="h-7 w-7 shrink-0 text-violet-600 dark:text-violet-300" />
                Dashboard
              </h1>
              <span className="rounded-full bg-zinc-900/[0.06] px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-gray-200">
                {myOrganizedEvents.length} events
              </span>
            </div>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-gray-400">
              Create events, assign photographers, and keep uploads flowing — optimized for desktop and phone.
            </p>
          </div>

          <Link
            href="/organizer/events/create"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create event
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">My Events</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{myOrganizedEvents.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Calendar className="h-6 w-6 text-violet-700 dark:text-violet-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Upcoming</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{upcomingEvents.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Pending Photos</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
              <AlertCircle className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Total Attendees</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {myOrganizedEvents.reduce((sum: number, event: any) => sum + (event.attendees?.length || 0), 0)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-200/80 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
              <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
          <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>
      </div>

      {/* My Events */}
      <section className={`p-5 sm:p-8 ${softSurface}`}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-gray-500">Your events</p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">All organized events</h2>
          </div>
          <Link
            href="/organizer/events/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-500 sm:justify-start"
          >
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </div>

        {myOrganizedEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myOrganizedEvents.map((event: any) => (
              <Link
                key={event._id}
                href={`/events/${event._id}/manage`}
                className={`group relative overflow-hidden p-6 ${softSurface} ${softSurfaceHover}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 opacity-90" />
                <div className="mb-3 flex items-start justify-between pt-1">
                  <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-400">
                    {event.name}
                  </h3>
                  {new Date(event.startDate) > new Date() ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                      Upcoming
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                      Past
                    </span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-gray-400">{event.description}</p>
                <div className="space-y-2 text-sm text-zinc-500 dark:text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-zinc-600 dark:text-gray-400">{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-zinc-600 dark:text-gray-400">{event.attendees?.length || 0} attendees</span>
                  </div>
                  {event.accessCode && (
                    <div className="mt-4 border-t border-zinc-200/90 pt-4 dark:border-white/10">
                      <p className="mb-1 text-[10px] font-bold uppercase text-zinc-500 dark:text-gray-400">Access Code</p>
                      <code className="rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-sm font-semibold tracking-wider text-violet-800 dark:border-white/10 dark:bg-white/5 dark:text-violet-200">
                        {event.accessCode}
                      </code>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50/90 py-12 text-center ring-1 ring-zinc-900/[0.05] dark:bg-white/[0.04] dark:ring-white/10">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-gray-600" />
            <p className="mb-4 text-zinc-600 dark:text-gray-300">You haven&apos;t created any events yet</p>
            <Link
              href="/organizer/events/create"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Your First Event
            </Link>
          </div>
        )}
      </section>

      {/* Assign + quick links */}
      <section className={`p-5 sm:p-8 ${softSurface}`}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-gray-400">Send upload permissions</p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Assign Photographer</h2>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={assignEventId || ''}
              onChange={(e) => setAssignEventId(e.target.value)}
              className="input w-full py-2 pl-4 pr-4 text-sm md:w-48"
            >
              <option value="">Select event</option>
              {myOrganizedEvents.map((event: any) => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))}
            </select>
            <input
              type="email"
              placeholder="Photographer email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="input w-full py-2 px-4 text-sm md:w-60"
            />
            <button
              type="button"
              onClick={handleAssignPhotographer}
              disabled={!assignEmail || !assignEventId || assigning}
              className="btn-primary rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>

        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/organizer/events/create"
            className="action-card group border-zinc-200/90 bg-white hover:border-violet-300/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Plus className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Create Event</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Start a new event</p>
            </div>
          </Link>

          <Link
            href="/organizer/events"
            className="action-card group border-zinc-200/90 bg-white hover:border-emerald-300/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
              <Upload className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Upload Photos</p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">Select an event to upload</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
