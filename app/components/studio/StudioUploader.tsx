'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Camera,
  Trash2,
  Loader2,
  Info,
  X,
  Upload,
  Eye,
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import UploadZone from '@/app/components/ui/UploadZone';
import { eventApi, photoApi, api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import RefreshAttendeeMatchesCard from '@/app/components/events/RefreshAttendeeMatchesCard';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';
import toast from 'react-hot-toast';

interface UploadProgress {
  total: number;
  uploaded: number;
  failed: number;
  currentFile: string;
  percent: number;
}

interface StudioUploaderProps {
  presetEventId?: string;
}

export default function StudioUploader({ presetEventId }: StudioUploaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] = useState(presetEventId || '');
  const [targetSubEvent, setTargetSubEvent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [dirtyCount, setDirtyCount] = useState(0);

  // Lightbox Zoom State
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  // Trash toggle state
  const [showTrash, setShowTrash] = useState(false);

  // Fetch both organized events AND assigned events
  const { data: organizedData, isLoading: orgLoading } = useQuery(
    ['studio-upload-organized-events'],
    () => eventApi.getMyOrganizedEvents(),
    { enabled: !!user }
  );

  const { data: assignedData, isLoading: assLoading } = useQuery(
    ['studio-upload-assigned-events'],
    () => eventApi.getMyAssignedEvents(),
    { enabled: !!user }
  );

  const eventsLoading = orgLoading || assLoading;

  // Combine and deduplicate events
  const events = useMemo(() => {
    const org = organizedData?.data || [];
    const ass = assignedData?.data || [];
    const map = new Map<string, any>();
    [...org, ...ass].forEach((e: any) => {
      if (e && e._id) map.set(e._id, e);
    });
    return Array.from(map.values()).sort(
      (a: any, b: any) =>
        new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
    );
  }, [organizedData?.data, assignedData?.data]);

  // Pre-select presetEventId or update when available
  useEffect(() => {
    if (presetEventId) {
      setSelectedEvent(presetEventId);
    } else if (!selectedEvent && events.length > 0) {
      setSelectedEvent(events[0]._id);
    }
  }, [presetEventId, events]);

  // Selected event metadata
  const selectedEventData = useMemo(() => {
    return events.find((e: any) => e._id === selectedEvent) || null;
  }, [events, selectedEvent]);

  // Fetch photos in selected event
  const { data: photosData, isLoading: photosLoading } = useQuery(
    ['studio-event-photos', selectedEvent, dirtyCount],
    () => eventApi.getPhotos(selectedEvent, { all: true, limit: 100 }),
    { enabled: !!selectedEvent && !showTrash }
  );

  // Fetch soft-deleted photos for trash gallery
  const { data: trashPhotosData, isLoading: trashLoading } = useQuery(
    ['studio-trash-photos', selectedEvent, dirtyCount],
    () => api.get(`/photos/event/${selectedEvent}/trash`).then(res => res.data?.data?.photos || []),
    { enabled: !!selectedEvent && showTrash }
  );

  // Handle browser exit/refresh guard during active device uploads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [uploading]);

  const activePhotos = useMemo(() => {
    return photosData?.data?.photos || [];
  }, [photosData]);

  const trashPhotos = trashPhotosData || [];
  const currentPhotos = showTrash ? trashPhotos : activePhotos;

  const currentIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return currentPhotos.findIndex(
      (p: any) => (p._id || p.imageId) === (selectedPhoto._id || selectedPhoto.imageId)
    );
  }, [selectedPhoto, currentPhotos]);

  const lightboxItems = useMemo(
    () =>
      currentPhotos.map((p: any) => ({
        image: p.url || '',
        caption: p.fileName || 'Photo',
      })),
    [currentPhotos]
  );

  const handleUpload = async () => {
    if (!selectedEvent) {
      toast.error('Please select a destination shoot first');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setUploadProgress({
      total: files.length,
      uploaded: 0,
      failed: 0,
      currentFile: '',
      percent: 0,
    });

    try {
      const result = await photoApi.uploadWithPresignedUrls(
        selectedEvent,
        files,
        (fileIndex, progress) => {
          setUploadProgress(prev =>
            prev
              ? {
                  ...prev,
                  currentFile: files[fileIndex].name,
                  percent: progress.percent,
                }
              : null
          );
        },
        (fileIndex) => {
          setUploadProgress(prev =>
            prev
              ? {
                  ...prev,
                  uploaded: prev.uploaded + 1,
                }
              : null
          );
        },
        (fileIndex, error) => {
          setUploadProgress(prev =>
            prev
              ? {
                  ...prev,
                  failed: prev.failed + 1,
                }
              : null
          );
          console.error(`Failed to upload ${files[fileIndex].name}: ${error}`);
        },
        5,
        targetSubEvent || undefined
      );

      setUploadedCount(result.successCount);
      setUploadComplete(true);
      setFiles([]);
      setDirtyCount(prev => prev + 1);

      if (result.successCount > 0) {
        toast.success(`${result.successCount} photo(s) uploaded successfully!`);
      }
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} photo(s) failed to upload`);
      }

      setTimeout(() => {
        setUploadComplete(false);
      }, 5000);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload photos');
      setUploadComplete(false);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo? It will be moved to the Trash Bin and can be restored anytime.')) {
      return;
    }

    try {
      const res = await photoApi.deletePhoto(photoId);
      if (res.success) {
        toast.success('Photo moved to Trash.');
        setDirtyCount(prev => prev + 1);
      } else {
        toast.error(res.message || 'Failed to delete photo');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  const handleRestorePhoto = async (photoId: string) => {
    try {
      const res = await api.post(`/photos/${photoId}/restore`);
      if (res.data?.success) {
        toast.success('Photo restored to gallery.');
        setDirtyCount(prev => prev + 1);
      } else {
        toast.error(res.data?.message || 'Failed to restore photo');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore photo');
    }
  };

  const handleSyncComplete = () => {
    setDirtyCount(prev => prev + 1);
  };

  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/studio" className="hover:text-zinc-900 dark:hover:text-white transition">
              Studio
            </Link>
            <ChevronRight size={14} />
            {selectedEventData ? (
              <Link href={`/studio/shoots/${selectedEvent}`} className="hover:text-zinc-900 dark:hover:text-white transition">
                {selectedEventData.name}
              </Link>
            ) : (
              <span>Uploads</span>
            )}
            <ChevronRight size={14} />
            <span className="text-violet-600 dark:text-violet-400 font-medium">Bulk Upload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Studio Batch Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Upload full-res photos with automatic on-the-fly HEIC conversion, Google Drive sync, and instant AI face indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedEvent && (
            <Link href={`/studio/shoots/${selectedEvent}`}>
              <Button
                variant="outline"
                className="rounded-xl border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-semibold"
              >
                <ArrowLeft size={14} className="mr-1.5" />
                Proofing Command Center
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Upload Panel */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm dark:border-white/[0.08] dark:bg-[#10131d]/90 dark:shadow-2xl transition-colors duration-200">
        {/* Shoot Destination Selector */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Destination Shoot
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setTargetSubEvent('');
                setFiles([]);
              }}
              disabled={eventsLoading || uploading}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="" className="bg-white dark:bg-[#141724]">Select a shoot...</option>
              {events.map((ev: any) => (
                <option key={ev._id} value={ev._id} className="bg-white dark:bg-[#141724]">
                  {ev.name} {ev.organizer === user?.id ? '(Creator)' : '(Assigned)'}
                </option>
              ))}
            </select>
            {eventsLoading && <p className="text-xs text-zinc-500 mt-2">Loading your shoots…</p>}
            {!eventsLoading && events.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No shoots found. Create a shoot first from the Studio dashboard.
              </p>
            )}

            {selectedEventData?.subEvents && selectedEventData.subEvents.length > 0 && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Target Ceremony / Sub-Event
                </label>
                <select
                  value={targetSubEvent}
                  onChange={(e) => setTargetSubEvent(e.target.value)}
                  disabled={uploading}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-[#141724]">All / Main Shoot (General)</option>
                  {selectedEventData.subEvents.map((sub: any) => (
                    <option key={sub._id || sub.name} value={sub._id} className="bg-white dark:bg-[#141724]">
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-xs text-zinc-600 dark:border-violet-500/20 dark:bg-violet-950/20 dark:text-zinc-400 flex flex-col justify-center space-y-1.5 transition-colors duration-200">
            <p className="font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Studio Pro Pipeline</span>
            </p>
            <p className="leading-relaxed">
              Photos uploaded here are immediately indexed by AI face recognition. Clients and guests can find their face matches, and shortlists sync directly with your Studio proofing dashboard.
            </p>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && uploadProgress && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-3 dark:border-violet-500/30 dark:bg-violet-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-violet-600 dark:text-violet-400 animate-spin" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm">Uploading photos securely...</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Please keep this browser window open.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 px-2.5 py-1 rounded-full">
                {uploadProgress.uploaded} / {uploadProgress.total} ({uploadProgress.percent}%)
              </span>
            </div>

            {uploadProgress.currentFile && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">Uploading: {uploadProgress.currentFile}</p>
                <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Complete Banner */}
        {uploadComplete && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex items-start gap-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                {uploadedCount} photo{uploadedCount === 1 ? '' : 's'} ingested successfully!
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Photos are safely stored and processed with AI face matching. You can now proof them or export filenames to Adobe Lightroom.
              </p>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {!uploading && (
          <div className="space-y-6">
            {selectedEvent ? (
              <>
                <UploadZone
                  onFilesSelected={setFiles}
                  maxFiles={200}
                  eventId={selectedEvent}
                  onSyncComplete={handleSyncComplete}
                />

                {/* Queue Summary & Submit Button */}
                {files.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-0.5">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {files.length} photo{files.length === 1 ? '' : 's'} queued ({formatFileSize(totalFileSize)})
                      </p>
                      <p className="text-zinc-500">Ready for high-speed cloud upload</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFiles([])}
                        className="rounded-xl border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs h-9 px-3"
                      >
                        Clear Queue
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUpload}
                        className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs h-9 px-5 shadow-lg shadow-violet-600/30"
                      >
                        <Upload size={14} className="mr-1.5" />
                        Start Ingestion ({files.length})
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Please select a shoot destination above to begin uploading photos.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Re-Index Face Matching Card */}
      {selectedEvent && (
        <RefreshAttendeeMatchesCard
          eventId={selectedEvent}
          event={selectedEventData}
          variant="dark"
        />
      )}

      {/* Shoot Photos & Trash Management */}
      {selectedEvent && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm dark:border-white/[0.08] dark:bg-[#10131d]/90 dark:shadow-2xl transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-white/[0.08] pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{showTrash ? 'Trash Bin' : 'Shoot Photos Ingested'}</span>
                <span className="rounded-full bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 px-2.5 py-0.5 text-xs font-semibold">
                  {currentPhotos.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {showTrash
                  ? 'Soft-deleted photos. Restore them to gallery or review.'
                  : 'All photos uploaded to this shoot. Click any photo to preview full size.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTrash(!showTrash)}
                className={`rounded-xl text-xs h-9 px-3.5 border transition ${
                  showTrash
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <Trash2 size={13} className="mr-1.5" />
                {showTrash ? 'View Active Photos' : 'View Trash Bin'}
              </Button>

              <Link href={`/studio/shoots/${selectedEvent}`}>
                <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs h-9 px-4 font-semibold shadow-md shadow-violet-600/25">
                  <ExternalLink size={13} className="mr-1.5" />
                  Proofing Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Photos Grid */}
          {photosLoading || trashLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400 text-xs">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500 mr-2.5" />
              Loading photos...
            </div>
          ) : currentPhotos.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              {showTrash ? 'Trash bin is empty.' : 'No photos uploaded to this shoot yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {currentPhotos.map((photo: any) => (
                <div
                  key={photo._id || photo.imageId}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.fileName || 'Photo'}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 p-2 flex flex-col justify-between">
                    <div className="flex justify-end gap-1">
                      {showTrash ? (
                        <button
                          type="button"
                          onClick={() => handleRestorePhoto(photo._id || photo.imageId)}
                          className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white transition"
                          title="Restore photo"
                        >
                          <RotateCcw size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo._id || photo.imageId)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition"
                          title="Move to Trash"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className="text-left"
                    >
                      <p className="text-[10px] text-zinc-200 truncate font-mono">
                        {photo.fileName || photo.imageId}
                      </p>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Zoom */}
      {selectedPhoto && currentIndex >= 0 && (
        <PhotoLightbox
          items={lightboxItems}
          startIndex={currentIndex}
          onIndexChange={(i) => setSelectedPhoto(currentPhotos[i])}
          onClose={() => setSelectedPhoto(null)}
          footer={
            <div className="text-white text-xs">
              <p className="font-semibold">{selectedPhoto.fileName || 'Photo'}</p>
            </div>
          }
        />
      )}
    </div>
  );
}
