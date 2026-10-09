'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
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
  Trash2
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
  const handleReviewDecision = async (
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
                          <div
                            key={p._id || idx}
                            className={`relative aspect-square rounded-xl overflow-hidden border ${
                              isRejected
                                ? 'border-red-200/60 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                                : 'bg-zinc-100 dark:bg-white/5 border-zinc-100 dark:border-white/5'
                            }`}
                          >
                            {isRejected ? (
                              <div className="h-full w-full flex flex-col items-center justify-center p-1 text-center bg-gradient-to-br from-red-50 to-zinc-100 dark:from-red-950/20 dark:to-zinc-900/40">
                                <Trash2 size={14} className="text-red-500 mb-0.5" />
                                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                  Deleted
                                </span>
                              </div>
                            ) : p.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.previewUrl}
                                alt="Thumbnail"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
                                📷
                              </div>
                            )}
                            {p.status === 'approved' && (
                              <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white shadow">
                                <Check size={8} />
                              </span>
                            )}
                          </div>
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
                  {activeGuestSubmission.photos.map((photo: any) => {
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
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-200 dark:bg-white/10 mb-3">
                          {isRejected ? (
                            <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-red-50 to-zinc-100 dark:from-red-950/20 dark:to-zinc-900/40">
                              <Trash2 size={24} className="text-red-500 mb-1.5" />
                              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                Deleted from S3
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-gray-500 mt-0.5">
                                Storage purged immediately
                              </span>
                            </div>
                          ) : photo.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.previewUrl}
                              alt="Guest Upload"
                              className="h-full w-full object-cover"
                            />
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
                              {isApproved ? '✓ Promoted to Event Pool' : '✗ Deleted from S3'}
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
      </div>
    </RoleGuard>
  );
}
