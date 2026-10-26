'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Tv,
  CheckCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Phone,
  Shield,
  Eye,
  Calendar,
  AlertTriangle,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, guestSubmissionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessEventManagePage } from '@/lib/eventPermissions';
import RoleGuard from '@/app/components/RoleGuard';

export default function EventSubmissionsReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalGuests: 0, totalPendingPhotos: 0, totalApprovedPhotos: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  // Selected Guest Review Drawer / Modal State
  const [activeGuestSubmission, setActiveGuestSubmission] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);

  // Per-photo live wall feature selections for current active guest
  const [liveWallSelections, setLiveWallSelections] = useState<Record<string, boolean>>({});

  // Full-screen photo review lightbox state
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const [eventRes, subsRes] = await Promise.all([
        eventApi.getById(eventId),
        guestSubmissionsApi.getEventSubmissions(eventId),
      ]);

      const eventData = (eventRes as any)?.data || eventRes;
      setEvent(eventData);

      if (subsRes.success && subsRes.data) {
        const subs = subsRes.data.submissions || [];
        setSubmissions(subs);
        setSummary(subsRes.data.summary || {});
        return subs;
      }
      return [];
    } catch (err: any) {
      console.error('Failed to load guest submissions:', err);
      toast.error('Failed to load guest submissions desk');
      return [];
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canAccess = useMemo(() => {
    if (!event || !user) return false;
    return canAccessEventManagePage(user, event);
  }, [event, user]);

  const displayedSubmissions = useMemo(() => {
    if (filter === 'pending') {
      return submissions.filter((s) => s.pendingCount > 0);
    }
    return submissions;
  }, [submissions, filter]);

  // Handle single photo or batch decisions with optimistic updates (no jarring reload)
  const handleReviewDecision = useCallback(
    async (
      targetSubmissionId: string,
      decisions: Array<{
        photoId: string;
        action: 'approve' | 'reject';
        featureOnLiveWall?: boolean;
      }>
    ) => {
      setReviewing(true);

      // 1. Optimistic instant local state update to prevent photo flickering/reloading
      const decisionMap = new Map(decisions.map((d) => [d.photoId, d]));

      const updatePhotosList = (photos: any[]) =>
        photos.map((p) => {
          const d = decisionMap.get(p._id);
          if (!d) return p;
          return {
            ...p,
            status: d.action === 'approve' ? 'approved' : 'rejected',
            isLiveWallFeatured: d.featureOnLiveWall ?? p.isLiveWallFeatured ?? false,
            previewUrl: d.action === 'reject' ? '' : p.previewUrl,
          };
        });

      setSubmissions((prev) =>
        prev.map((sub) => {
          const hasMatch = sub.photos.some((p: any) => decisionMap.has(p._id));
          if (!hasMatch) return sub;

          const updatedPhotos = updatePhotosList(sub.photos);
          const pendingCount = updatedPhotos.filter((p: any) => p.status === 'pending').length;
          const approvedCount = updatedPhotos.filter((p: any) => p.status === 'approved').length;
          const rejectedCount = updatedPhotos.filter((p: any) => p.status === 'rejected').length;

          return {
            ...sub,
            photos: updatedPhotos,
            pendingCount,
            approvedCount,
            rejectedCount,
          };
        })
      );

      if (activeGuestSubmission) {
        setActiveGuestSubmission((prev: any) => {
          if (!prev) return null;
          const updatedPhotos = updatePhotosList(prev.photos);
          const pendingCount = updatedPhotos.filter((p: any) => p.status === 'pending').length;
          return {
            ...prev,
            photos: updatedPhotos,
            pendingCount,
          };
        });
      }

      try {
        const submissionId = targetSubmissionId;
        const res = await guestSubmissionsApi.reviewPhotos(eventId, submissionId, {
          photoDecisions: decisions,
        });

        if (res.success) {
          toast.success(
            decisions.length === 1
              ? `Photo ${decisions[0].action}d successfully`
              : `Reviewed ${decisions.length} photos successfully`
          );
        } else {
          toast.error(res.message || 'Failed to apply review decision');
          await fetchData();
        }
      } catch (err: any) {
        console.error('Review action failed:', err);
        toast.error(err.response?.data?.message || 'Error updating photo status');
        await fetchData();
      } finally {
        setReviewing(false);
      }
    },
    [eventId, activeGuestSubmission, fetchData]
  );

  // Lightbox active photo derived
  const activeReviewPhoto = useMemo(() => {
    if (!activeGuestSubmission || fullscreenPhotoIndex === null) return null;
    return activeGuestSubmission.photos?.[fullscreenPhotoIndex] ?? null;
  }, [activeGuestSubmission, fullscreenPhotoIndex]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(4, +(prev + 0.5).toFixed(1)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Reset zoom & pan when active photo changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [fullscreenPhotoIndex]);

  // Body scroll lock when fullscreen lightbox is open
  useEffect(() => {
    if (fullscreenPhotoIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [fullscreenPhotoIndex]);

  const handlePrevPhoto = useCallback(() => {
    if (fullscreenPhotoIndex === null || !activeGuestSubmission) return;
    setFullscreenPhotoIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : activeGuestSubmission.photos.length - 1
    );
  }, [fullscreenPhotoIndex, activeGuestSubmission]);

  const handleNextPhoto = useCallback(() => {
    if (fullscreenPhotoIndex === null || !activeGuestSubmission) return;
    setFullscreenPhotoIndex((prev) =>
      prev !== null && prev < activeGuestSubmission.photos.length - 1 ? prev + 1 : 0
    );
  }, [fullscreenPhotoIndex, activeGuestSubmission]);

  const handleFullscreenApprove = useCallback(async () => {
    if (!activeReviewPhoto || !activeGuestSubmission || reviewing) return;
    const isFeatured = liveWallSelections[activeReviewPhoto._id] ?? activeReviewPhoto.isLiveWallFeatured ?? false;
    await handleReviewDecision(activeReviewPhoto.submissionId || activeGuestSubmission._id, [
      {
        photoId: activeReviewPhoto._id,
        action: 'approve',
        featureOnLiveWall: isFeatured,
      },
    ]);
    if (fullscreenPhotoIndex !== null && fullscreenPhotoIndex < activeGuestSubmission.photos.length - 1) {
      setFullscreenPhotoIndex((prev) => (prev !== null ? prev + 1 : null));
    }
  }, [activeReviewPhoto, activeGuestSubmission, reviewing, liveWallSelections, fullscreenPhotoIndex, handleReviewDecision]);

  const handleFullscreenReject = useCallback(async () => {
    if (!activeReviewPhoto || !activeGuestSubmission || reviewing) return;
    await handleReviewDecision(activeReviewPhoto.submissionId || activeGuestSubmission._id, [
      {
        photoId: activeReviewPhoto._id,
        action: 'reject',
      },
    ]);
    if (fullscreenPhotoIndex !== null && fullscreenPhotoIndex < activeGuestSubmission.photos.length - 1) {
      setFullscreenPhotoIndex((prev) => (prev !== null ? prev + 1 : null));
    }
  }, [activeReviewPhoto, activeGuestSubmission, reviewing, fullscreenPhotoIndex, handleReviewDecision]);

  useEffect(() => {
    if (fullscreenPhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        setFullscreenPhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'a' || e.key === 'A') {
        handleFullscreenApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        handleFullscreenReject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    fullscreenPhotoIndex,
    handlePrevPhoto,
    handleNextPhoto,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFullscreenApprove,
    handleFullscreenReject,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDoubleClick = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2.5);
    } else {
      handleResetZoom();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading || authLoading) {
    return (
      <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-500 dark:text-gray-400">Loading guest submissions desk...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!canAccess) {
    return (
      <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
        <div className="mx-auto max-w-lg py-16 text-center">
          <Shield className="mx-auto h-12 w-12 text-zinc-400 dark:text-gray-500 mb-3" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-gray-400">
            Only the event organizer and assigned photographers can review guest submissions.
          </p>
          <Link
            href={`/events/${eventId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500"
          >
            <ChevronLeft size={16} />
            Back to Event
          </Link>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/events/${eventId}/manage`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ChevronLeft size={14} />
                Back to Manage Event
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              <span>Guest Photo Review Desk</span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                {summary.totalPendingPhotos} Pending
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
              Review and curate guest-submitted photos grouped by attendee to easily eliminate duplicate bursts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-zinc-200/90 bg-white text-zinc-600 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white transition-colors"
              title="Refresh submissions"
            >
              <RefreshCw size={16} />
            </button>
            <Link
              href={`/events/${eventId}/live-wall`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-50 px-3.5 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300"
            >
              <Tv size={14} />
              Open Live Wall
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0f0c18]">
            <p className="text-xs font-medium text-zinc-500 dark:text-gray-400">Total Contributing Guests</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{summary.totalGuests || 0}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0f0c18]">
            <p className="text-xs font-medium text-zinc-500 dark:text-gray-400">Photos Awaiting Review</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.totalPendingPhotos || 0}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#0f0c18]">
            <p className="text-xs font-medium text-zinc-500 dark:text-gray-400">Approved to Pool</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.totalApprovedPhotos || 0}</p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-gray-400">Showing:</span>
          <div className="flex rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-0.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'pending'
                  ? 'bg-white shadow-sm text-violet-700 dark:bg-white/15 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Needs Review ({summary.totalPendingPhotos})
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-white shadow-sm text-violet-700 dark:bg-white/15 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              All Guests ({submissions.length})
            </button>
          </div>
        </div>

        {/* Guest-Centric Submissions Grid */}
        {displayedSubmissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
              <Users className="h-8 w-8 text-zinc-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {filter === 'pending' ? 'All Guest Submissions Reviewed!' : 'No Guest Photos Submitted Yet'}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400 max-w-md mx-auto">
              When guests upload pictures from their phone, they will appear here grouped by person so you can compare and curate the best ones.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedSubmissions.map((sub: any) => {
              const pendingPhotos = sub.photos.filter((p: any) => p.status === 'pending');
              const approvedPhotos = sub.photos.filter((p: any) => p.status === 'approved');

              return (
                <div
                  key={sub._id}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-white/5 dark:bg-[#0f0c18] dark:hover:border-violet-500/20"
                >
                  <div>
                    {/* Guest Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white shadow-sm text-base">
                          {sub.guest.name?.charAt(0).toUpperCase() || 'G'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                            {sub.guest.name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-gray-400 font-mono">
                            <Phone size={10} />
                            +91 {sub.guest.phone?.slice(-10)}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        sub.pendingCount > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                      }`}>
                        {sub.pendingCount > 0 ? `${sub.pendingCount} pending` : 'Reviewed'}
                      </span>
                    </div>

                    {/* Photo Thumbnails Preview */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {sub.photos.slice(0, 4).map((p: any, idx: number) => {
                        const isRejected = p.status === 'rejected';
                        return (
                          <button
                            key={p._id || idx}
                            type="button"
                            onClick={() => {
                              setActiveGuestSubmission(sub);
                              if (!isRejected && p.previewUrl) {
                                setFullscreenPhotoIndex(idx);
                              }
                            }}
                            className={`group relative aspect-square rounded-xl overflow-hidden border text-left transition-all ${
                              isRejected
                                ? 'border-red-200/60 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5 cursor-not-allowed'
                                : 'bg-zinc-100 dark:bg-white/5 border-zinc-100 dark:border-white/5 hover:border-violet-400 hover:shadow-md cursor-pointer'
                            }`}
                            title={isRejected ? 'Photo deleted' : 'Click to inspect in full screen'}
                          >
                            {isRejected ? (
                              <div className="h-full w-full flex flex-col items-center justify-center p-1 text-center bg-gradient-to-br from-red-50 to-zinc-100 dark:from-red-950/20 dark:to-zinc-900/40">
                                <Trash2 size={14} className="text-red-500 mb-0.5" />
                                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                  Deleted
                                </span>
                              </div>
                            ) : p.previewUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.previewUrl}
                                  alt="Thumbnail"
                                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 size={14} className="text-white drop-shadow" />
                                </div>
                              </>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
                                <ImageIcon size={14} />
                              </div>
                            )}
                            {p.status === 'approved' && (
                              <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white shadow">
                                <Check size={8} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveGuestSubmission(sub)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                    >
                      <Eye size={13} />
                      <span>Compare & Review ({sub.photos.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Guest Side-by-Side Comparison Review Modal */}
        {activeGuestSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f0c18]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Reviewing: {activeGuestSubmission.guest.name}
                    </h3>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      +91 {activeGuestSubmission.guest.phone?.slice(-10)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
                    Compare duplicate shots and approve the best ones into the Event Pool or Live Wall.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGuestSubmission(null)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Photos Comparison Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {activeGuestSubmission.photos.map((photo: any, idx: number) => {
                    const isPending = photo.status === 'pending';
                    const isApproved = photo.status === 'approved';
                    const isRejected = photo.status === 'rejected';
                    const isFeatured = liveWallSelections[photo._id] ?? photo.isLiveWallFeatured ?? false;

                    return (
                      <div
                        key={photo._id}
                        className={`flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                          isApproved
                            ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                            : isRejected
                            ? 'border-red-200 bg-red-50/20 opacity-60 dark:border-red-500/20 dark:bg-red-500/5'
                            : 'border-zinc-200 bg-zinc-50/50 hover:border-violet-300 dark:border-white/10 dark:bg-white/5'
                        }`}
                      >
                        <div
                          className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-200 dark:bg-white/10 mb-3 group ${
                            !isRejected && photo.previewUrl ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (!isRejected && photo.previewUrl) {
                              setFullscreenPhotoIndex(idx);
                            }
                          }}
                          title={!isRejected && photo.previewUrl ? 'Click to inspect in full screen (Zoom & Pan)' : undefined}
                        >
                          {isRejected ? (
                            <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-red-50 to-zinc-100 dark:from-red-950/20 dark:to-zinc-900/40">
                              <Trash2 size={24} className="text-red-500 mb-1.5" />
                              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                Permanently Deleted
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-gray-500 mt-0.5">
                                Storage cleared immediately
                              </span>
                            </div>
                          ) : photo.previewUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.previewUrl}
                                alt="Guest Upload"
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-white/20">
                                  <Maximize2 size={13} />
                                  <span>Full Screen & Zoom</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                              Loading preview...
                            </div>
                          )}

                          {/* Status Badge */}
                          <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-600 text-white'
                              : isRejected
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}>
                            {photo.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Controls */}
                        {isPending ? (
                          <div className="space-y-2">
                            {/* Live Wall Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-gray-300 select-none">
                              <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) =>
                                  setLiveWallSelections((prev) => ({
                                    ...prev,
                                    [photo._id]: e.target.checked,
                                  }))
                                }
                                className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                              />
                              <span className="flex items-center gap-1 text-[11px]">
                                <Tv size={12} className="text-violet-500" />
                                Feature on Live Wall
                              </span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={reviewing}
                                onClick={() =>
                                  handleReviewDecision(photo.submissionId || activeGuestSubmission._id, [
                                    {
                                      photoId: photo._id,
                                      action: 'approve',
                                      featureOnLiveWall: isFeatured,
                                    },
                                  ])
                                }
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={reviewing}
                                onClick={() =>
                                  handleReviewDecision(photo.submissionId || activeGuestSubmission._id, [
                                    { photoId: photo._id, action: 'reject' },
                                  ])
                                }
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-white py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 transition-colors disabled:opacity-50"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <span className="text-[11px] font-semibold text-zinc-500 dark:text-gray-400">
                              {isApproved ? '✓ Promoted to Event Pool' : '✗ Permanently Deleted'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Bulk Actions */}
              <div className="flex items-center justify-between border-t border-zinc-100 p-4 bg-zinc-50/50 dark:border-white/5 dark:bg-[#0c0a14]">
                <span className="text-xs text-zinc-500 dark:text-gray-400">
                  {activeGuestSubmission.pendingCount} photos pending for this guest
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={reviewing || activeGuestSubmission.pendingCount === 0}
                    onClick={() => {
                      const pending = activeGuestSubmission.photos.filter((p: any) => p.status === 'pending');
                      const decisions = pending.map((p: any) => ({
                        photoId: p._id,
                        action: 'approve' as const,
                        featureOnLiveWall: liveWallSelections[p._id] || false,
                      }));
                      handleReviewDecision(activeGuestSubmission._id, decisions);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    <CheckCheck size={14} />
                    <span>Approve All Pending ({activeGuestSubmission.pendingCount})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Review Lightbox with Zoom, Pan, and Rapid Review */}
        {mounted && fullscreenPhotoIndex !== null && activeGuestSubmission && activeReviewPhoto && createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md text-white select-none animate-fade-in">
            {/* Lightbox Top Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
              {/* Left: Guest info & photo index */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 font-bold text-white text-sm shadow-md">
                  {activeGuestSubmission.guest.name?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white">
                      {activeGuestSubmission.guest.name}
                    </span>
                    <span className="text-xs text-white/60 font-mono hidden sm:inline">
                      +91 {activeGuestSubmission.guest.phone?.slice(-10)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span>
                      Photo {fullscreenPhotoIndex + 1} of {activeGuestSubmission.photos.length}
                    </span>
                    <span>•</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        activeReviewPhoto.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : activeReviewPhoto.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {activeReviewPhoto.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Zoom Controls */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  title="Zoom Out (-)"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={zoomLevel === 1 ? () => setZoomLevel(2) : handleResetZoom}
                  title="Click to toggle 100% / 200%"
                  className="px-2 py-0.5 text-xs font-mono font-semibold text-white/90 hover:text-white transition-colors"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  title="Zoom In (+)"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="h-4 w-px bg-white/20 mx-0.5 sm:mx-1" />
                <button
                  type="button"
                  onClick={handleResetZoom}
                  disabled={zoomLevel === 1 && panPosition.x === 0 && panPosition.y === 0}
                  title="Reset Zoom & Pan (0)"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* Right: Close button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFullscreenPhotoIndex(null)}
                  title="Close Full Screen (Esc)"
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox Center Stage (Canvas) */}
            <div
              className="relative flex-1 overflow-hidden flex items-center justify-center"
              onWheel={handleWheel}
              onMouseDown={(e) => {
                if (zoomLevel > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && zoomLevel > 1) {
                  setPanPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                if (e.touches.length === 1 && zoomLevel > 1) {
                  setIsDragging(true);
                  setDragStart({
                    x: e.touches[0].clientX - panPosition.x,
                    y: e.touches[0].clientY - panPosition.y,
                  });
                }
              }}
              onTouchMove={(e) => {
                if (isDragging && e.touches.length === 1 && zoomLevel > 1) {
                  setPanPosition({
                    x: e.touches[0].clientX - dragStart.x,
                    y: e.touches[0].clientY - dragStart.y,
                  });
                }
              }}
              onTouchEnd={() => setIsDragging(false)}
            >
              {/* Prev / Next navigation buttons */}
              {activeGuestSubmission.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPhoto();
                    }}
                    title="Previous Photo (Left Arrow)"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-xl"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPhoto();
                    }}
                    title="Next Photo (Right Arrow)"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-xl"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image Stage */}
              {activeReviewPhoto.status === 'rejected' ? (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                  <div className="h-16 w-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Photo Rejected & Deleted</h3>
                  <p className="text-sm text-white/60">
                    This photo was rejected and permanently removed from cloud storage.
                  </p>
                </div>
              ) : activeReviewPhoto.previewUrl ? (
                <div
                  className={`relative max-h-full max-w-full flex items-center justify-center transition-transform ${
                    isDragging ? 'duration-0' : 'duration-150'
                  }`}
                  style={{
                    transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomLevel})`,
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  }}
                  onDoubleClick={handleDoubleClick}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeReviewPhoto.previewUrl}
                    alt={activeReviewPhoto.originalName || 'Guest Full Resolution Photo'}
                    className="max-h-[70vh] max-w-[88vw] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/50">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                  <p className="text-sm">Loading full resolution image...</p>
                </div>
              )}

              {/* Zoom / Pan Help Hint */}
              {zoomLevel > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] text-white/80 border border-white/10 shadow-lg">
                  Click and drag to pan • Double-click to reset zoom
                </div>
              )}
            </div>

            {/* Lightbox Bottom Tray (Filmstrip + Actions) */}
            <div className="border-t border-white/10 bg-black/60 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-col gap-3">
              {/* Filmstrip of this guest's photos */}
              {activeGuestSubmission.photos.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {activeGuestSubmission.photos.map((p: any, idx: number) => {
                    const isSelected = idx === fullscreenPhotoIndex;
                    const isRej = p.status === 'rejected';
                    return (
                      <button
                        key={p._id || idx}
                        type="button"
                        onClick={() => setFullscreenPhotoIndex(idx)}
                        className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          isSelected
                            ? 'border-violet-500 scale-105 shadow-lg shadow-violet-500/20'
                            : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                        }`}
                        title={p.originalName || `Photo ${idx + 1}`}
                      >
                        {isRej ? (
                          <div className="h-full w-full bg-red-950/40 flex items-center justify-center">
                            <Trash2 size={12} className="text-red-400" />
                          </div>
                        ) : p.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-white/5 flex items-center justify-center">
                            <ImageIcon size={12} className="text-white/40" />
                          </div>
                        )}
                        {p.status === 'approved' && (
                          <span className="absolute bottom-0.5 right-0.5 rounded-full bg-emerald-500 p-0.5 text-white">
                            <Check size={8} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Review Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Left: Metadata */}
                <div className="flex items-center gap-3 text-xs text-white/60">
                  {activeReviewPhoto.originalName && (
                    <span className="truncate max-w-[200px]" title={activeReviewPhoto.originalName}>
                      {activeReviewPhoto.originalName}
                    </span>
                  )}
                  {activeReviewPhoto.fileSize && (
                    <span>{formatFileSize(activeReviewPhoto.fileSize)}</span>
                  )}
                  {activeReviewPhoto.width && activeReviewPhoto.height && (
                    <span>{activeReviewPhoto.width} × {activeReviewPhoto.height}</span>
                  )}
                </div>

                {/* Right: Live Wall & Action buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Live Wall Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white/90 select-none bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={liveWallSelections[activeReviewPhoto._id] ?? activeReviewPhoto.isLiveWallFeatured ?? false}
                      onChange={(e) =>
                        setLiveWallSelections((prev) => ({
                          ...prev,
                          [activeReviewPhoto._id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Tv size={14} className="text-violet-400" />
                      <span>Feature on Live Wall</span>
                    </span>
                  </label>

                  {/* Reject Button */}
                  <button
                    type="button"
                    disabled={reviewing || activeReviewPhoto.status === 'rejected'}
                    onClick={handleFullscreenReject}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-40"
                    title="Reject & Delete (Press R)"
                  >
                    <X size={14} />
                    <span>Reject</span>
                    <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[9px] font-mono bg-white/10 rounded">R</kbd>
                  </button>

                  {/* Approve Button */}
                  <button
                    type="button"
                    disabled={reviewing || activeReviewPhoto.status === 'approved'}
                    onClick={handleFullscreenApprove}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-colors disabled:opacity-40"
                    title="Approve to Event Pool (Press A)"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                    <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[9px] font-mono bg-white/20 rounded">A</kbd>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </RoleGuard>
  );
}
