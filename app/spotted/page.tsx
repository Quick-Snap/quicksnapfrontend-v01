'use client';

import { useQuery } from 'react-query';
import { photoApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Sparkles, Share2, Check, Award, Copy, ChevronLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { softSurface } from '@/lib/dashboardUi';

// Helper: Calculate CSS objectPosition & scale to zoom into face bounding box (or upper face region)
function getFaceCropStyle(box?: any) {
  if (!box) {
    // Upper 25% center crop fallback for group photos without saved coordinates
    return { objectPosition: '50% 25%', transform: 'scale(2.2)' };
  }
  
  const left = box.Left !== undefined ? box.Left : (box.left ?? 0.3);
  const top = box.Top !== undefined ? box.Top : (box.top ?? 0.3);
  const width = box.Width !== undefined ? box.Width : (box.width ?? 0.2);
  const height = box.Height !== undefined ? box.Height : (box.height ?? 0.2);

  const centerX = Math.min(100, Math.max(0, (left + width / 2) * 100));
  const centerY = Math.min(100, Math.max(0, (top + height / 2) * 100));

  const faceDim = Math.max(width, height, 0.05);
  const zoomScale = Math.min(6.5, Math.max(3.5, 1 / (faceDim * 1.5)));

  return {
    objectPosition: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
    transformOrigin: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
    transform: `scale(${zoomScale.toFixed(1)})`
  };
}

export default function SpottedHubPage() {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: coOccurringRes, isLoading } = useQuery(
    ['coOccurringPhotos', user?.id],
    () => photoApi.getCoOccurring(),
    { enabled: !!user }
  );

  const unregisteredSummary = coOccurringRes?.data?.unregisteredSummary || [];
  const referralCount = coOccurringRes?.data?.referralStats?.referralCount || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header / Nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Spotted Hub
            </h1>
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20">
              {unregisteredSummary.length} {unregisteredSummary.length === 1 ? 'Person' : 'People'} Spotted
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
            People captured near you in your photos. Share an invite link to tag them automatically!
          </p>
        </div>

        {referralCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20 self-start sm:self-auto">
            <Award className="h-4 w-4 text-violet-500" />
            <span>{referralCount} Friend{referralCount > 1 ? 's' : ''} Joined via Your Links</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      )}

      {/* Grid of Spotted People Cards */}
      {!isLoading && unregisteredSummary.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {unregisteredSummary.map((item: any, idx: number) => {
            const faceBox = item.bestPhoto?.unregisteredFaces?.[0]?.boundingBox;
            const faceStyle = getFaceCropStyle(faceBox);
            const photoId = item.bestPhoto?._id || item.bestPhoto?.imageId;
            const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/spotted/${photoId}${user?.id ? `?referredBy=${user.id}` : ''}` : '';

            return (
              <div
                key={`spotted-card-${item.personId || idx}`}
                className={`flex flex-col justify-between overflow-hidden rounded-3xl p-5 ${softSurface} border border-zinc-200/60 dark:border-white/[0.08] shadow-sm transition hover:shadow-md space-y-4`}
              >
                <div className="space-y-3">
                  {/* Zoomed Face Avatar Header */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-violet-500/80 bg-zinc-900 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.bestPhoto?.url}
                        alt={`Spotted #${idx + 1}`}
                        style={faceStyle}
                        className="h-full w-full rounded-xl object-cover transition-transform duration-300"
                      />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow">
                        <Sparkles className="h-2.5 w-2.5" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                        Spotted #{idx + 1}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
                        Spotted in {item.photoCount} photo{item.photoCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Photo Preview Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.bestPhoto?.url}
                      alt="Spotted photo preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      {item.bestPhoto?.eventId?.name || 'Event Photo'}
                    </div>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedId(item.personId);
                    toast.success('Invite link copied!');
                    setTimeout(() => setCopiedId(null), 2500);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
                >
                  {copiedId === item.personId ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      Copied Invite Link!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Shareable Invite Link
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && unregisteredSummary.length === 0 && (
        <div className={`rounded-3xl p-12 text-center ${softSurface} space-y-3`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">No spotted friends yet</h3>
          <p className="text-xs text-zinc-500 dark:text-gray-400 max-w-sm mx-auto">
            When group photos are uploaded to events you join, people captured near you will appear here!
          </p>
        </div>
      )}
    </div>
  );
}
