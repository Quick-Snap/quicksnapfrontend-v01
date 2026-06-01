'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, Users, Plus, Upload, Sparkles, Eye, Trash2 } from 'lucide-react';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';
import { eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'past' | 'trash'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = filterActive === 'trash' ? '/events/managed/all?trash=true' : '/events/managed/all';
      const res = await api.get(url);
      setEvents(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, filterActive]);

  const handleRestore = async (eventId: string) => {
    if (actionInProgress) return;
    setActionInProgress(eventId);
    try {
      await eventApi.restore(eventId);
      toast.success('Event successfully restored!');
      fetchEvents();
    } catch (err: any) {
      console.error('Restore event failed:', err);
      toast.error(err.response?.data?.message || 'Failed to restore event');
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePermanentDelete = async (eventId: string) => {
    if (actionInProgress) return;
    if (!confirm('Are you sure you want to permanently delete this event? This will instantly and irreversibly clear S3 physical files, Rekognition face collection indexes, and all metadata!')) {
      return;
    }
    setActionInProgress(eventId);
    try {
      await eventApi.delete(eventId, { hard: true });
      toast.success('Event permanently deleted and storage purged!');
      fetchEvents();
    } catch (err: any) {
      console.error('Permanent delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to permanently delete event');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterActive === 'all' || filterActive === 'trash') return matchesSearch;

    const isActive = event.isActive && new Date(event.endDate) > new Date();
    if (filterActive === 'active') return matchesSearch && isActive;
    return matchesSearch && !isActive;
  });

  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-gradient-mesh opacity-25 dark:opacity-60" />
          <div className="absolute -bottom-10 -left-14 h-60 w-60 bg-violet-400/25 blur-3xl dark:bg-violet-500/20" />
          <div className="absolute right-0 top-0 h-64 w-64 bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
          <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-200" />
                <span className="text-xs uppercase tracking-[0.25em] text-violet-800/90 dark:text-gray-200">Organizer</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white md:text-4xl">
                  {filterActive === 'trash' ? 'Event Trash Bin' : 'My Events'}
                </h1>
                <span className="rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                  {events.length} total
                </span>
              </div>
              <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
                {filterActive === 'trash' 
                  ? 'Soft-deleted events are safely stored here for 7 days before permanent cascading cleanup occurs.' 
                  : 'Manage, search, and upload to your events with the same calm theme as the landing page.'}
              </p>
            </div>
            {filterActive !== 'trash' && (
              <Link href="/organizer/events/create">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-600 bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] dark:hover:bg-white/10"
                >
                  <Plus size={18} />
                  Create Event
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card flex flex-col items-center justify-between gap-4 border-zinc-200/90 shadow-lg shadow-zinc-900/5 md:flex-row dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
          <div className="relative w-full md:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search size={18} className="text-zinc-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full rounded-xl py-3 pl-12 pr-4 text-sm"
            />
          </div>

          <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto md:w-auto">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'active', label: 'Active' },
              { id: 'past', label: 'Past' },
              { id: 'trash', label: 'Trash Bin 🗑️' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterActive(f.id as 'all' | 'active' | 'past' | 'trash')}
                className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  filterActive === f.id
                    ? f.id === 'active'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200 dark:shadow-lg dark:shadow-emerald-500/10'
                      : f.id === 'trash'
                        ? 'border-red-300 bg-red-50 text-red-900 shadow-sm dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200 dark:shadow-lg dark:shadow-red-500/10'
                        : 'border-violet-300 bg-violet-50 text-violet-900 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200 dark:shadow-lg dark:shadow-violet-500/10'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card h-64 animate-pulse border-zinc-200/90 dark:border-white/5 dark:bg-[#0f0c18]"
              >
                <div className="mb-4 h-4 w-3/4 rounded bg-zinc-200 dark:bg-white/10" />
                <div className="mb-8 h-4 w-1/2 rounded bg-zinc-200 dark:bg-white/10" />
                <div className="h-24 rounded bg-zinc-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-md dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)] dark:hover:border-violet-500/30"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    <Calendar size={12} className="text-violet-600 dark:text-violet-300" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  {filterActive === 'trash' ? (
                    (() => {
                      const deletedTime = event.deletedAt ? new Date(event.deletedAt).getTime() : Date.now();
                      const expiryTime = deletedTime + 7 * 24 * 60 * 60 * 1000;
                      const daysLeft = Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));
                      return (
                        <span className="rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200 animate-pulse">
                          Expires in {daysLeft}d
                        </span>
                      );
                    })()
                  ) : (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        event.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-300'
                      }`}
                    >
                      {event.isActive ? 'Active' : 'Archived'}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                  {event.name}
                </h3>
                <div className="mb-3 flex items-center text-sm text-zinc-600 dark:text-gray-400">
                  <MapPin size={14} className="mr-2 text-pink-600 dark:text-pink-300" />
                  <span className="truncate">{event.venue || 'TBA'}</span>
                </div>

                <p className="mb-4 flex-grow line-clamp-3 text-sm text-zinc-600 dark:text-gray-400">
                  {event.description || 'No description provided.'}
                </p>

                <div className="mb-4 flex items-center gap-3 text-xs text-zinc-500 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-emerald-600 dark:text-emerald-300" />
                    <span>{event.attendees?.length || 0} attending</span>
                  </div>
                </div>

                {filterActive === 'trash' ? (
                  <div className="flex gap-2 border-t border-zinc-200/90 pt-4 dark:border-white/10 mt-auto">
                    <button
                      type="button"
                      disabled={actionInProgress !== null}
                      onClick={() => handleRestore(event._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 text-xs"
                    >
                      <Sparkles size={16} /> Restore
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress !== null}
                      onClick={() => handlePermanentDelete(event._id)}
                      className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-50"
                      title="Delete Permanently"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 border-t border-zinc-200/90 pt-4 dark:border-white/10">
                    <Link href={`/organizer/events/${event._id}/upload`} className="flex-1">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500"
                      >
                        <Upload size={16} /> Upload Photos
                      </button>
                    </Link>
                    <Link
                      href={`/events/${event._id}/manage`}
                      className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card border-zinc-200/90 py-16 text-center shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/10">
              {filterActive === 'trash' ? (
                <Trash2 size={32} className="text-red-500 dark:text-red-400" />
              ) : (
                <Calendar size={32} className="text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
              {filterActive === 'trash' ? 'Trash Bin is empty' : 'No events found'}
            </h3>
            <p className="mb-6 text-zinc-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search filters' 
                : filterActive === 'trash'
                  ? 'No soft-deleted events are currently stored.'
                  : 'Create an event to get started'}
            </p>
            {!searchTerm && filterActive !== 'trash' && (
              <Link href="/organizer/events/create">
                <button type="button" className="btn-gradient rounded-xl px-6 py-3 font-semibold">
                  Create Event
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
