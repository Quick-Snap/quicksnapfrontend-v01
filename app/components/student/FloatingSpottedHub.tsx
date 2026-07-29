'use client';

import { useState } from 'react';
import { Sparkles, Share2, Check, Users, Award, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { softSurface } from '@/lib/dashboardUi';

type SpottedHubProps = {
  unregisteredSummary: any[];
  registeredFriendsSummary: any[];
  referralCount: number;
  userId?: string;
};

export default function FloatingSpottedHub({
  unregisteredSummary = [],
  registeredFriendsSummary = [],
  referralCount = 0,
  userId = '',
}: SpottedHubProps) {
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const totalSpottedPeople = unregisteredSummary.length + registeredFriendsSummary.length;

  if (totalSpottedPeople === 0) return null;

  return (
    <section className="space-y-4" aria-label="Spotted highlights">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-xl">
            Spotted with People
          </h2>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20">
            {totalSpottedPeople} {totalSpottedPeople === 1 ? 'Person' : 'People'}
          </span>
        </div>

        {referralCount > 0 && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Award className="h-4 w-4" />
            <span>{referralCount} Friend{referralCount > 1 ? 's' : ''} Joined</span>
          </div>
        )}
      </div>

      {/* Floating Avatars Container */}
      <div className={`relative overflow-hidden rounded-3xl p-6 ${softSurface} border border-violet-500/10 dark:border-white/[0.08]`}>
        <p className="text-xs text-zinc-500 dark:text-gray-400 mb-4">
          Tap a face to invite them or share a secure blurred preview link:
        </p>

        <div className="flex flex-wrap items-center gap-4 py-2">
          {/* Registered Friends Bubbles */}
          {registeredFriendsSummary.map((item, idx) => {
            const friend = item.friend;
            return (
              <button
                key={`reg-friend-${friend?._id || idx}`}
                type="button"
                onClick={() => setSelectedPerson({ type: 'friend', ...item })}
                className="group relative flex flex-col items-center gap-1.5 transition hover:scale-105 active:scale-95"
              >
                <div className="relative h-14 w-14 rounded-2xl border-2 border-emerald-500/80 bg-zinc-900 p-0.5 shadow-lg shadow-emerald-500/10 overflow-hidden">
                  {friend?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatar} alt={friend.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-emerald-950 text-sm font-bold text-emerald-300">
                      {friend?.name ? friend.name.charAt(0) : 'F'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                    {item.photoCount}
                  </span>
                </div>
                <span className="max-w-[70px] truncate text-[11px] font-medium text-zinc-800 dark:text-gray-200">
                  {friend?.name?.split(' ')[0] || 'Friend'}
                </span>
              </button>
            );
          })}

          {/* Unregistered Spotted Bubbles */}
          {unregisteredSummary.map((item, idx) => {
            return (
              <button
                key={`unreg-person-${item.personId || idx}`}
                type="button"
                onClick={() => setSelectedPerson({ type: 'unregistered', ...item })}
                className="group relative flex flex-col items-center gap-1.5 transition hover:scale-105 active:scale-95"
              >
                <div className="relative h-14 w-14 rounded-2xl border-2 border-violet-500/80 bg-zinc-900 p-0.5 shadow-lg shadow-violet-500/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.bestPhoto?.url}
                    alt="Spotted guest"
                    className="h-full w-full rounded-xl object-cover blur-[2px] scale-110 group-hover:blur-0 transition"
                  />
                  <div className="absolute inset-0 bg-violet-900/20" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow">
                    {item.photoCount}
                  </span>
                </div>
                <span className="max-w-[75px] truncate text-[11px] font-medium text-violet-600 dark:text-violet-300">
                  Spotted #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Person Detail & Share Modal */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedPerson(null);
            setCopied(false);
          }}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="font-semibold text-base">
                  {selectedPerson.type === 'friend'
                    ? selectedPerson.friend?.name || 'Spotted Friend'
                    : 'Spotted Unregistered Guest'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPerson(null);
                  setCopied(false);
                }}
                className="rounded-full bg-white/10 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPerson.bestPhoto?.url}
                alt="Spotted preview photo"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                Spotted in {selectedPerson.photoCount} photo{selectedPerson.photoCount > 1 ? 's' : ''}
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {selectedPerson.type === 'friend'
                ? `You and ${selectedPerson.friend?.name?.split(' ')[0]} were captured together!`
                : 'Share this preview link. When they register, they will automatically be tagged and credited to your referrals!'}
            </p>

            <button
              type="button"
              onClick={() => {
                const photoId = selectedPerson.bestPhoto?._id || selectedPerson.bestPhoto?.imageId;
                const shareUrl = `${window.location.origin}/spotted/${photoId}${userId ? `?referredBy=${userId}` : ''}`;
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                toast.success('Spotted invite link copied!');
                setTimeout(() => setCopied(false), 2500);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Shareable Invite Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
