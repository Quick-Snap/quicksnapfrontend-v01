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

const heroLight =
  'border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)]';
const heroDark =
  'dark:border-white/5 dark:bg-gradient-to-br dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]';

const statShell =
  'border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-white shadow-sm shadow-zinc-900/5 dark:border-white/10 dark:from-[#121022] dark:via-[#0d0c19] dark:to-[#0b0a14] dark:shadow-none';

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
    <div className="space-y-8">
      {/* Header */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-8 ${heroLight} ${heroDark}`}
      >
        <div className="absolute inset-0 bg-gradient-mesh opacity-25 dark:opacity-60" />
        <div className="absolute -bottom-10 -left-14 h-60 w-60 bg-violet-400/25 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute right-0 top-0 h-64 w-64 bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-4 py-1 dark:border-white/10 dark:bg-white/5">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-200" />
              <span className="text-xs uppercase tracking-[0.25em] text-violet-800/90 dark:text-gray-200">
                Organizer control
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
                <Calendar className="h-7 w-7 text-violet-600 dark:text-violet-300" />
                Organizer Dashboard
              </h1>
              <span className="rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                {myOrganizedEvents.length} events
              </span>
            </div>
            <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
              Calm, focused workspace for managing events, assigning photographers, and monitoring uploads.
            </p>
          </div>

          <Link
            href="/organizer/events/create"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-600 bg-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] dark:hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`stat-card group ${statShell}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">My Events</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{myOrganizedEvents.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Calendar className="h-6 w-6 text-violet-700 dark:text-violet-300" />
            </div>
          </div>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>

        <div className={`stat-card group ${statShell}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Upcoming</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{upcomingEvents.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>

        <div className={`stat-card group ${statShell}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Pending Photos</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
              <AlertCircle className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            </div>
          </div>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
        </div>

        <div className={`stat-card group ${statShell}`}>
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
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>
      </div>

      {/* My Events */}
      <div className="card border-zinc-200/80 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-gray-400">Your organized events</p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">My Events</h2>
          </div>
          <Link
            href="/organizer/events/create"
            className="flex items-center gap-2 font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <Plus className="h-4 w-4" />
            Create New Event
          </Link>
        </div>

        {myOrganizedEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myOrganizedEvents.map((event: any) => (
              <Link
                key={event._id}
                href={`/events/${event._id}/manage`}
                className="group rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-md dark:border-white/5 dark:bg-[#14101f] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-violet-500/30"
              >
                <div className="mb-3 flex items-start justify-between">
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
          <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 py-12 text-center dark:border-white/5 dark:bg-[#14101f]">
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
      </div>

      {/* Quick Actions */}
      <div className="card border-zinc-200/80 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
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
      </div>
    </div>
  );
}
