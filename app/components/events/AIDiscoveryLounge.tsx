'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Sparkles, CheckCircle2, ScanFace, Loader2 } from 'lucide-react';
import { eventApi } from '@/lib/api';

interface AIDiscoveryLoungeProps {
  eventId: string;
  onReady?: () => void;
  className?: string;
  variant?: 'banner' | 'card';
}

export default function AIDiscoveryLounge({
  eventId,
  onReady,
  className = '',
  variant = 'banner'
}: AIDiscoveryLoungeProps) {
  const queryClient = useQueryClient();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const { data: aiStatusRes } = useQuery(
    ['eventAIStatus', eventId],
    () => eventApi.getAIStatus(eventId),
    {
      enabled: !!eventId,
      refetchInterval: (data) => {
        const status = data?.data?.status;
        return status === 'indexing' ? 2500 : false;
      },
      staleTime: 2000,
      onSuccess: (res) => {
        if (res.data?.status === 'ready') {
          queryClient.invalidateQueries(['myEventPhotos', eventId]);
          queryClient.invalidateQueries(['eventPhotos', eventId]);
          onReady?.();
        }
      }
    }
  );

  const aiData = aiStatusRes?.data;
  const status = aiData?.status || 'idle';
  const progressPct = aiData?.progress?.percentage || 0;
  const totalPhotos = aiData?.totalPhotos || 0;
  const currentPhotos = aiData?.progress?.current || 0;
  const isIncremental = (aiData?.indexedPhotos || 0) > 0;

  // Initialize and tick down countdown timer
  useEffect(() => {
    if (status === 'indexing') {
      const serverSeconds = aiData?.progress?.estimatedSecondsRemaining;
      if (secondsRemaining === null || (serverSeconds && serverSeconds < secondsRemaining)) {
        setSecondsRemaining(serverSeconds && serverSeconds > 0 ? serverSeconds : Math.max(20, Math.round(totalPhotos / 35)));
      }
    } else if (status === 'ready') {
      setSecondsRemaining(0);
    }
  }, [status, aiData?.progress?.estimatedSecondsRemaining, totalPhotos, secondsRemaining]);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || status !== 'indexing') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, status]);

  if (status !== 'indexing') {
    return null;
  }

  const isCard = variant === 'card';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-violet-600/5 p-4 sm:p-5 shadow-sm backdrop-blur-md dark:border-violet-500/20 ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl dark:bg-violet-600/15" />

      <div className="relative flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <ScanFace className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {isIncremental ? 'Indexing New Photos' : 'Setting Up AI Face Finder'}
                </h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  <Sparkles size={11} className="animate-spin text-violet-600 dark:text-violet-400" />
                  {isIncremental ? 'Updating Matches' : 'First-Time Setup'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                {isIncremental
                  ? 'Scanning newly uploaded photos for face matches. Your personal matches will appear automatically!'
                  : 'Scanning gallery photos for face discovery. Your personal matches will appear automatically!'}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">
              {secondsRemaining !== null && secondsRemaining > 0
                ? `~${secondsRemaining}s remaining`
                : 'Finalizing matches...'}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              {currentPhotos > 0 && totalPhotos > 0
                ? `Indexed ${currentPhotos} of ${totalPhotos} photos`
                : 'Processing photos...'}
            </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{progressPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
