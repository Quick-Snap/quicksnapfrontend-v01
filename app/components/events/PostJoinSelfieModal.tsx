'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Sparkles, X, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface PostJoinSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
  eventId?: string;
  redirectPath?: string;
}

export default function PostJoinSelfieModal({
  isOpen,
  onClose,
  eventName,
  eventId,
  redirectPath,
}: PostJoinSelfieModalProps) {
  if (!isOpen) return null;

  const targetRedirect = redirectPath || (eventId ? `/events/${eventId}` : '/dashboard');
  const registerFaceUrl = `/register-face?redirect=${encodeURIComponent(targetRedirect)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-2xl dark:border-white/10 dark:bg-[#0f0c18] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-600/20" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-600/20" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="relative text-center">
          {/* Success Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 mb-4 ring-1 ring-emerald-500/20">
            <span>🎉</span>
            <span>You&apos;re officially in!</span>
          </div>

          {/* Central Camera Illustration */}
          <div className="mx-auto mb-4 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30">
            <Camera className="h-10 w-10" />
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black shadow-md ring-2 ring-white dark:ring-[#0f0c18]">
              <Sparkles className="h-4 w-4 fill-current" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Find your photos automatically?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
            {eventName ? (
              <>
                You joined <span className="font-semibold text-zinc-900 dark:text-white">&ldquo;{eventName}&rdquo;</span>.
              </>
            ) : (
              'You successfully joined the event.'
            )}{' '}
            Take a 30-second selfie so our AI can instantly recognize you in all event photos.
          </p>

          {/* Value Highlights */}
          <div className="my-5 rounded-2xl bg-zinc-50 p-3.5 text-left text-xs space-y-2 border border-zinc-200/70 dark:bg-white/[0.04] dark:border-white/10">
            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-gray-300">
              <Zap className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Takes <strong>~30 seconds</strong>, no app download required</span>
            </div>
            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-gray-300">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
              <span>Matches all current &amp; newly uploaded photos</span>
            </div>
            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-gray-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Private &amp; secure — used strictly for photo finding</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Link
              href={registerFaceUrl}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 px-5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              Take Quick Selfie (~30s)
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              I&apos;ll browse photos manually for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
