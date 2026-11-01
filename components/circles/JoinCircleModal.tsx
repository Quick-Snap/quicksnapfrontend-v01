'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { circleApi, CircleInviteInfo, EventCircleItem } from '@/lib/api';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  inviteCode: string;
  currentUser: any;
  onJoined: (circle: EventCircleItem) => void;
}

export default function JoinCircleModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  inviteCode,
  currentUser,
  onJoined
}: JoinCircleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<CircleInviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !inviteCode) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    circleApi
      .getInviteInfo(eventId, inviteCode)
      .then((res) => {
        if (mounted && res.success && res.data) {
          setInviteInfo(res.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.response?.data?.message || 'Invalid or expired circle invite link.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, eventId, inviteCode]);

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!currentUser) {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/events/${eventId}`;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      setJoining(true);
      const res = await circleApi.joinCircle(eventId, inviteCode);
      if (res.success && res.data) {
        toast.success(`Joined "${res.data.name}"! 🎉`);
        onJoined(res.data);
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to join circle');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-violet-600 mb-3" />
            <p className="text-xs text-zinc-500 dark:text-gray-400">Checking invite link...</p>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Invite Unavailable
              </h3>
              <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                {error}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 dark:text-gray-300 transition-colors"
            >
              Continue to Event
            </button>
          </div>
        ) : inviteInfo ? (
          <div className="py-2 space-y-5">
            {/* Header Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
              <Users className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 mb-2">
                <Sparkles className="h-3 w-3" />
                Circle Invitation
              </span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {inviteInfo.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
                Invited by <strong>{inviteInfo.creatorName}</strong> • {inviteInfo.memberCount}/{inviteInfo.maxMembers} members
              </p>
            </div>

            {/* Privacy Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 text-left space-y-2 text-xs text-zinc-600 dark:text-gray-300">
              <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mutual Photos Only</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-gray-400">
                Joining lets you view photos where <strong>you and fellow circle members</strong> appear together. Your private photos without them remain completely hidden.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              {inviteInfo.isAlreadyMember ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You are already in this circle!</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-500/25 transition-all"
                  >
                    View Event Photos
                  </button>
                </div>
              ) : inviteInfo.isFull ? (
                <div className="space-y-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    This circle has reached the limit of 6 members.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-gray-300"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
                >
                  {joining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Joining Circle...</span>
                    </>
                  ) : !currentUser ? (
                    <>
                      <span>Sign In to Accept & Join</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Accept & Join Circle</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
