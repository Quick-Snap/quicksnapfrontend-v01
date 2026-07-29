'use client';

import { useState } from 'react';
import { Sparkles, Share2, Check, Award, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { softSurface } from '@/lib/dashboardUi';

type SpottedHubProps = {
  unregisteredSummary: any[];
  registeredFriendsSummary?: any[];
  referralCount: number;
  userId?: string;
};

// Helper: Calculate CSS objectPosition & scale to zoom into face bounding box
function getFaceCropStyle(box?: any) {
  if (!box) return { objectPosition: 'center center', transform: 'scale(1.1)' };
  
  const left = box.Left !== undefined ? box.Left : (box.left || 0.3);
  const top = box.Top !== undefined ? box.Top : (box.top || 0.3);
  const width = box.Width !== undefined ? box.Width : (box.width || 0.3);
  const height = box.Height !== undefined ? box.Height : (box.height || 0.3);

  const centerX = Math.min(100, Math.max(0, (left + width / 2) * 100));
  const centerY = Math.min(100, Math.max(0, (top + height / 2) * 100));

  return {
    objectPosition: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
    transform: 'scale(2.4)'
  };
}

export default function FloatingSpottedHub({
  unregisteredSummary = [],
  referralCount = 0,
  userId = '',
}: SpottedHubProps) {
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  if (unregisteredSummary.length === 0) return null;

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
            Spotted People
          </h2>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20">
            {unregisteredSummary.length} Unregistered {unregisteredSummary.length === 1 ? 'Person' : 'People'}
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
      <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 ${softSurface} border border-violet-500/10 dark:border-white/[0.08]`}>
        <p className="text-xs text-zinc-500 dark:text-gray-400 mb-4">
          Tap a spotted face to copy an invite link. When they register, they will be automatically tagged!
        </p>

        <div className="flex flex-wrap items-center gap-4 py-1">
          {unregisteredSummary.map((item, idx) => {
            const faceBox = item.bestPhoto?.unregisteredFaces?.[0]?.boundingBox;
            const faceStyle = getFaceCropStyle(faceBox);

            return (
              <button
                key={`unreg-person-${item.personId || idx}`}
                type="button"
                onClick={() => setSelectedPerson({ index: idx + 1, ...item })}
                className="group relative flex flex-col items-center gap-1.5 transition hover:scale-110 active:scale-95"
              >
                <div className="relative h-14 w-14 rounded-2xl border-2 border-violet-500/80 bg-zinc-900 p-0.5 shadow-lg shadow-violet-500/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.bestPhoto?.url}
                    alt={`Spotted #${idx + 1}`}
                    style={faceStyle}
                    className="h-full w-full rounded-xl object-cover transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-violet-900/10 group-hover:bg-transparent transition" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow">
                    {item.photoCount}
                  </span>
                </div>
                <span className="max-w-[75px] truncate text-[11px] font-semibold text-violet-600 dark:text-violet-300">
                  Spotted #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail & Share Modal */}
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
                  Spotted #{selectedPerson.index}
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
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                Spotted in {selectedPerson.photoCount} photo{selectedPerson.photoCount > 1 ? 's' : ''}
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Share this secure blurred preview link with your friend. Once they register, their face will be automatically matched!
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-[0.98]"
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
