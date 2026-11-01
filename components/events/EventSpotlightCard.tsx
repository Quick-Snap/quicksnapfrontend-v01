'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Users,
  Check,
  Search,
  X,
  Heart,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';

interface EventSpotlightCardProps {
  eventId: string;
  event: any;
  onUpdate?: () => void;
}

export default function EventSpotlightCard({ eventId, event, onUpdate }: EventSpotlightCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Couple');
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event?.spotlight) {
      setEnabled(Boolean(event.spotlight.enabled));
      setTitle(event.spotlight.title || 'Couple');
      setMatchMode(event.spotlight.matchMode || 'all');
      const ids = (event.spotlight.primaryUserIds || []).map((u: any) =>
        (u?._id || u?.id || u)?.toString()
      );
      setSelectedUserIds(ids);
    }
  }, [event]);

  const attendees: any[] = useMemo(() => {
    return Array.isArray(event?.attendees) ? event.attendees : [];
  }, [event?.attendees]);

  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return attendees.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    );
  }, [attendees, searchQuery]);

  const selectedAttendees = useMemo(() => {
    const map = new Map(attendees.map((a) => [(a._id || a.id)?.toString(), a]));
    return selectedUserIds.map((id) => map.get(id) || { _id: id, name: 'Attendee' });
  }, [attendees, selectedUserIds]);

  const toggleSelectAttendee = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      if (selectedUserIds.length >= 4) {
        toast.error('You can select up to 4 VIPs for the Spotlight album');
        return;
      }
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await eventApi.update(eventId, {
        spotlight: {
          enabled,
          title: title.trim() || 'Couple',
          primaryUserIds: selectedUserIds,
          matchMode
        }
      });
      toast.success('VIP Spotlight settings saved successfully! 🎉');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save spotlight settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)] p-5 sm:p-7 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                VIP / Couple Spotlight Album
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                Wedding & VIP
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
              Highlight Bride &amp; Groom, Couple, or Keynote VIP shots in a dedicated showcase tab.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
          <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">
            {enabled ? 'Showcase Active' : 'Enable Showcase'}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-white/20"
          />
        </label>
      </div>

      <div className="pt-5 space-y-6">
        {/* Title and Matching Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1.5">
              Gallery Tab Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Couple, Bride & Groom, VIP Keynotes"
              maxLength={30}
              className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-zinc-500 dark:text-gray-400 mt-1">
              Label displayed on the official gallery tab.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1.5">
              Matching Criteria
            </label>
            <select
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value as 'all' | 'any')}
              className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Joint Shots Only (All selected VIPs in same photo)</option>
              <option value="any">All VIP Moments (Any or all selected VIPs)</option>
            </select>
            <p className="text-[11px] text-zinc-500 dark:text-gray-400 mt-1">
              &quot;Joint Shots Only&quot; is recommended for Bride &amp; Groom wedding albums.
            </p>
          </div>
        </div>

        {/* Selected VIPs Chips */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-2">
            Selected VIPs ({selectedUserIds.length}/4)
          </label>
          {selectedAttendees.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-500 dark:text-gray-400">
              No VIPs selected yet. Select attendees below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedAttendees.map((attendee) => {
                const id = (attendee._id || attendee.id)?.toString();
                return (
                  <div
                    key={id}
                    className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold text-rose-900 dark:text-rose-200"
                  >
                    <div className="h-6 w-6 rounded-full overflow-hidden bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-[10px] font-bold text-rose-800 dark:text-rose-100">
                      {attendee.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attendee.avatar} alt={attendee.name} className="h-full w-full object-cover" />
                      ) : (
                        attendee.name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span>{attendee.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectAttendee(id)}
                      className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendee Picker */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">
              Choose from Event Attendees
            </span>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendee name..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {attendees.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">
              No registered attendees found in this event yet. Once the bride and groom join the event, you can select them here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {filteredAttendees.map((attendee) => {
                const id = (attendee._id || attendee.id)?.toString();
                const isSelected = selectedUserIds.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSelectAttendee(id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200 shadow-xs'
                        : 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                      {attendee.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attendee.avatar} alt={attendee.name} className="h-full w-full object-cover" />
                      ) : (
                        attendee.name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {attendee.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {attendee.faceRegistered ? '✓ Face Registered' : 'Guest'}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-gray-400">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span>Showcase tab will automatically update for all visitors.</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-rose-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Spotlight Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
