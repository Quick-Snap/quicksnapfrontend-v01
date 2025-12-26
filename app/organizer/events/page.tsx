'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, MapPin, Users, Plus, Upload, MoreVertical, Sparkles } from 'lucide-react';
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
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 shadow-2xl shadow-indigo-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-200" />
                <span className="text-indigo-200 text-sm font-medium">Event Management</span>
              </div>
              <h1 className="text-3xl font-bold text-white">My Events</h1>
              <p className="text-indigo-100 mt-1">Manage your events and upload photos</p>
            </div>
            <Link href="/organizer/events/create">
              <button className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl font-semibold">
                <Plus size={18} />
                Create Event
              </button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 py-2.5"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${filterActive === 'all'
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${filterActive === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive('past')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${filterActive === 'past'
                  ? 'bg-white/10 text-gray-300 border-white/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-64 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
                <div className="h-24 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div key={event._id} className="card-hover flex flex-col h-full group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/5 text-gray-400 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 border border-white/5">
                    <Calendar size={12} className="text-violet-400" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'
                    }`}>
                    {event.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-violet-400 transition-colors">{event.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin size={14} className="mr-2 text-pink-400" />
                  {event.venue}
                </div>

                <p className="text-gray-400 text-sm line-clamp-2 flex-grow mb-6">
                  {event.description}
                </p>

                <div className="border-t border-white/10 pt-4 flex gap-2">
                  <Link href={`/organizer/events/${event._id}/upload`} className="flex-1">
                    <button className="btn-primary w-full text-sm py-2.5 flex justify-center items-center gap-2 rounded-xl">
                      <Upload size={16} /> Upload Photos
                    </button>
                  </Link>
                  <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
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
