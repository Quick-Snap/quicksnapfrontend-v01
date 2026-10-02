'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Globe, Lock, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onEventUpdated: (updatedEvent: any) => void;
}

function toDatetimeLocal(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
}: EditEventModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setName(event.name || '');
      setDescription(event.description || '');
      setStartDate(toDatetimeLocal(event.startDate));
      setEndDate(toDatetimeLocal(event.endDate));
      setVenue(event.venue || event.location || '');
      setIsPublic(event.isPublic !== false);
      setError(null);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedVenue = venue.trim();

    if (!trimmedName) {
      setError('Event title is required');
      return;
    }

    if (!startDate || !endDate) {
      setError('Both start and end date/time are required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please provide valid start and end dates');
      return;
    }

    if (end < start) {
      setError('End date and time cannot be earlier than start date and time');
      return;
    }

    if (!trimmedVenue) {
      setError('Venue / Location is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        venue: trimmedVenue,
        location: trimmedVenue,
        isPublic,
      };

      const res = await eventApi.update(event._id, payload);
      if (res.success && res.data) {
        toast.success('Event details updated successfully!');
        onEventUpdated(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update event');
      }
    } catch (err: any) {
      console.error('Update event error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update event details';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f0c18] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/10">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Event Details</h3>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
              Update title, schedule, venue, and visibility settings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Tech Symposium 2026"
              required
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of the event..."
              rows={3}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-violet-600 dark:text-violet-400" />
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-violet-600 dark:text-violet-400" />
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-pink-600 dark:text-pink-400" />
              Venue / Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Grand Ballroom, Hilton Hotel or Virtual"
              required
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
            />
          </div>

          {/* Visibility Options */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-2">
              Event Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  isPublic
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-500/50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isPublic ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-gray-300'
                }`}>
                  <Globe size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Public Event</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-gray-400">
                    Anyone can join with 1 click without entering a code.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  !isPublic
                    ? 'border-amber-500 bg-amber-50/80 shadow-sm ring-1 ring-amber-500/50 dark:border-amber-500/60 dark:bg-amber-500/10'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  !isPublic ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-gray-300'
                }`}>
                  <Lock size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Private Event</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-gray-400">
                    Guests must enter the access code to join and unlock photos.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
