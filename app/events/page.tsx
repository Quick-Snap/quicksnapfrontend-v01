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
  Filter,
  Share2,
  Heart,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { format, isSameDay, isThisWeek, isFuture } from 'date-fns';
import { useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

type FilterType = 'all' | 'today' | 'week' | 'upcoming' | 'my';

const EVENT_LIST_CARD =
  'bg-white border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0f0c18] dark:border-white/5 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]';

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
        await loadUser();
        
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
  }, [events, searchQuery, filterType]);

  const handleShare = async (e: React.MouseEvent, event: any) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    const url = `${window.location.origin}/events/${event._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-gray-400 animate-pulse font-medium">Discovering events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-white/5 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] shadow-[0_18px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-35 dark:opacity-60" />
        <div className="absolute -left-20 top-0 w-72 h-72 bg-violet-400/15 dark:bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/15 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 dark:bg-white/5 px-4 py-1 border border-violet-200/90 dark:border-white/10">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-200" />
                  <span className="text-xs uppercase tracking-[0.25em] text-zinc-700 dark:text-gray-200">
                    {showOnlyJoinedEvents ? 'Your events' : 'Discover events'}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {showOnlyJoinedEvents ? 'Events you are in' : 'Experience every moment'}
                  </h1>
                  <span className="px-3 py-1 text-xs rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-gray-200">
                    {events.length} events
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-gray-300 max-w-2xl">
                  Curated list of campus happenings styled to match the landing page aesthetic. Search, filter, and join effortlessly.
                </p>
              </div>

              <div className="flex w-full md:w-auto gap-3">
                {!isPhotographer && !isOrganizer && !isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full md:w-auto border-zinc-300 text-zinc-900 bg-white hover:bg-zinc-50 dark:border-white/15 dark:text-white dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join by Code
                  </Button>
                )}
                {(isOrganizer || isAdmin) && (
                  <Link href="/organizer/events/create">
                    <Button className="w-full md:w-auto shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events, venues, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12 py-3 rounded-xl"
                />
              </div>

              {!showOnlyJoinedEvents && (
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  {[
                    ...(user ? [{ id: 'my', label: 'My Events' }] : []),
                    { id: 'all', label: 'All Events' },
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id as FilterType)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                        filterType === filter.id
                          ? 'bg-violet-600/12 text-violet-900 border-violet-300 shadow-md shadow-violet-500/10 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40 dark:shadow-lg dark:shadow-violet-500/15'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white dark:hover:border-white/20'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: any, index: number) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="group block"
              >
                <div
                  className={`${EVENT_LIST_CARD} rounded-2xl overflow-hidden border hover:border-violet-400/50 dark:hover:border-violet-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col hover:shadow-xl hover:shadow-violet-500/10`}
                >
                  {/* Image Section */}
                  <div className="h-48 relative overflow-hidden">
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white/30" />
                      </div>
                    )}

                    {/* Overlay Date Badge */}
                    <div className="absolute top-4 left-4 bg-white/92 dark:bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-zinc-200/90 dark:border-white/10 text-center min-w-[60px] shadow-sm">
                      <div className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase">
                        {format(new Date(event.startDate), 'MMM')}
                      </div>
                      <div className="text-xl font-bold text-zinc-900 dark:text-white leading-none">
                        {format(new Date(event.startDate), 'dd')}
                      </div>
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={(e) => handleShare(e, event)}
                        className="p-2.5 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full border border-zinc-200/80 dark:border-white/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:border-violet-400/40 dark:hover:border-violet-500/30 text-zinc-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-400 transition-all"
                        title="Share Event"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-4 left-4">
                      {new Date(event.startDate) > new Date() ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-500/20 dark:text-emerald-400 dark:backdrop-blur-md dark:border-emerald-500/20">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/80 dark:bg-white/10 dark:text-gray-400 dark:backdrop-blur-md dark:border-white/10">
                          Past
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col bg-zinc-50/50 dark:bg-transparent">
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors line-clamp-1">
                          {event.name}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-[11px] bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-gray-300">
                          {event.attendees?.length || 0} going
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {event.description || 'No description available for this event.'}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center text-sm text-zinc-700 dark:text-gray-300">
                        <Clock className="w-4 h-4 mr-3 text-violet-600 dark:text-violet-300 flex-shrink-0" />
                        <span>
                          {format(new Date(event.startDate), 'EEE, MMM d • h:mm a')} – {format(new Date(event.endDate), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-zinc-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 mr-3 text-pink-600 dark:text-pink-300 flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center text-sm text-emerald-700 dark:text-emerald-300">
                        <Users className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span>Managed by {event.organizer?.name || 'Organizer'}</span>
                      </div>
                      {(user?.role === 'admin' || event.organizer?._id === user?.id || event.organizer === user?.id) && event.accessCode && (
                        <div className="flex items-center text-sm font-medium text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200/90 dark:text-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-400/20">
                          <ShieldAlert className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-200 flex-shrink-0" />
                          <span>Code: <span className="font-mono tracking-wider">{event.accessCode}</span></span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-200/80 dark:border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center group/link">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 rounded-3xl border border-dashed border-zinc-300/90 bg-zinc-50/80 dark:bg-[#0f0c18] dark:border-white/10 shadow-lg shadow-zinc-900/5 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No events found</h3>
            <p className="text-zinc-600 dark:text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? `We couldn't find matches for "${searchQuery}". Try different keywords.`
                : showOnlyJoinedEvents
                  ? "You haven't joined any events yet. Use the code provided by an organizer to join."
                  : "There are no events scheduled for this period."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); if (!showOnlyJoinedEvents) setFilterType('all'); }}
                className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Join Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200/90 dark:bg-[#0f0c18] dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Join Private Event</h2>
            <p className="text-zinc-600 dark:text-gray-400 mb-6">Enter the access code shared with you by the organizer.</p>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <input
                type="text"
                placeholder="Access Code (e.g. SNAPP01)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="input text-center text-lg font-semibold tracking-widest uppercase"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  disabled={isJoining}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                  disabled={isJoining || !joinCode.trim()}
                >
                  {isJoining ? 'Joining...' : 'Join Event'}
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
