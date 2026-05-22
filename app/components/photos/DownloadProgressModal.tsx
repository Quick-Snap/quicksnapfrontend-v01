'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { photoApi, DownloadJobStatus } from '@/lib/api';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m > 0) return `${m}m ${rem}s`;
  return `${s}s`;
}

type Props = {
  open: boolean;
  jobId: string | null;
  fileName: string;
  onClose: () => void;
};

export function DownloadProgressModal({ open, jobId, fileName, onClose }: Props) {
  const [job, setJob] = useState<DownloadJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchingFile, setFetchingFile] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadedRef = useRef(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const triggerFileDownload = useCallback(async (id: string, name: string) => {
    setFetchingFile(true);
    try {
      const blob = await photoApi.downloadJobFile(id);
      const url = window.URL.createObjectURL(blob);
      const link = linkRef.current;
      if (!link) {
        window.URL.revokeObjectURL(url);
        throw new Error('Download link unavailable');
      }
      link.href = url;
      link.setAttribute('download', name);
      link.click();
      window.URL.revokeObjectURL(url);
      link.removeAttribute('href');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to download ZIP file';
      setError(msg);
      throw e;
    } finally {
      setFetchingFile(false);
    }
  }, []);

  const handleCancel = async () => {
    if (!jobId || cancelling) return;
    setCancelling(true);
    try {
      const res = await photoApi.cancelDownloadJob(jobId);
      stopPolling();
      if (res.success && res.data) {
        setJob(res.data);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel download');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!open || !jobId) {
      setJob(null);
      setError(null);
      downloadedRef.current = false;
      stopPolling();
      return;
    }

    downloadedRef.current = false;

    const poll = async () => {
      try {
        const res = await photoApi.getDownloadJob(jobId);
        if (res.success && res.data) {
          setJob(res.data);
          setError(null);

          if (res.data.status === 'ready' && !downloadedRef.current) {
            downloadedRef.current = true;
            stopPolling();
            try {
              await triggerFileDownload(jobId, res.data.zipFileName || fileName);
            } catch {
              /* error set in triggerFileDownload */
            }
          }

          if (
            res.data.status === 'failed' ||
            res.data.status === 'cancelled'
          ) {
            stopPolling();
            if (res.data.status === 'failed') {
              setError(res.data.error || 'Download failed');
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to check download status';
        setError(msg);
        stopPolling();
      }
    };

    void poll();
    pollRef.current = setInterval(poll, 2000);

    return () => stopPolling();
  }, [open, jobId, fileName, triggerFileDownload]);

  if (!open) return null;

  const isReady = job?.status === 'ready';
  const isFailed = job?.status === 'failed' || (!!error && job?.status !== 'cancelled');
  const isCancelled = job?.status === 'cancelled';
  const isProcessing = job?.status === 'queued' || job?.status === 'processing';

  const phaseLabel = isCancelled
    ? 'Packaging stopped'
    : job?.phase === 'collecting'
      ? 'Collecting your photos…'
      : job?.phase === 'packaging'
        ? 'Building ZIP archive…'
        : job?.phase === 'ready'
          ? 'Your download is ready!'
          : job?.phase === 'failed'
            ? 'Download failed'
            : 'Starting…';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <a ref={linkRef} className="sr-only" aria-hidden tabIndex={-1} />
      <div
        role="dialog"
        aria-labelledby="download-progress-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0f0c18]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {isReady ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            ) : isCancelled ? (
              <AlertCircle className="h-8 w-8 text-zinc-400" />
            ) : isFailed ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            )}
            <div>
              <h2
                id="download-progress-title"
                className="text-lg font-semibold text-zinc-900 dark:text-white"
              >
                {isReady
                  ? 'Download ready'
                  : isCancelled
                    ? 'Download cancelled'
                    : isFailed
                      ? 'Download failed'
                      : 'Preparing your photos'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-gray-400">{phaseLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {job && (isProcessing || isReady) && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-gray-300">
              <span>
                {job.processedPhotos} / {job.totalPhotos} photos
              </span>
              <span>{job.progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${job.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-gray-400">
              <span>Elapsed: {formatDuration(job.elapsedMs)}</span>
              {job.estimatedMsRemaining != null && job.estimatedMsRemaining > 0 && (
                <span>~{formatDuration(job.estimatedMsRemaining)} left</span>
              )}
            </div>
            {job.failedPhotos > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {job.failedPhotos} photo(s) could not be included.
              </p>
            )}
          </div>
        )}

        {isReady && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-gray-300">
            {fetchingFile
              ? 'Downloading ZIP to your device…'
              : (
                <>
                  ZIP is ready. If your browser did not start automatically, click{' '}
                  <strong>Download ZIP</strong> below.
                </>
              )}
          </p>
        )}

        {isCancelled && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-gray-300">
            Packaging stopped. You can close this dialog and start a new download when ready.
          </p>
        )}

        {isFailed && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error || job?.error || 'Something went wrong.'}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {isProcessing && jobId && (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancel()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel download'}
            </button>
          )}
          {isReady && jobId && (
            <button
              type="button"
              disabled={fetchingFile}
              onClick={() => void triggerFileDownload(jobId, job?.zipFileName || fileName)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {fetchingFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {fetchingFile ? 'Downloading…' : 'Download ZIP'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
