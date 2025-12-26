'use client';

import { useQuery } from 'react-query';
import { eventApi, photoApi, userApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Image as ImageIcon,
  Users,
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [assignEmail, setAssignEmail] = useState('');
  const [assignEventId, setAssignEventId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { data: myEvents } = useQuery('myOrganizedEvents', () => eventApi.getMyOrganizedEvents());
  const { data: stats } = useQuery('organizerStats', () => userApi.getStats());

  const myOrganizedEvents = myEvents?.data || [];

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
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 shadow-2xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-indigo-200" />
              <span className="text-indigo-200 text-sm font-medium">Event Management</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Organizer Dashboard
            </h1>
            <p className="text-indigo-100">Manage your events and moderate photos</p>
          </div>
          <Link
            href="/organizer/events/create"
            className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/10 hover:border-white/20"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">My Events</p>
              <p className="text-3xl font-bold text-white">{myOrganizedEvents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-white">{upcomingEvents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Photos</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Attendees</p>
              <p className="text-3xl font-bold text-white">
                {myOrganizedEvents.reduce((sum: number, event: any) =>
                  sum + (event.attendees?.length || 0), 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
              <Users className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <div className="h-1 mt-4 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"></div>
        </div>
      </div>

      {/* My Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Events</h2>
          <Link
            href="/organizer/events/create"
            className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create New Event
          </Link>
        </div>

        {myOrganizedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myOrganizedEvents.map((event: any) => (
              <Link
                key={event._id}
                href={`/events/${event._id}/manage`}
                className="group bg-white/5 rounded-xl p-6 hover:bg-violet-500/10 transition-all border border-white/5 hover:border-violet-500/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-violet-400 transition-colors">{event.name}</h3>
                  {new Date(event.startDate) > new Date() ? (
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/20">
                      Upcoming
                    </span>
                  ) : (
                    <span className="bg-white/5 text-gray-400 text-xs px-3 py-1 rounded-full font-medium border border-white/10">
                      Past
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <span className="text-gray-400">{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-gray-400">{event.attendees?.length || 0} attendees</span>
                  </div>
                  {event.accessCode && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Access Code</p>
                      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono font-bold tracking-wider">
                        {event.accessCode}
                      </code>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">You haven't created any events yet</p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl font-semibold"
            >
              <Plus className="h-5 w-5" />
              Create Your First Event
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">Assign Photographer</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={assignEventId || ''}
              onChange={(e) => setAssignEventId(e.target.value)}
              className="input py-2 px-4 text-sm w-full md:w-48"
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
              className="input py-2 px-4 text-sm w-full md:w-60"
            />
            <button
              onClick={handleAssignPhotographer}
              disabled={!assignEmail || !assignEventId || assigning}
              className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/events/create" className="action-card group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Plus className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Create Event</p>
              <p className="text-sm text-gray-400">Start a new event</p>
            </div>
          </Link>

          <Link
            href="/organizer/events"
            className="action-card group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Upload className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Upload Photos</p>
              <p className="text-sm text-gray-400">Select an event to upload</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
