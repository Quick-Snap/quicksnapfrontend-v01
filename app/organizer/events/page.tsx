'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, MapPin, Users, Plus, Upload, MoreVertical, Sparkles, Eye } from 'lucide-react';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch only events organized by this user
        const res = await api.get('/events/managed/all');
        setEvents(res.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterActive === 'all') return matchesSearch;

    const isActive = event.isActive && new Date(event.endDate) > new Date();
    if (filterActive === 'active') return matchesSearch && isActive;
    return matchesSearch && !isActive;
  });

  return (
    <RoleGuard allowedRoles={['organizer', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-8 border border-white/5 bg-gradient-to-br from-[#181025] via-[#0f0b1d] to-[#0a0d1e] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
          <div className="absolute -left-14 -bottom-10 w-60 h-60 bg-violet-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/15 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-full text-sm">
                <Sparkles className="h-4 w-4 text-violet-200" />
                <span className="text-xs uppercase tracking-[0.25em] text-gray-200">Organizer</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-semibold text-white">My Events</h1>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-200">{events.length} total</span>
              </div>
              <p className="text-gray-300 max-w-2xl">Manage, search, and upload to your events with the same calm theme as the landing page.</p>
            </div>
            <Link href="/organizer/events/create">
              <button className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_10px_35px_rgba(0,0,0,0.3)]">
                <Plus size={18} />
                Create Event
              </button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Events', active: 'violet' },
              { id: 'active', label: 'Active', active: 'emerald' },
              { id: 'past', label: 'Past', active: 'slate' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterActive(f.id as 'all' | 'active' | 'past')}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                  filterActive === f.id
                    ? f.id === 'active'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-violet-500/20 text-violet-200 border-violet-500/40 shadow-lg shadow-violet-500/10'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-64 animate-pulse bg-[#0f0c18] border-white/5">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
                <div className="h-24 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div key={event._id} className="group bg-[#0f0c18] border border-white/5 rounded-2xl p-6 hover:-translate-y-1 transition-all shadow-[0_14px_50px_rgba(0,0,0,0.35)] hover:border-violet-500/30 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/5 text-gray-300 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 border border-white/10">
                    <Calendar size={12} className="text-violet-300" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${event.isActive ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' : 'bg-white/5 text-gray-300 border-white/15'}`}>
                    {event.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>

                <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-violet-300 transition-colors">{event.name}</h3>
                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <MapPin size={14} className="mr-2 text-pink-300" />
                  <span className="truncate">{event.venue || 'TBA'}</span>
                </div>

                <p className="text-gray-400 text-sm line-clamp-3 flex-grow mb-4">
                  {event.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-emerald-300" />
                    <span>{event.attendees?.length || 0} attending</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 flex gap-2">
                  <Link href={`/organizer/events/${event._id}/upload`} className="flex-1">
                    <button className="w-full text-sm py-2.5 flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-violet-500/20">
                      <Upload size={16} /> Upload Photos
                    </button>
                  </Link>
                  <Link href={`/events/${event._id}/manage`} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-200 transition-colors">
                    <Eye size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={32} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search filters' : 'Create an event to get started'}
            </p>
            {!searchTerm && (
              <Link href="/organizer/events/create">
                <button className="btn-gradient px-6 py-3 rounded-xl font-semibold">Create Event</button>
              </Link>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
