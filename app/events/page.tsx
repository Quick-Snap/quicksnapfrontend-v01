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
          <p className="text-gray-400 animate-pulse font-medium">Discovering events...</p>
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
      <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                {showOnlyJoinedEvents ? 'My Events' : 'Discover Events'}
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                {isPhotographer
                  ? 'Events you are assigned to photograph'
                  : isUser
                    ? 'Events you have joined'
                    : 'Find and join amazing campus activities'}
              </p>
            </div>

            <div className="flex w-full md:w-auto gap-3">
              {/* Join by Code only for guests - not for photographers or organizers */}
              {!isPhotographer && !isOrganizer && !isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full md:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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

          {/* Search and Filter Bar */}
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events, venues, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-white placeholder-gray-500"
              />
            </div>
            {/* Hide filter buttons for photographers and guests - they only see joined events */}
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
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${filterType === filter.id
                      ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-lg shadow-violet-500/10'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
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
                <div className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-violet-500/30 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col hover:shadow-xl hover:shadow-violet-500/10">
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
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 text-center min-w-[60px]">
                      <div className="text-xs font-semibold text-gray-400 uppercase">
                        {format(new Date(event.startDate), 'MMM')}
                      </div>
                      <div className="text-xl font-bold text-white leading-none">
                        {format(new Date(event.startDate), 'dd')}
                      </div>
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={(e) => handleShare(e, event)}
                        className="p-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-violet-500/20 hover:border-violet-500/30 text-gray-300 hover:text-violet-400 transition-all"
                        title="Share Event"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-4 left-4">
                      {new Date(event.startDate) > new Date() ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 backdrop-blur-md border border-emerald-500/20">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-gray-400 backdrop-blur-md border border-white/10">
                          Past
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
                        {event.name}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                        {event.description || 'No description available for this event.'}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-3 text-violet-400 flex-shrink-0" />
                        <span>
                          {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <MapPin className="w-4 h-4 mr-3 text-pink-400 flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-3 text-emerald-400 flex-shrink-0" />
                        <span>{event.attendees?.length || 0} attending</span>
                      </div>
                      {(user?.role === 'admin' || event.organizer?._id === user?.id || event.organizer === user?.id) && event.accessCode && (
                        <div className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                          <ShieldAlert className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
                          <span>Code: <span className="font-mono tracking-wider">{event.accessCode}</span></span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-violet-400 flex items-center group/link">
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
          <div className="text-center py-24 bg-[#111111] rounded-3xl border border-dashed border-white/10">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
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
                className="border-white/10 text-gray-300 hover:bg-white/5"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Join Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-2">Join Private Event</h2>
            <p className="text-gray-500 mb-6">Enter the access code shared with you by the organizer.</p>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <input
                type="text"
                placeholder="Access Code (e.g. SNAPP01)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition-all text-center text-lg font-bold tracking-widest uppercase text-gray-900 bg-white placeholder-gray-400"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1"
                  disabled={isJoining}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
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
