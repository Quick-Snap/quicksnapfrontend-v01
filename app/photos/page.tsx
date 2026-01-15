'use client';

import { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Download, Calendar, Users, Search, Sparkles, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { photoApi } from '@/lib/api';
import Pagination from '@/app/components/ui/Pagination';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';

const PHOTOS_PER_PAGE = 12;

export default function MyPhotosPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading: loading } = useQuery(
    ['myPhotos'],
    () => photoApi.getMyPhotos(),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Get all photos and filter to only show photos from events user has joined
  const rawPhotos = queryData?.data?.photos || [];
  const userJoinedEvents = user?.events || [];
  
  // Filter photos to only include those from events the user has joined
  const allPhotos = rawPhotos.filter((photo: any) => {
    const photoEventId = photo.eventId?._id || photo.eventId;
    return photoEventId && userJoinedEvents.includes(photoEventId);
  });

  // Search + pagination calculations
  const filteredPhotos = useMemo(() => {
    if (!searchTerm.trim()) return allPhotos;
    const term = searchTerm.trim().toLowerCase();
    return allPhotos.filter((photo: any) => {
      const name = photo.fileName?.toLowerCase() || '';
      const eventName = photo.eventId?.name?.toLowerCase() || '';
      return name.includes(term) || eventName.includes(term);
    });
  }, [allPhotos, searchTerm]);

  const totalPhotos = filteredPhotos.length;
  const totalPages = Math.ceil(totalPhotos / PHOTOS_PER_PAGE);
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const endIndex = startIndex + PHOTOS_PER_PAGE;
  const photos = filteredPhotos.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

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
    if (photos.length === 0) return;

    setDownloading(true);
    const loadingToast = toast.loading('Preparing your ZIP archive...');

    try {
      const blob = await photoApi.downloadMyPhotosZip();

      // Create a link and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${user?.name || 'my'}_photos.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Download started!', { id: loadingToast });
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to prepare download.', { id: loadingToast });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 border border-white/5 bg-gradient-to-br from-[#181025] via-[#0f0b1d] to-[#0a0d1e] shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 w-40 h-40 bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 border border-white/10">
                <Sparkles className="h-4 w-4 text-violet-200" />
                <span className="text-xs uppercase tracking-[0.25em] text-gray-200">My Photos</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Curated For You</h1>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-200">
                  {totalPhotos} photos
                </span>
              </div>
              <p className="text-gray-300 max-w-2xl">
                Calm, focused gallery that mirrors the landing page aesthetic. Search, browse, and download the moments where you were captured.
              </p>
            </div>

            {totalPhotos > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white font-semibold transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 via-transparent to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {downloading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
                )}
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-base">{downloading ? 'Preparing...' : 'Download All'}</span>
                  <span className="text-[11px] text-violet-200 font-medium uppercase tracking-widest">Archive</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by event name or file name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-violet-300" />
              </div>
              <div className="leading-tight">
                <p className="text-white font-medium">Face recognition active</p>
                <p className="text-xs text-gray-500">Matching across your joined events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : photos.length > 0 ? (
        <>
          <div className="card bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <ImageIcon size={20} className="text-violet-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">Face recognition active</p>
                  <p className="text-sm text-gray-400">
                    Found {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} matched to you. Higher confidence = stronger match.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{totalPhotos} results</span>
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, index: number) => (
              <div
                key={photo._id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0f0c18] border border-white/5 cursor-pointer hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/10"
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
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] bg-white/10 border border-white/15 text-gray-100 backdrop-blur-sm">
                  #{(startIndex + index + 1).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 card bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalPhotos}
                itemsPerPage={PHOTOS_PER_PAGE}
                showInfo={true}
              />
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon size={32} className="text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Photos Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Photos where you appear will show up here automatically once event organizers upload them.
            Make sure you've registered your face!
          </p>
          {!user?.faceRegistered && (
            <a href="/register-face" className="btn-gradient px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
              Register Your Face
            </a>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-[#111111] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.fileName}
                className="w-full h-auto rounded-t-2xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPhoto.eventId?.name || 'Event Photo'}</h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedPhoto.fileName}</p>
                </div>
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="btn-gradient px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Calendar size={16} className="text-violet-400" />
                  </div>
                  <span className="text-sm">
                    {selectedPhoto.uploadedAt ? new Date(selectedPhoto.uploadedAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                {selectedPhoto.userConfidence && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Users size={16} className="text-emerald-400" />
                    </div>
                    <span className="text-sm">{Math.round(selectedPhoto.userConfidence)}% match confidence</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
