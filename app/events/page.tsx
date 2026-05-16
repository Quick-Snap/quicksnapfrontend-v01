'use client';

import { useQuery, useQueryClient } from 'react-query';
import { eventApi } from '@/lib/api';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Sparkles,
  Search,
  Share2,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { format, isSameDay, isThisWeek, isFuture } from 'date-fns';
import { useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';
import { buildEventShareText } from '@/lib/eventShareText';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';

type FilterType = 'all' | 'today' | 'week' | 'upcoming' | 'my';

export default function EventsPage() {
  const { user } = useAuth();
  const { isOrganizer, isAdmin, isPhotographer, isUser } = useRole();
  const router = useRouter();
  const queryClient = useQueryClient();
  const loadUser = useAuthStore((state) => state.loadUser);
  const { data, isLoading, refetch } = useQuery('events', () => eventApi.getAll({ isActive: true }));
  const [searchQuery, setSearchQuery] = useState('');
  // Photographers and guests only see their joined events
  const showOnlyJoinedEvents = isPhotographer || isUser;
  const [filterType, setFilterType] = useState<FilterType>(showOnlyJoinedEvents ? 'my' : 'all');
  const [joinCode, setJoinCode] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const events = data?.data?.events || [];

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      const response = await eventApi.joinByCode(joinCode.trim());
      if (response.success && response.data) {
        toast.success(`Successfully joined "${response.data.name}"!`);
        setIsJoinModalOpen(false);
        setJoinCode('');
        
        // Reload user data to get updated events list
        await loadUser({ force: true });
        
        // Invalidate all relevant queries for fresh data
        queryClient.invalidateQueries('userStats');
        queryClient.invalidateQueries('myPhotos');
        refetch();
        
        router.push(`/events/${response.data.eventId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event: any) => {
      // Search Filter
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Date Filter
      const eventDate = new Date(event.startDate);
      const today = new Date();

      switch (filterType) {
        case 'today':
          return isSameDay(eventDate, today);
        case 'week':
          return isThisWeek(eventDate);
        case 'upcoming':
          return isFuture(eventDate);
        case 'my':
          return user?.events?.includes(event._id) || false;
        case 'all':
        default:
          return true;
      }
    });
  }, [events, searchQuery, filterType, user?.events]);

  const handleShare = async (e: React.MouseEvent, event: any) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    const url = `${window.location.origin}/events/${event._id}`;
    const text = buildEventShareText({
      name: event.name,
      description: event.description,
      accessCode: event.accessCode,
      url,
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success(
        event.accessCode ? 'Link and join code copied to clipboard!' : 'Link copied to clipboard!'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-4">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-white/15 dark:border-t-violet-500" />
        <p className="mt-6 text-center text-sm font-medium text-zinc-500 dark:text-gray-400">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="relative pb-8 sm:pb-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-violet-400/15 blur-[100px] dark:bg-violet-500/10" />
        <div className="absolute bottom-0 left-0 h-[380px] w-[380px] rounded-full bg-indigo-400/12 blur-[100px] dark:bg-indigo-500/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 sm:space-y-10">
        {/* Hero + controls */}
        <header className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-violet-50/98 via-white to-indigo-50/90 p-6 shadow-[0_20px_60px_-28px_rgba(91,33,182,0.22)] ring-1 ring-violet-200/55 dark:from-[#1a1428] dark:via-[#120f1c] dark:to-[#0c1222] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.55)] dark:ring-white/[0.08] sm:rounded-3xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-[0.38] dark:opacity-50" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/12" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-indigo-400/18 blur-3xl dark:bg-indigo-500/10" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 text-sm shadow-sm ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.07] dark:ring-white/10">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                  <span className="font-medium text-zinc-700 dark:text-gray-200">
                    {showOnlyJoinedEvents ? 'Your events' : 'Discover'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-3xl md:text-4xl">
                    {showOnlyJoinedEvents ? 'Your events' : 'Browse events'}
                  </h1>
                  <span className="rounded-full bg-zinc-900/[0.06] px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-gray-200">
                    {events.length} live
                  </span>
                </div>
                <p className="max-w-xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-gray-400">
                  Search by name or venue, filter by date, and open any card — optimized for one-handed use on your phone.
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
                {!isPhotographer && !isOrganizer && !isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full justify-center rounded-2xl border-zinc-300 bg-white/90 py-3 text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Join by code
                  </Button>
                )}
                {(isOrganizer || isAdmin) && (
                  <Link href="/organizer/events/create" className="w-full sm:w-auto">
                    <Button className="w-full justify-center rounded-2xl py-3 shadow-lg shadow-violet-500/25 sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Create event
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
              <div className="relative min-h-[52px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search name, venue, keywords…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input h-[52px] w-full rounded-2xl border-zinc-200/90 bg-white/95 py-3 pl-12 pr-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
                  aria-label="Search events"
                />
              </div>

              {!showOnlyJoinedEvents && (
                <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  {[
                    ...(user ? [{ id: 'my', label: 'Mine' }] : []),
                    { id: 'all', label: 'All' },
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This week' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFilterType(filter.id as FilterType)}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                        filterType === filter.id
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 dark:bg-violet-600 dark:text-white'
                          : 'bg-white/90 text-zinc-600 ring-1 ring-zinc-200/90 hover:bg-zinc-50 dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Events grid */}
        <section className="relative z-10" aria-label="Event list">
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {filteredEvents.map((event: any) => (
                <Link key={event._id} href={`/events/${event._id}`} className="group block h-full">
                  <article
                    className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${softSurface} ${softSurfaceHover}`}
                  >
                    <div className="absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />

                    <div className="relative z-0 h-44 overflow-hidden sm:h-48">
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800">
                          <Calendar className="h-14 w-14 text-white/35 sm:h-16 sm:w-16" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded-2xl border border-white/25 bg-white/90 px-3 py-2 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/55">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-gray-400">
                          {format(new Date(event.startDate), 'MMM')}
                        </div>
                        <div className="text-xl font-bold leading-none text-zinc-900 dark:text-white">
                          {format(new Date(event.startDate), 'dd')}
                        </div>
                      </div>

                      <div className="absolute right-3 top-3 z-[2] md:opacity-0 md:transition-all md:translate-y-1 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleShare(e, event)}
                          className="rounded-full border border-white/40 bg-white/95 p-2.5 text-zinc-700 shadow-md backdrop-blur-sm transition hover:bg-violet-50 hover:text-violet-700 dark:border-white/15 dark:bg-black/55 dark:text-gray-200 dark:hover:bg-violet-500/25 dark:hover:text-white"
                          title="Share event"
                        >
                          <Share2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        {new Date(event.startDate) > new Date() ? (
                          <span className="rounded-full border border-emerald-200/90 bg-emerald-50/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm backdrop-blur-sm dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200">
                            Upcoming
                          </span>
                        ) : (
                          <span className="rounded-full border border-zinc-200/90 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/10 dark:text-gray-400">
                            Past
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                            {event.name}
                          </h2>
                          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-gray-400">
                            {event.attendees?.length ?? 0} in
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
                          {event.description || 'Tap to view details and photos.'}
                        </p>
                      </div>

                      <div className="mb-4 flex flex-1 flex-col gap-2.5 text-sm text-zinc-700 dark:text-gray-300">
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                          <span className="leading-snug">
                            {format(new Date(event.startDate), 'EEE, MMM d • h:mm a')} –{' '}
                            {format(new Date(event.endDate), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-600 dark:text-pink-400" />
                          <span className="truncate">{event.venue || 'Venue TBA'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300/95">
                          <Users className="h-4 w-4 shrink-0 opacity-80" />
                          <span className="truncate text-sm">{event.organizer?.name || 'Organizer'}</span>
                        </div>
                        {(user?.role === 'admin' ||
                          event.organizer?._id === user?.id ||
                          event.organizer === user?.id) &&
                          event.accessCode && (
                            <div className="flex items-center gap-2 rounded-xl border border-indigo-200/90 bg-indigo-50/95 px-3 py-2 text-xs font-medium text-indigo-950 dark:border-indigo-400/25 dark:bg-indigo-500/15 dark:text-indigo-100">
                              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-mono tracking-wider">{event.accessCode}</span>
                            </div>
                          )}
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-zinc-200/70 pt-4 dark:border-white/[0.08]">
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Open event</span>
                        <ChevronRight className="h-5 w-5 text-violet-600 transition-transform group-hover:translate-x-0.5 dark:text-violet-400" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
                <Search className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Nothing here yet</h3>
              <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
                {searchQuery
                  ? `No matches for “${searchQuery}”. Try another word or clear filters.`
                  : showOnlyJoinedEvents
                    ? 'Join an event with a code from your organizer, or ask them to invite you.'
                    : 'No events match this filter. Try All or Upcoming.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      if (!showOnlyJoinedEvents) setFilterType('all');
                    }}
                    className="rounded-2xl border-zinc-300 dark:border-white/15"
                  >
                    Clear search
                  </Button>
                )}
                {!isPhotographer && !isOrganizer && !isAdmin && (
                  <Button onClick={() => setIsJoinModalOpen(true)} className="rounded-2xl shadow-lg shadow-violet-500/20">
                    <Users className="mr-2 h-4 w-4" />
                    Join by code
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Join Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-md dark:bg-black/65">
          <div
            className="w-full max-w-md rounded-[1.65rem] border border-zinc-200/90 bg-white p-7 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.2)] ring-1 ring-zinc-900/[0.04] dark:border-white/10 dark:bg-[#14121f] dark:shadow-[0_24px_80px_rgba(0,0,0,0.65)] dark:ring-white/[0.06]"
            role="dialog"
            aria-labelledby="join-modal-title"
          >
            <h2 id="join-modal-title" className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
              Join with code
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
              Enter the access code your organizer shared — we&apos;ll take you to the event page.
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. SNAPP01"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="input rounded-2xl py-3.5 text-center text-lg font-semibold uppercase tracking-widest"
                autoFocus
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 rounded-2xl border-zinc-300 dark:border-white/20"
                  disabled={isJoining}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-2xl shadow-lg shadow-violet-500/25" disabled={isJoining || !joinCode.trim()}>
                  {isJoining ? 'Joining…' : 'Join'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
