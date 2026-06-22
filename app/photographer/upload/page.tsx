'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  CheckCircle2,
  UploadCloud as CloudUpload,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
  Camera,
  Trash2,
  Clock,
  Loader2,
  Info,
  X,
  Upload,
  Eye,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import UploadZone from '@/app/components/ui/UploadZone';
import { eventApi, photoApi, api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import RefreshAttendeeMatchesCard from '@/app/components/events/RefreshAttendeeMatchesCard';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';
import toast from 'react-hot-toast';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';

interface UploadProgress {
  total: number;
  uploaded: number;
  failed: number;
  currentFile: string;
  percent: number;
}

export default function PhotographerUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PhotographerUploadContent />
    </Suspense>
  );
}

function PhotographerUploadContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  
  const [selectedEvent, setSelectedEvent] = useState('');
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

  // Fetch active photographer events
  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    ['photographer-events'],
    () => eventApi.getAll({ isActive: true, limit: 50 }),
    { enabled: !!user }
  );

  // Fetch event photos for gallery list
  const { data: photosData, isLoading: photosLoading } = useQuery(
    ['photographer-photos', selectedEvent, dirtyCount],
    () => eventApi.getPhotos(selectedEvent, { all: true, limit: 100 }),
    { enabled: !!selectedEvent && !showTrash }
  );

  // Fetch soft-deleted photos for trash gallery
  const { data: trashPhotosData, isLoading: trashLoading } = useQuery(
    ['photographer-trash-photos', selectedEvent, dirtyCount],
    () => api.get(`/photos/event/${selectedEvent}/trash`).then(res => res.data?.data?.photos || []),
    { enabled: !!selectedEvent && showTrash }
  );

  // Pre-select event from URL query parameter
  useEffect(() => {
    if (eventIdFromUrl && !selectedEvent) {
      setSelectedEvent(eventIdFromUrl);
    }
  }, [eventIdFromUrl, selectedEvent]);

  // Handle browser exit/refresh exit guard during active device uploads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = ''; // Standard browser exit popup
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

  // Handle both array response and paginated response { events: [], ... }
  const rawData = eventsData?.data;
  const allEvents = Array.isArray(rawData)
    ? rawData
    : (Array.isArray(rawData?.events) ? rawData.events : []);

  // Filter events based on user assignment
  const events = allEvents.filter((event: any) => {
    // Admin can see everything
    if (user?.roles?.includes('admin')) return true;

    const isOrganizer = event.organizer === user?.id || event.organizer?._id === user?.id;
    const isPhotographer = event.photographers?.some((p: any) =>
      (typeof p === 'string' ? p === user?.id : p._id === user?.id)
    );

    return isOrganizer || isPhotographer;
  });

  const selectedEventData =
    selectedEvent && events.length > 0
      ? events.find((ev: { _id?: string }) => ev._id === selectedEvent) ?? null
      : null;

  // Active photos uploaded by this photographer
  const activePhotos = useMemo(() => {
    const all = photosData?.data?.photos || [];
    return all.filter((p: any) => {
      const uploaderId = p.uploadedBy?._id || p.uploadedBy;
      return uploaderId === user?.id;
    });
  }, [photosData, user?.id]);

  // Soft-deleted photos in the trash
  const trashPhotos = trashPhotosData || [];

  // Determine current active photos in display grid (active vs trash)
  const currentPhotos = showTrash ? trashPhotos : activePhotos;

  // Next / Prev Lightbox Logic
  const currentIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return currentPhotos.findIndex((p: any) => (p._id === selectedPhoto._id || p.imageId === selectedPhoto.imageId));
  }, [selectedPhoto, currentPhotos]);

  const handleNextPhoto = useMemo(() => {
    if (currentIndex !== -1 && currentIndex < currentPhotos.length - 1) {
      return () => setSelectedPhoto(currentPhotos[currentIndex + 1]);
    }
    return undefined;
  }, [currentIndex, currentPhotos]);

  const handlePrevPhoto = useMemo(() => {
    if (currentIndex > 0) {
      return () => setSelectedPhoto(currentPhotos[currentIndex - 1]);
    }
    return undefined;
  }, [currentIndex, currentPhotos]);

  const handleUpload = async () => {
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
          setUploadProgress(prev => prev ? {
            ...prev,
            currentFile: files[fileIndex].name,
            percent: progress.percent,
          } : null);
        },
        (fileIndex) => {
          setUploadProgress(prev => prev ? {
            ...prev,
            uploaded: prev.uploaded + 1,
          } : null);
        },
        (fileIndex, error) => {
          setUploadProgress(prev => prev ? {
            ...prev,
            failed: prev.failed + 1,
          } : null);
          console.error(`Failed to upload ${files[fileIndex].name}: ${error}`);
        }
      );

      setUploadedCount(result.successCount);
      setUploadComplete(true);
      setFiles([]); // Clear local preview list
      setDirtyCount(prev => prev + 1); // Refresh photo gallery list

      if (result.successCount > 0) {
        toast.success(`${result.successCount} photo(s) uploaded successfully!`);
      }
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} photo(s) failed to upload`);
      }

      // Automatically hide upload success screen after 4 seconds
      setTimeout(() => {
        setUploadComplete(false);
      }, 4000);

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
    if (!confirm('Are you sure you want to delete this photo uploaded by you? It will be soft-deleted and placed in your event Trash Bin.')) {
      return;
    }

    try {
      const res = await photoApi.deletePhoto(photoId);
      if (res.success) {
        toast.success('Photo moved to Trash successfully.');
        setDirtyCount(prev => prev + 1); // Refresh gallery list
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
        toast.success('Photo recovered successfully.');
        setDirtyCount(prev => prev + 1); // Refresh gallery list
      } else {
        toast.error(res.data?.message || 'Failed to restore photo');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore photo');
    }
  };

  const handleSyncComplete = () => {
    setDirtyCount(prev => prev + 1); // Refresh gallery list
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111111] rounded-2xl p-8 border border-white/10 text-center shadow-2xl">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400 mb-6">
            Photographers need to be authenticated before uploading to the RAW S3 bucket.
          </p>
          <Link href="/login">
            <Button className="w-full btn-gradient">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full w-fit mb-4 border border-violet-500/20">
              <Camera className="h-4 w-4" />
              Photographer Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Bulk Ingest Workspace</h1>
            <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">
              Drop full-size shots (JPG/PNG/WEBP/HEIC), leverage automatic local conversion, sync from Google Photos or Drive shared folders, and let AWS Lambda + Rekognition process them instantly.
            </p>
          </div>
          <Link 
            href="/photographer" 
            className="hidden sm:inline-flex items-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Pipeline checklist */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
              <p className="font-semibold text-white">S3 Stream Ingest</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Pushes full-res photos directly into the raw ingestion bucket with strict photographer uploader metadata.
            </p>
          </div>
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-violet-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <p className="font-semibold text-white">Automatic HEIC Conversion</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              HEIC and HEIF shot formats from modern mobile devices are converted to JPEG locally on the fly.
            </p>
          </div>
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Drive / Google Photos</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Import folders straight from Google Drive shared links or Google Photos albums directly into the pipeline.
            </p>
          </div>
        </div>

        {/* Event selection and upload zone */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 md:p-8 space-y-6">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Choose event destination
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  setFiles([]); // Clear queue when event changes
                }}
                className="w-full p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 bg-white/5 text-white transition-all outline-none"
                disabled={eventsLoading || uploading}
              >
                <option value="" className="bg-[#1a1a1a]">Select an event...</option>
                {events.map((event: any) => (
                  <option key={event._id} value={event._id} className="bg-[#1a1a1a]">
                    {event.name}
                  </option>
                ))}
              </select>
              {eventsLoading && <p className="text-sm text-gray-500 mt-3">Loading assigned events…</p>}
              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-amber-400 mt-3">
                  No active events assigned. Ask an organizer to add you as a photographer.
                </p>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col justify-center">
              <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-violet-400" />
                Pipeline Integration Notes
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Organizers see all public uploads. Face matches map straight to registered guest portfolios. Photographers can manage and delete their own uploads below.
              </p>
            </div>
          </div>

          {/* Upload Progress Overlay */}
          {uploading && uploadProgress && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Uploading photos to S3 RAW...</p>
                    <p className="text-xs text-gray-400">Please do not close this window.</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-violet-300">
                  {uploadProgress.uploaded} of {uploadProgress.total} uploaded
                </span>
              </div>

              {uploadProgress.currentFile && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-300 truncate">Current file: {uploadProgress.currentFile}</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Complete Summary */}
          {uploadComplete && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 animate-scale-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-300 text-lg">
                    {uploadedCount} {uploadedCount === 1 ? 'photo' : 'photos'} uploaded successfully
                  </p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Ingested into raw S3 bucket. Lambda matching workers are now indexing faces and parsing moderation limits. Scroll down to monitor match status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Upload Box */}
          {!uploading && (
            <div>
              {selectedEvent ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-violet-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Select Photos</h2>
                  </div>

                  <UploadZone
                    onFilesSelected={setFiles}
                    maxFiles={100}
                    eventId={selectedEvent}
                    onSyncComplete={handleSyncComplete}
                  />

                  {files.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={16} className="text-violet-400" />
                          <span className="text-sm text-gray-300">
                            <span className="text-white font-semibold">{files.length}</span> photos selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CloudUpload size={16} className="text-indigo-400" />
                          <span className="text-sm text-gray-300">
                            <span className="text-white font-semibold">{formatFileSize(totalFileSize)}</span> total size
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setFiles([])}
                          className="text-gray-400 hover:text-white"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleUpload}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/20"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center bg-white/5 hover:border-violet-500/30 transition-all">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <CloudUpload className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-white font-medium mb-2">Select an assigned event to start uploading</p>
                  <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
                    Choose an event from the destination dropdown to reveal the upload box and view your previously uploaded pictures.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg w-fit mx-auto border border-amber-500/20">
                    <Zap className="h-4 w-4" />
                    <span>Upload limit is 100 files per batch (20MB size cap).</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedEvent && selectedEventData && (
            <RefreshAttendeeMatchesCard eventId={selectedEvent} event={selectedEventData} variant="dark" />
          )}
        </div>

        {/* Scoped "Your Uploads" Photo Gallery */}
        {selectedEvent && (
          <section className={`p-6 md:p-8 ${softSurface}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/10">
                  <ImageIcon className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {showTrash ? 'Your Trash Bin (Deleted Photos)' : 'Your Uploads in this Event'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {showTrash 
                      ? 'Deleted photos will be permanently removed after the event retention period.' 
                      : 'Active photos uploaded by your photographer account.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTrash(!showTrash)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showTrash 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-md' 
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {showTrash ? 'View Active Uploads' : '🗑️ Open Trash Bin'}
                </button>

                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300">
                  {showTrash ? trashPhotos.length : activePhotos.length} photo{ (showTrash ? trashPhotos.length : activePhotos.length) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Gallery Loading state */}
            {(showTrash ? trashLoading : photosLoading) ? (
              <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <span>{showTrash ? 'Loading Trash Bin…' : 'Loading your uploaded photos…'}</span>
              </div>
            ) : currentPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
                {currentPhotos.map((photo: any) => (
                  <div
                    key={photo._id || photo.imageId}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-violet-500/30 transition-all duration-300 shadow-sm hover:shadow-lg"
                  >
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1 leading-tight">
                        <p className="text-xs font-medium text-white truncate">{photo.fileName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {photo.uploadedAt || photo.deletedAt ? new Date(photo.uploadedAt || photo.deletedAt).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    {/* Matching Confidence Badge */}
                    {!showTrash && photo.matchedUsers && photo.matchedUsers.length > 0 && (
                      <div className="absolute top-3 left-3 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-sm text-emerald-100 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Matched</span>
                      </div>
                    )}

                    {/* Official Stamp */}
                    {!showTrash && photo.isOfficial && (
                      <div className="absolute top-3 left-3 bg-violet-500/25 border border-violet-400/40 backdrop-blur-sm text-violet-100 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-md">
                        <Sparkles className="h-3 w-3 text-violet-300" />
                        <span>Official</span>
                      </div>
                    )}

                    {/* Hover controls overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {/* Zoom View Icon */}
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-violet-600 hover:scale-110 shadow-md transition-all"
                        title="Zoom view"
                      >
                        <Eye size={13} />
                      </button>

                      {showTrash ? (
                        /* Restore Icon in Trash Mode */
                        <button
                          onClick={() => handleRestorePhoto(photo._id || photo.imageId)}
                          className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-emerald-500 hover:scale-110 shadow-md transition-all"
                          title="Restore photo to active downloads"
                        >
                          <RotateCcw size={13} className="text-white" />
                        </button>
                      ) : (
                        /* Delete Icon in Active Mode */
                        <button
                          onClick={() => handleDeletePhoto(photo._id || photo.imageId)}
                          className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-red-500 hover:scale-110 shadow-md transition-all"
                          title="Delete photo uploaded by mistake"
                        >
                          <Trash2 size={13} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.02] py-16 text-center text-gray-400 border border-white/5 mt-6">
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="font-semibold text-white mb-1">
                  {showTrash ? 'Trash Bin is empty' : 'No uploads in this event yet'}
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {showTrash 
                    ? 'Photos you delete will appear here, and can be recovered within the event retention window.'
                    : 'Drag and drop files in the workspace above to sync photos. They will appear here once processed.'}
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Lightbox Zoom Render */}
      {selectedPhoto && (
        <PhotoLightbox
          imageSrc={selectedPhoto.url}
          imageAlt={selectedPhoto.fileName || 'Photo'}
          onClose={() => setSelectedPhoto(null)}
          onNext={handleNextPhoto}
          onPrev={handlePrevPhoto}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 w-full">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-white">
                  {selectedPhoto.fileName}
                </h3>
                <p className="truncate text-xs text-gray-400">
                  {selectedPhoto.uploadedAt || selectedPhoto.deletedAt 
                    ? `Ingested: ${new Date(selectedPhoto.uploadedAt || selectedPhoto.deletedAt).toLocaleString()}` 
                    : 'Just now'}
                </p>
              </div>
              <div className="flex gap-2">
                {showTrash ? (
                  <button
                    onClick={() => {
                      handleRestorePhoto(selectedPhoto._id || selectedPhoto.imageId);
                      setSelectedPhoto(null);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-500"
                  >
                    <RotateCcw size={14} />
                    Restore Photo
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleDeletePhoto(selectedPhoto._id || selectedPhoto.imageId);
                      setSelectedPhoto(null);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-lg transition hover:bg-red-500"
                  >
                    <Trash2 size={14} />
                    Delete Photo
                  </button>
                )}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
