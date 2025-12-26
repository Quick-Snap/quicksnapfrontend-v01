'use client';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Calendar, Users, MapPin, Edit, Trash2, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function EventManager() {
  const { user } = useAuth();
  const { isOrganizer, isAdmin } = useRole();
  const queryClient = useQueryClient();

  const { data: eventsData } = useQuery('myEvents', () => eventApi.getAll({}));

  const deleteMutation = useMutation(
    (eventId: string) => eventApi.delete(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myEvents');
        toast.success('Event deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete event');
      },
    }
  );

  const myEvents = eventsData?.data?.events?.filter(
    (event: any) => event.organizer?._id === user?.id || event.organizer === user?.id
  ) || [];

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(eventId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Events</h2>
        {(isOrganizer || isAdmin) && (
          <Link
            href="/events/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        )}
      </div>

      {myEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You haven't created any events yet</p>
          {(isOrganizer || isAdmin) && (
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myEvents.map((event: any) => (
            <div
              key={event._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold line-clamp-2">{event.name}</h3>
                {new Date(event.startDate) > new Date() ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Upcoming
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Past
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.startDate), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {event.attendees?.length || 0} attendees
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Link
                  href={`/events/${event._id}/manage`}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Manage
                </Link>
                <Link
                  href={`/events/${event._id}/edit`}
                  className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(event._id)}
                  disabled={deleteMutation.isLoading}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

