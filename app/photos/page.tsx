'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Calendar, MapPin, Users, Search, Sparkles, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { photoApi } from '@/lib/api';
import Pagination from '@/app/components/ui/Pagination';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';

const PHOTOS_PER_PAGE = 20;

export default function MyPhotosPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: queryData, isLoading: loading } = useQuery(
    ['myPhotos'],
    () => photoApi.getMyPhotos(),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
    }
  );

  const allPhotos = queryData?.data?.photos || [];

  // Pagination calculations
  const totalPhotos = allPhotos.length;
  const totalPages = Math.ceil(totalPhotos / PHOTOS_PER_PAGE);
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const endIndex = startIndex + PHOTOS_PER_PAGE;
  const photos = allPhotos.slice(startIndex, endIndex);

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
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 md:p-10 shadow-2xl shadow-violet-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-violet-200" />
              <span className="text-violet-200 text-sm font-medium tracking-wide">AI-Powered Recognition</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">My Photos</h1>
            <p className="text-violet-100 mt-2 max-w-xl text-lg opacity-90">
              Every moment you're in, captured and curated in one place.
            </p>
          </div>

          {photos.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="group relative px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {downloading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Download className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
              )}
              <div className="flex flex-col items-start leading-tight">
                <span className="text-lg">{downloading ? 'Preparing...' : 'Download All'}</span>
                <span className="text-[10px] text-violet-200 font-medium uppercase tracking-widest">Digital Archive</span>
              </div>
            </button>
          )}
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
          <div className="card bg-violet-500/10 border-violet-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <ImageIcon size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Face Recognition Active</p>
                <p className="text-sm text-gray-400 mt-1">
                  Found {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} where you appear.
                  Confidence scores indicate match accuracy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, index: number) => (
              <div
                key={photo._id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#111111] border border-white/5 cursor-pointer hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/10"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-medium text-white truncate">{photo.eventId?.name || 'Event'}</p>
                    {photo.userConfidence && (
                      <p className="text-xs text-gray-300 mt-1">{Math.round(photo.userConfidence)}% match</p>
                    )}
                  </div>
                </div>
                {/* Confidence badge */}
                {photo.userConfidence && (
                  <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {Math.round(photo.userConfidence)}%
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
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
