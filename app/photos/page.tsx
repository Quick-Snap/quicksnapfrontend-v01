'use client';

import { useState, useEffect, useMemo } from 'react';
import { AxiosError } from 'axios';
import { Image as ImageIcon, Download, Calendar, Users, Search, Sparkles, Loader2, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { photoApi } from '@/lib/api';
import { ApiResponse } from '@/types';
import { fetchAllMyPhotos } from '@/lib/photoFetch';
import Pagination from '@/app/components/ui/Pagination';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';
import { DownloadProgressModal } from '@/app/components/photos/DownloadProgressModal';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from 'react-query';

const PHOTOS_PER_PAGE = 12;

const PHOTOS_CARD =
  'card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]';

export default function MyPhotosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUntag = async (photo: any) => {
    if (!confirm("Remove yourself from this photo?\n\nThis will delete your face tag from this photo, hide it from your personal gallery, and ensure it won't be matched to you again even if matching is refreshed.")) {
      return;
    }
    try {
      const response = await photoApi.untag(photo._id || photo.imageId);
      if (response.success) {
        toast.success('Photo untagged successfully');
        setSelectedPhoto(null);
        queryClient.invalidateQueries(['myPhotos']);
        queryClient.invalidateQueries(['myEventPhotos']);
      } else {
        toast.error('Failed to untag photo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to untag photo');
    }
  };

  const { data: queryData, isLoading: loading } = useQuery(
    ['myPhotos'],
    () => fetchAllMyPhotos(),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // // Get all photos and filter to only show photos from events user has joined
  // const rawPhotos = queryData?.data?.photos || [];
  // const userJoinedEvents = user?.events || [];
  
  // // Filter photos to only include those from events the user has joined
  // const allPhotos = rawPhotos.filter((photo: any) => {
  //   const photoEventId = photo.eventId?._id || photo.eventId;
  //   return photoEventId && userJoinedEvents.includes(photoEventId);
  // });

  // Search + pagination calculations
    // Get photos already filtered by the backend (only from joined events)
  const allPhotos = queryData?.data?.photos || [];

  // Search calculations (on the pre-filtered list)
  const filteredPhotos = useMemo(() => {
    if (!searchTerm.trim()) return allPhotos;
    const term = searchTerm.trim().toLowerCase();
    return allPhotos.filter((photo: any) => {
      const name = photo.fileName?.toLowerCase() || '';
      const eventName = photo.eventId?.name?.toLowerCase() || '';
      return name.includes(term) || eventName.includes(term);
    });
  }, [allPhotos, searchTerm]);

  const currentIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return filteredPhotos.findIndex((p: any) => p._id === selectedPhoto._id);
  }, [selectedPhoto, filteredPhotos]);

  const lightboxItems = useMemo(
    () =>
      filteredPhotos.map((p: any) => ({
        image: p.url || '',
        caption: p.fileName || 'Photo',
      })),
    [filteredPhotos]
  );

  const apiTotal = queryData?.data?.pagination?.total;
  const matchedTotal =
    typeof apiTotal === 'number' && !Number.isNaN(apiTotal) ? apiTotal : allPhotos.length;
  const isSearching = Boolean(searchTerm.trim());
  const totalPhotos = isSearching ? filteredPhotos.length : matchedTotal;
  const totalPages = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const endIndex = startIndex + PHOTOS_PER_PAGE;
  const photos = filteredPhotos.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (authLoading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-white/15 dark:border-t-violet-500" />
        <p className="mt-6 text-center text-sm font-medium text-zinc-500 dark:text-gray-400">Loading your photos…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleDownload = async (photo: any) => {
    try {
      const res = await photoApi.downloadPhoto(photo._id);
      if (res.success && res.data?.url) {
        // Fetch the image as a blob to trigger a direct download
        const response = await fetch(res.data.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.data.fileName || 'photo.jpg');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Download started');
      }
    } catch (error) {
      toast.error('Failed to download photo');
    }
  };

  const handleDownloadAll = async () => {
    if (filteredPhotos.length === 0) {
      toast.error('No photos to download');
      return;
    }

    setDownloading(true);
    try {
      const res = await photoApi.createDownloadJob();
      if (!res.success || !res.data?.jobId) {
        throw new Error(res.message || 'Failed to start download');
      }
      setDownloadJobId(res.data.jobId);
      setDownloadModalOpen(true);
      toast.success(res.message || 'Packaging your photos…');
    } catch (error) {
      console.error('Bulk download error:', error);
      const axiosErr = error as AxiosError<ApiResponse<unknown>>;
      const message =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to start download.');
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-8 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.12)] md:p-10 dark:border-white/5 dark:bg-gradient-to-br dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] dark:shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-25 dark:opacity-70" />
        <div className="absolute -bottom-12 -left-12 h-56 w-56 bg-violet-300/35 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-300/30 blur-3xl dark:bg-indigo-500/20" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-4 py-1 dark:border-white/10 dark:bg-white/5">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-200" />
                <span className="text-xs uppercase tracking-[0.25em] text-violet-800/90 dark:text-gray-200">My Photos</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-4xl">Curated For You</h1>
                <span className="rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                  {totalPhotos} photos
                </span>
              </div>
              <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
                Calm, focused gallery that mirrors the landing page aesthetic. Search, browse, and download the moments where you were captured.
              </p>
            </div>

            {matchedTotal > 0 && (
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={downloading}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white px-8 py-4 font-semibold text-zinc-900 shadow-md shadow-zinc-900/5 transition-all hover:-translate-y-1 hover:bg-zinc-50 active:translate-y-0 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400/10 via-transparent to-indigo-400/10 opacity-0 transition-opacity group-hover:opacity-100 dark:from-violet-400/20 dark:to-indigo-400/20" />
                {downloading ? (
                  <Loader2 className="relative h-6 w-6 animate-spin text-violet-600 dark:text-white" />
                ) : (
                  <Download className="relative h-6 w-6 text-violet-600 transition-transform group-hover:translate-y-1 dark:text-white" />
                )}
                <div className="relative flex flex-col items-start leading-tight">
                  <span className="text-base">{downloading ? 'Preparing...' : 'Download All'}</span>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-violet-700 dark:text-violet-200">Archive</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-gray-500" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by event name or file name"
                  className="input w-full rounded-xl py-3 pl-12 pr-4 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-gray-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/90 bg-white dark:border-white/10 dark:bg-white/5">
                <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              </div>
              <div className="leading-tight">
                <p className="font-medium text-zinc-900 dark:text-white">Face recognition active</p>
                <p className="text-xs text-zinc-500 dark:text-gray-500">Matching across your joined events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl border border-zinc-200/90 bg-zinc-100 dark:border-white/5 dark:bg-white/5"
            />
          ))}
        </div>
      ) : photos.length > 0 ? (
        <>
          <div className={PHOTOS_CARD}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                  <ImageIcon size={20} className="text-violet-700 dark:text-violet-300" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Face recognition active</p>
                  <p className="text-sm text-zinc-500 dark:text-gray-400">
                    {isSearching ? (
                      <>
                        Showing {filteredPhotos.length} of {matchedTotal} photo
                        {matchedTotal !== 1 ? 's' : ''} matched to you.
                      </>
                    ) : (
                      <>
                        Found {matchedTotal} photo{matchedTotal !== 1 ? 's' : ''} matched to you. Higher confidence =
                        stronger match.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-gray-400">
                <span className="rounded-full border border-zinc-200/90 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                  {isSearching ? `${filteredPhotos.length} of ${matchedTotal}` : matchedTotal} results
                </span>
                <span className="rounded-full border border-zinc-200/90 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/5">
                  {totalPages} page{totalPages !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, index: number) => (
              <div
                key={photo._id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-50 shadow-sm transition-all hover:border-violet-400/60 hover:shadow-xl hover:shadow-violet-500/10 dark:border-white/5 dark:bg-[#0f0c18] dark:hover:border-violet-500/30"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{photo.eventId?.name || 'Event'}</p>
                      {photo.userConfidence && (
                        <span className="text-[11px] text-emerald-200 bg-emerald-500/20 border border-emerald-400/20 rounded-full px-2 py-0.5">
                          {Math.round(photo.userConfidence)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 truncate">{photo.fileName}</p>
                  </div>
                </div>
                {photo.userConfidence && (
                  <div className="absolute top-3 right-3 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-sm text-emerald-100 text-[11px] px-2.5 py-1 rounded-full font-semibold shadow-lg shadow-emerald-500/10">
                    {Math.round(photo.userConfidence)}%
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:text-gray-100">
                  #{(startIndex + index + 1).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`mt-10 ${PHOTOS_CARD}`}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredPhotos.length}
                itemsPerPage={PHOTOS_PER_PAGE}
                showInfo={true}
              />
            </div>
          )}
        </>
      ) : (
        <div className="card py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/10">
            <ImageIcon size={32} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">No Photos Yet</h3>
          <p className="mx-auto mb-6 max-w-md text-zinc-600 dark:text-gray-400">
            Photos where you appear will show up here automatically once event organizers upload them.
            Make sure you&apos;ve registered your face!
          </p>
          {!user?.faceRegistered && (
            <a href="/register-face" className="btn-gradient px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
              Register Your Face
            </a>
          )}
        </div>
      )}

      {selectedPhoto && currentIndex >= 0 && (
        <PhotoLightbox
          items={lightboxItems}
          startIndex={currentIndex}
          onIndexChange={(i) => setSelectedPhoto(filteredPhotos[i])}
          onClose={() => setSelectedPhoto(null)}
          onUntag={() => handleUntag(selectedPhoto)}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                  {selectedPhoto.eventId?.name || 'Event photo'}
                </h3>
                <p className="truncate text-xs text-gray-300 sm:text-sm" title={selectedPhoto.fileName}>
                  {selectedPhoto.fileName}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    {selectedPhoto.uploadedAt
                      ? new Date(selectedPhoto.uploadedAt).toLocaleDateString()
                      : 'Unknown date'}
                  </span>
                  {selectedPhoto.userConfidence ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {Math.round(selectedPhoto.userConfidence)}% match
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(selectedPhoto)}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 sm:h-10 sm:w-auto"
              >
                <Download size={18} className="shrink-0" />
                Download
              </button>
            </div>
          }
        />
      )}

      <DownloadProgressModal
        open={downloadModalOpen}
        jobId={downloadJobId}
        fileName={`${user?.name || 'my'}_photos.zip`}
        onClose={() => {
          setDownloadModalOpen(false);
          setDownloadJobId(null);
        }}
      />
    </div>
  );
}
