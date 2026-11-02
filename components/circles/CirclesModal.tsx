'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Plus,
  Share2,
  Check,
  Clock,
  Sparkles,
  Trash2,
  LogOut,
  ArrowRight,
  Loader2,
  Shield,
  Copy,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { circleApi, EventCircleItem } from '@/lib/api';

interface CirclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  currentUserId: string;
  onSelectCircle: (circle: EventCircleItem) => void;
}

export default function CirclesModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  currentUserId,
  onSelectCircle
}: CirclesModalProps) {
  const [circles, setCircles] = useState<EventCircleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await circleApi.getEventCircles(eventId);
      if (res.success && res.data) {
        setCircles(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch circles:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchCircles();
      setIsCreating(false);
      setNewCircleName('');
    }
  }, [isOpen, fetchCircles]);

  if (!isOpen) return null;

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    try {
      setSubmitting(true);
      const res = await circleApi.createCircle(eventId, newCircleName.trim());
      if (res.success && res.data) {
        toast.success(`Circle "${res.data.name}" created!`);
        setNewCircleName('');
        setIsCreating(false);
        await fetchCircles();
        // Immediately trigger share prompt for the new circle
        handleShareInvite(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create circle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInvite = async (circle: EventCircleItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.roopixo.com';
    const inviteUrl = `${origin}/events/${eventId}?circleInvite=${circle.inviteCode}`;
    const shareText = `Hey! Join my circle "${circle.name}" at ${eventName} on Roopixo to see all the photos of us together! 📸✨\n\n${inviteUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Join "${circle.name}" on Roopixo`,
          text: shareText,
        });
        return;
      } catch (err: any) {
        // User aborted share sheet or unsupported, fall back to clipboard
        if (err.name !== 'AbortError') {
          console.log('Share API fallback to clipboard');
        }
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedCode(circle.inviteCode);
      toast.success('Invite link copied! Share it on WhatsApp, Instagram, or Messages 🚀');
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  const handleLeaveCircle = async (circle: EventCircleItem) => {
    if (!confirm(`Are you sure you want to leave "${circle.name}"? You will no longer see mutual photos for this circle.`)) {
      return;
    }

    try {
      setActionInProgressId(circle._id);
      const res = await circleApi.leaveCircle(eventId, circle._id);
      if (res.success) {
        toast.success(`Left "${circle.name}"`);
        await fetchCircles();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to leave circle');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteCircle = async (circle: EventCircleItem) => {
    if (!confirm(`Delete circle "${circle.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionInProgressId(circle._id);
      const res = await circleApi.deleteCircle(eventId, circle._id);
      if (res.success) {
        toast.success(`Deleted circle "${circle.name}"`);
        await fetchCircles();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete circle');
    } finally {
      setActionInProgressId(null);
    }
  };

  const maxCirclesReached = circles.length >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Roopixo Circles
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                  New
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-gray-400">
                Mutual-consent group photo matching ({circles.length}/5 Circles)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Privacy Guarantee Pill */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/30 text-xs text-violet-900 dark:text-violet-200">
            <Shield className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" />
            <div>
              <p className="font-semibold text-violet-950 dark:text-violet-100">Zero-Stalking Privacy Guarantee</p>
              <p className="mt-0.5 leading-relaxed text-violet-800/90 dark:text-violet-300/80">
                You will only ever see photos where <strong>you and your squad members appear together</strong>. Circles never unlock individual solo photos.
              </p>
            </div>
          </div>

          {/* Create Circle Form or Button */}
          {isCreating ? (
            <form onSubmit={handleCreateCircle} className="p-4 rounded-2xl border-2 border-violet-500/40 bg-violet-50/30 dark:bg-violet-500/5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-gray-300 mb-1.5">
                  Circle Name
                </label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. College Squad, Baraat Boys, Family..."
                  maxLength={50}
                  autoFocus
                  required
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-gray-400">
                  Up to 6 members. Once created, you can instantly share the invite link on WhatsApp or Instagram.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newCircleName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Create & Share Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Your Circles for this Event
                </h4>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  {circles.length === 0 ? 'No circles created yet.' : `${circles.length} of 5 slots used`}
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                disabled={maxCirclesReached}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                New Circle
              </button>
            </div>
          )}

          {/* Circles List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-2" />
              <p className="text-xs">Loading circles...</p>
            </div>
          ) : circles.length === 0 && !isCreating ? (
            <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-3">
                <Users className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                No Circles Yet
              </h4>
              <p className="max-w-sm mx-auto text-xs text-zinc-500 dark:text-gray-400 mb-5 leading-relaxed">
                Want to see photos of you together with your partner, siblings, or college friends? Create a circle and invite them in one tap.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Your First Circle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {circles.map((circle) => {
                const acceptedMembers = circle.members.filter((m) => m.status === 'accepted');
                const isCreator = (circle.createdBy?._id || circle.createdBy)?.toString() === currentUserId;
                const isActioning = actionInProgressId === circle._id;

                return (
                  <div
                    key={circle._id}
                    className="group relative p-4 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-zinc-800/60 hover:border-violet-400 dark:hover:border-violet-500/40 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                            {circle.name}
                          </h4>
                          {isCreator && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
                          {acceptedMembers.length} member{acceptedMembers.length === 1 ? '' : 's'} (Max 6)
                        </p>
                      </div>

                      {/* Top Action Pills */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareInvite(circle)}
                          title="Share invite link"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-gray-200 transition-colors"
                        >
                          {copiedCode === circle.inviteCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-600 text-[11px]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" />
                              <span className="text-[11px]">Invite</span>
                            </>
                          )}
                        </button>

                        {isCreator ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCircle(circle)}
                            disabled={isActioning}
                            title="Delete circle"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLeaveCircle(circle)}
                            disabled={isActioning}
                            title="Leave circle"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members Avatar Row */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2 overflow-hidden py-1">
                        {circle.members.map((member, idx) => {
                          const isCurrentUserMember = (member.userId?._id || member.userId)?.toString() === currentUserId;
                          return (
                            <div
                              key={idx}
                              title={`${member.name} (${member.status})`}
                              className={`relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-800 bg-gradient-to-tr from-violet-500 to-indigo-500 text-white text-[11px] font-bold overflow-hidden shrink-0 flex items-center justify-center ${
                                member.status === 'pending' ? 'opacity-60 ring-dashed' : ''
                              }`}
                            >
                              {member.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span>{member.name.slice(0, 2).toUpperCase()}</span>
                              )}
                              {isCurrentUserMember && (
                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-zinc-500 dark:text-gray-400 truncate">
                        {circle.members.map((m) => m.name).join(', ')}
                      </div>
                    </div>

                    {/* Primary Button: View Photos */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCircle(circle);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all group-hover:shadow-violet-500/30"
                    >
                      <span>View Mutual Photos</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between text-[11px] text-zinc-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span>Works immediately with members who accepted.</span>
          </div>
          <button
            onClick={onClose}
            className="font-semibold text-zinc-600 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
