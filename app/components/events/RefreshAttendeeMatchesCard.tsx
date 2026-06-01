'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw, Users, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';
import { canRefreshAttendeePhotoMatches } from '@/lib/eventPermissions';
import { useAuth } from '@/contexts/AuthContext';

type RefreshData = {
  attendeesTotal: number;
  processedWithFace: number;
  skippedNoFace: number;
  skippedDownloadFailed: number;
  errors: { userId: string; message: string }[];
  totalMappingsWritten: number;
};

function buildSummary(d: RefreshData): string {
  const skipped = d.skippedNoFace + d.skippedDownloadFailed;
  const errN = d.errors?.length ?? 0;
  const parts = [
    `Processed ${d.processedWithFace} of ${d.attendeesTotal} attendees`,
    skipped > 0 ? `${skipped} skipped (no face or download issues)` : null,
    errN > 0 ? `${errN} issue${errN === 1 ? '' : 's'} during matching` : null,
  ].filter(Boolean);
  return parts.join('; ');
}

type Variant = 'dark' | 'light';

interface RefreshAttendeeMatchesCardProps {
  eventId: string;
  event: { organizer?: unknown; photographers?: unknown[] } | null;
  variant?: Variant;
  className?: string;
}

export default function RefreshAttendeeMatchesCard({
  eventId,
  event,
  variant = 'dark',
  className = '',
}: RefreshAttendeeMatchesCardProps) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<RefreshData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState<{
    progress: number;
    total: number;
    processedWithFace: number;
    skippedNoFace: number;
    skippedDownloadFailed: number;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const allowed = event ? canRefreshAttendeePhotoMatches(user, event) : false;

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await eventApi.getAttendeePhotoMatchesRefreshStatus(eventId);
      if (res.success && res.data) {
        const job = res.data;
        if (job.status === 'processing') {
          setPending(true);
          setProgressStatus({
            progress: job.progress || 0,
            total: job.total || 0,
            processedWithFace: job.processedWithFace || 0,
            skippedNoFace: job.skippedNoFace || 0,
            skippedDownloadFailed: job.skippedDownloadFailed || 0,
          });
        } else if (job.status === 'completed') {
          setPending(false);
          setProgressStatus(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          const d: RefreshData = {
            attendeesTotal: job.total || 0,
            processedWithFace: job.processedWithFace || 0,
            skippedNoFace: job.skippedNoFace || 0,
            skippedDownloadFailed: job.skippedDownloadFailed || 0,
            errors: job.errors || [],
            totalMappingsWritten: job.totalMappingsWritten || 0,
          };
          setLastResult(d);
        } else if (job.status === 'failed') {
          setPending(false);
          setProgressStatus(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.error(job.error || 'Matching refresh failed in the background.');
        } else {
          // Idle
          setPending(false);
          setProgressStatus(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching refresh status:', e);
    }
  }, [eventId]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    // Poll immediately, then every 2 seconds
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2000);
  }, [checkStatus]);

  // Check initial status on mount/allowed
  useEffect(() => {
    if (allowed && eventId) {
      checkStatus();
    }
  }, [allowed, eventId, checkStatus]);

  const handleForceReset = useCallback(async () => {
    if (!eventId) return;
    if (!confirm('Are you sure you want to force-reset this matching session? Use this if the session is stuck indefinitely due to a server update.')) {
      return;
    }

    try {
      const res = await eventApi.resetAttendeePhotoMatchesRefreshStatus(eventId);
      if (res.success) {
        toast.success('Refresh session reset to idle successfully.');
        setPending(false);
        setProgressStatus(null);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        toast.error(res.message || 'Failed to reset status');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reset matching status');
    }
  }, [eventId]);

  const runRefresh = useCallback(async () => {
    if (!eventId || pending) return;
    setPending(true);
    setDetailsOpen(false);
    setProgressStatus(null);

    try {
      const res = await eventApi.refreshAttendeePhotoMatches(eventId);
      if (!res.success || !res.data) {
        toast.error(res.message || 'Could not refresh attendee matches');
        setPending(false);
        return;
      }
      
      toast.success('Attendee photo match refresh started in the background.');
      startPolling();
    } catch (e: unknown) {
      setPending(false);
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401) {
        toast.error(msg || 'Please sign in again to continue.');
      } else if (status === 403) {
        toast.error(msg || 'You are not allowed to refresh matches for this event.');
      } else if (status === 404) {
        toast.error(msg || 'Event not found.');
      } else {
        toast.error(msg || 'Failed to refresh attendee photo matches');
      }
    }
  }, [eventId, pending, startPolling]);

  if (!allowed) return null;

  const isDark = variant === 'dark';
  const cardClass = isDark
    ? 'rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.35)]'
    : 'rounded-xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm';

  const titleClass = isDark ? 'text-white' : 'text-gray-900';
  const subClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const iconWrap = isDark
    ? 'rounded-xl bg-teal-500/15 border border-teal-500/25'
    : 'rounded-xl bg-teal-50 border border-teal-100';

  return (
    <div className={`${cardClass} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center ${iconWrap}`}>
          <Users className={`h-6 w-6 ${isDark ? 'text-teal-300' : 'text-teal-600'}`} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className={`text-lg font-semibold ${titleClass}`}>Update My photos for all attendees</h3>
            <p className={`mt-1 text-sm leading-relaxed ${subClass}`}>
              Run after uploading new photos. This can take a little while. Attendees still need to open or pull-to-refresh
              My photos to see updates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runRefresh}
              disabled={pending}
              className={
                isDark
                  ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:from-teal-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'
                  : 'inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50'
              }
            >
              {pending ? (
                <>
                  <span
                    className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white`}
                  />
                  {progressStatus
                    ? `Refreshing (${progressStatus.progress}/${progressStatus.total})…`
                    : 'Refreshing matches…'}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  Refresh attendee matches
                </>
              )}
            </button>
            {pending && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className={`text-sm ${subClass}`}>
                  {progressStatus
                    ? `Matching faces to photos — Processed ${progressStatus.progress} of ${progressStatus.total} attendees.`
                    : 'Matching faces to this event\'s photos — please wait.'}
                </span>
                <button
                  type="button"
                  onClick={handleForceReset}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 underline cursor-pointer transition-all ml-1 shrink-0"
                  title="Force reset stuck refresh status back to idle"
                >
                  Stuck? Reset Status
                </button>
              </div>
            )}
          </div>

          {lastResult && !pending && (
            <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
              <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{buildSummary(lastResult)}</p>
              <p className={`mt-1 ${subClass}`}>
                Mappings written (approx.):{' '}
                <span className={isDark ? 'text-teal-200' : 'text-teal-700'}>{lastResult.totalMappingsWritten}</span>
              </p>
              {(lastResult.errors?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((o) => !o)}
                    className={`inline-flex items-center gap-1 text-sm font-medium ${isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-800'}`}
                  >
                    {detailsOpen ? (
                      <>
                        Hide details <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View details ({lastResult.errors!.length}) <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  {detailsOpen && (
                    <ul className={`mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 text-xs ${isDark ? 'border-white/10 bg-black/30 text-gray-300' : 'border-gray-100 bg-gray-50 text-gray-700'}`}>
                      {lastResult.errors!.map((row, i) => (
                        <li key={`${row.userId}-${i}`}>
                          <span className="font-mono text-[11px] opacity-80">{row.userId}</span>
                          <span className="mx-1 opacity-50">—</span>
                          {row.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
