'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Users,
    Image as ImageIcon,
    Clock,
    Share2,
    Download,
    ChevronLeft,
    User,
    Sparkles,
    Camera,
    Lock,
    EyeOff,
    Check,
    UserCheck,
    Loader2,
    KeyRound,
    X,
    Tv
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, photoApi } from '@/lib/api';
import {
    fetchAllEventPhotos,
    fetchAllMyPhotos,
    normalizeEventPhotosPayload,
} from '@/lib/photoFetch';
import { buildEventShareText } from '@/lib/eventShareText';
import { getPhotoDisplayUrl } from '@/lib/photoUrl';
import { Button } from '@/app/components/ui/Button';
import Pagination from '@/app/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useQueryClient } from 'react-query';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';
import JoinEventModal from '@/app/components/student/JoinEventModal';
import PostJoinSelfieModal from '@/app/components/events/PostJoinSelfieModal';

const PHOTOS_PER_PAGE = 12;
const PREVIEW_PHOTO_COUNT = 4;

/** Up to 2 retries on 429; one retry otherwise. */
function reactQueryRetry(failureCount: number, error: unknown): boolean {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 429) return failureCount < 2;
    return failureCount < 1;
}

/** Total gallery size from GET /events/:id/photos envelope (if API sends it). */
function extractTotalFromPhotosApi(res: any): number | undefined {
    if (!res || typeof res !== 'object') return undefined;
    const tryNum = (v: unknown) =>
        typeof v === 'number' && !Number.isNaN(v) && v >= 0 ? v : undefined;

    const d = res.data;
    const candidates: unknown[] = [
        res.total,
        res.totalCount,
        res.count,
        d?.total,
        d?.totalCount,
        d?.count,
        typeof d === 'object' && d && 'pagination' in d
            ? (d as { pagination?: { total?: number } }).pagination?.total
            : undefined,
        res.pagination?.total,
    ];
    for (const c of candidates) {
        const n = tryNum(c);
        if (n !== undefined) return n;
    }
    return undefined;
}

export default function PublicEventPage() {
    const { user: currentUser } = useAuth();
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const eventId = params?.eventId as string;

    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [photoViewMode, setPhotoViewMode] = useState<'all' | 'my'>('all');
    const [joining, setJoining] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [showPostJoinSelfieModal, setShowPostJoinSelfieModal] = useState(false);
    const [isScanningUpdatedSelfie, setIsScanningUpdatedSelfie] = useState(false);
    const loadUser = useAuthStore((state) => state.loadUser);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const raw = sessionStorage.getItem('justUpdatedSelfie');
            if (raw) {
                const elapsed = Date.now() - parseInt(raw, 10);
                if (elapsed < 45000) {
                    setIsScanningUpdatedSelfie(true);
                    const timer = setTimeout(() => {
                        setIsScanningUpdatedSelfie(false);
                        sessionStorage.removeItem('justUpdatedSelfie');
                    }, 45000 - elapsed);
                    return () => clearTimeout(timer);
                } else {
                    sessionStorage.removeItem('justUpdatedSelfie');
                }
            }
        }
    }, []);


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

    // Allow any logged-in user to see their matched photos under 'My Photos'
    const isGuest = !!currentUser;

    // Fetch Event details
    const { data: eventResult, isLoading: loading } = useQuery(
        ['event', eventId],
        () => eventApi.getById(eventId, { lite: true }),
        { enabled: !!eventId, staleTime: 60 * 1000, retry: reactQueryRetry }
    );
    const event = eventResult?.data;

    // Check if the current user has joined this event
    const isAttendee = useMemo(() => {
        if (!currentUser) return false;
        const currentId = (currentUser.id || (currentUser as any)._id)?.toString();
        const attendees = Array.isArray(event?.attendees) ? event.attendees : [];
        const inAttendees = attendees.some((a: any) => {
            const aId = typeof a === 'string' ? a : a?._id || a?.id;
            return aId && aId.toString() === currentId;
        });
        const inEvents = Array.isArray((currentUser as any).events) && (currentUser as any).events.some((e: any) => e.toString() === eventId);
        const inJoined = Array.isArray((currentUser as any).joinedEvents) && (currentUser as any).joinedEvents.some((e: any) => e.toString() === eventId);
        return inAttendees || inEvents || inJoined;
    }, [currentUser, event, eventId]);

    const handleJoinPublic = useCallback(async () => {
        if (!currentUser) {
            router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
            return;
        }

        setJoining(true);
        try {
            const res = await eventApi.register(eventId);
            if (res.success) {
                toast.success(`You've joined ${event?.name || 'the event'}!`);
                await loadUser({ force: true });
                queryClient.invalidateQueries(['event', eventId]);
                queryClient.invalidateQueries(['myPhotos']);
                queryClient.invalidateQueries(['myEventPhotos']);
                queryClient.invalidateQueries(['userStats']);
                if (!currentUser?.faceRegistered) {
                    setShowPostJoinSelfieModal(true);
                }
            } else {
                toast.error(res.message || 'Failed to join event');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error joining event');
        } finally {
            setJoining(false);
        }
    }, [currentUser, eventId, event?.name, loadUser, queryClient, router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const justJoined = searchParams.get('justJoined') === '1';

            if (justJoined) {
                if (currentUser && !currentUser.faceRegistered) {
                    setShowPostJoinSelfieModal(true);
                }
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [currentUser]);

    // Full gallery — authenticated users only (limit aligned with prior behavior)
    const { data: photosResult, isLoading: photosLoading } = useQuery(
        ['eventPhotos', eventId],
        () => fetchAllEventPhotos(eventId),
        {
            enabled: !!eventId && !!currentUser,
            staleTime: 5 * 60 * 1000,
            retry: reactQueryRetry,
        }
    );
    const allPhotos = normalizeEventPhotosPayload(photosResult);

    // Teaser for shared links — uses existing GET photos with limit (no backend deploy needed)
    const { data: previewResult, isLoading: previewLoading } = useQuery(
        ['eventPhotosPreview', eventId],
        () => eventApi.getPhotos(eventId, { limit: PREVIEW_PHOTO_COUNT }),
        {
            enabled: !!eventId && !currentUser,
            staleTime: 5 * 60 * 1000,
            retry: false,
        }
    );
    const previewPhotos = normalizeEventPhotosPayload(previewResult).slice(0, PREVIEW_PHOTO_COUNT);

    /** Real gallery count for logged-out visitors: API total, then event fields from getById. */
    const anonymousPhotoTotal = useMemo(() => {
        const fromApi = extractTotalFromPhotosApi(previewResult);
        if (fromApi !== undefined) return fromApi;

        const e = event as Record<string, unknown> | undefined;
        if (!e) return undefined;

        const fromField =
            typeof e.photoCount === 'number' && !Number.isNaN(e.photoCount)
                ? e.photoCount
                : 0;
        const stats = e.stats as Record<string, unknown> | undefined;
        const fromStats =
            stats && typeof stats.totalPhotos === 'number' && !Number.isNaN(stats.totalPhotos)
                ? stats.totalPhotos
                : 0;
        const fromArr = Array.isArray(e.photos) ? e.photos.length : 0;

        const n = Math.max(fromField, fromStats, fromArr);
        return n > 0 ? n : undefined;
    }, [event, previewResult]);

    // Fetch My Photos (filtered by eventId) - only for guest users
    const { data: myPhotosResult, isLoading: myPhotosLoading } = useQuery(
        ['myEventPhotos', eventId],
        () => fetchAllMyPhotos({ eventId }),
        {
            enabled: !!eventId && !!currentUser && !!isGuest,
            staleTime: 5 * 60 * 1000,
            retry: reactQueryRetry,
        }
    );
    const myPhotos = myPhotosResult?.data?.photos || [];

    // Determine which photos to display based on view mode
    const displayPhotos = photoViewMode === 'my' && isGuest ? myPhotos : allPhotos;

    const currentIndex = useMemo(() => {
        if (!selectedPhoto) return -1;
        return displayPhotos.findIndex((p: any) => p._id === selectedPhoto._id);
    }, [selectedPhoto, displayPhotos]);

    const lightboxItems = useMemo(
        () =>
            displayPhotos.map((p: any) => ({
                image:
                    p.url ||
                    p.s3Url ||
                    getPhotoDisplayUrl(p) ||
                    '',
                caption: p.fileName || 'Photo',
            })),
        [displayPhotos]
    );

    const isLoadingPhotos =
        !currentUser
            ? previewLoading
            : photoViewMode === 'my' && isGuest
              ? myPhotosLoading
              : photosLoading;

    // Pagination calculations
    const totalPhotos = displayPhotos.length;
    const totalPages = Math.ceil(totalPhotos / PHOTOS_PER_PAGE);
    const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
    const endIndex = startIndex + PHOTOS_PER_PAGE;
    const photos = displayPhotos.slice(startIndex, endIndex);

    // Reset to page 1 if current page exceeds total pages (e.g., after data changes)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Reset to page 1 when switching view modes
    useEffect(() => {
        setCurrentPage(1);
    }, [photoViewMode]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        document.getElementById('event-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleDownload = async (photo: any) => {
        if (downloading) return;
        setDownloading(photo._id);
        const t = toast.loading('Preparing original high-quality download...');

        try {
            // Step 1: Get the RAW bucket signed URL from backend
            const res = await photoApi.downloadPhoto(photo._id || photo.imageId);

            if (res.success && res.data?.url) {
                // Step 2: Fetch the blob silently to avoid redirects/CORS issues
                const response = await fetch(res.data.url);
                const blob = await response.blob();

                // Step 3: Trigger silent download
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = res.data.fileName || photo.fileName || `photo-${photo._id}.jpg`;
                document.body.appendChild(link);
                link.click();
                link.remove();

                // Cleanup
                window.URL.revokeObjectURL(downloadUrl);
                toast.success('Download complete!', { id: t });
            } else {
                throw new Error('Download URL not found');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download original image. Please try again.', { id: t });
        } finally {
            setDownloading(null);
        }
    };

    const handleShare = async () => {
        if (!event) return;
        const url = window.location.href;
        const text = buildEventShareText({
            name: event.name,
            description: event.description,
            accessCode: event.accessCode,
            url,
        });
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.name,
                    text,
                    url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(text);
            toast.success(
                event.accessCode ? 'Link and join code copied to clipboard!' : 'Link copied to clipboard!'
            );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
                <div className="h-14 w-14 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-white/15 dark:border-t-violet-500" />
                <p className="mt-6 text-sm font-medium text-zinc-500 dark:text-gray-400">Loading event…</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Event not found</h2>
                    <p className="text-zinc-600 dark:text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
                    <Link href="/events">
                        <Button>Browse Events</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isActive = new Date(event.endDate) > new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    return (
        <div className="relative pb-10 sm:pb-14">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute right-0 top-0 h-[min(380px,85vw)] w-[min(380px,85vw)] rounded-full bg-violet-400/14 blur-[100px] dark:bg-violet-500/10" />
                <div className="absolute bottom-24 left-0 h-[280px] w-[280px] rounded-full bg-indigo-400/12 blur-[100px] dark:bg-indigo-500/10" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl space-y-8 px-0 sm:space-y-10 sm:px-0">
                <header className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-violet-50/98 via-white to-indigo-50/90 p-5 shadow-[0_20px_60px_-28px_rgba(91,33,182,0.22)] ring-1 ring-violet-200/55 dark:from-[#1a1428] dark:via-[#120f1c] dark:to-[#0c1222] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.55)] dark:ring-white/[0.08] sm:rounded-3xl sm:p-8 md:p-10">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-[0.38] dark:opacity-50" />
                    <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/12" />
                    <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10" />

                    <div className="relative min-w-0">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <Link
                                href="/events"
                                className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-900/[0.06] transition-colors hover:bg-white hover:text-zinc-900 dark:bg-white/[0.07] dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/10"
                            >
                                <ChevronLeft size={18} />
                                Events
                            </Link>

                            {(currentUser?.role === 'admin' ||
                                event.organizer?._id === currentUser?.id ||
                                event.organizer === currentUser?.id) && (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/events/${eventId}/live-wall`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500"
                                    >
                                        <Tv size={14} />
                                        Live Moments Wall
                                    </Link>
                                    <Link
                                        href={`/events/${eventId}/manage`}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/85 px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                                    >
                                        Manage Event
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
                            <div className="min-w-0 space-y-5 sm:space-y-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${
                                            isActive
                                                ? 'border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                : 'border border-zinc-200/90 bg-zinc-100 text-zinc-700 dark:border-white/15 dark:bg-white/10 dark:text-gray-200'
                                        }`}
                                    >
                                        {isActive ? 'Active' : 'Past'}
                                    </span>
                                    {event.isPublic !== false ? (
                                        <span className="rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200 sm:text-sm">
                                            Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 sm:text-sm">
                                            <Lock size={12} />
                                            Private
                                        </span>
                                    )}
                                    <span className="rounded-full bg-zinc-900/[0.06] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-gray-400">
                                        {!currentUser
                                            ? anonymousPhotoTotal != null
                                                ? `${anonymousPhotoTotal} photos`
                                                : previewPhotos.length > 0
                                                  ? `${previewPhotos.length}+ preview`
                                                  : 'Gallery'
                                            : photoViewMode === 'my' && isGuest
                                              ? `${totalPhotos} yours`
                                              : `${allPhotos.length} photos`}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-white sm:text-3xl md:text-4xl lg:text-[2.75rem]">
                                        {event.name}
                                    </h1>
                                    <p className="max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-gray-400">
                                        {event.description || 'Join us for this event.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className={`rounded-2xl p-4 ${softSurface}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                                                <Users className="text-violet-600 dark:text-violet-300" size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-zinc-500 dark:text-gray-500">Attendees</p>
                                                <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white sm:text-2xl">
                                                    {event.attendees?.length || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`rounded-2xl p-4 ${softSurface}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/15">
                                                <Camera className="text-indigo-600 dark:text-indigo-300" size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-zinc-500 dark:text-gray-500">Photos</p>
                                                <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white sm:text-2xl">
                                                    {currentUser
                                                        ? allPhotos.length
                                                        : anonymousPhotoTotal != null
                                                          ? anonymousPhotoTotal
                                                          : previewPhotos.length > 0
                                                            ? `${previewPhotos.length}+`
                                                            : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {event.isPublic !== false ? (
                                        // Public Event: 1-click Join
                                        isAttendee ? (
                                            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/90 px-5 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200 sm:h-[3rem]">
                                                <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                Joined
                                            </div>
                                        ) : !isActive ? (
                                            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-100 px-5 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/10 dark:text-gray-300 sm:h-[3rem]">
                                                Event Concluded
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={handleJoinPublic}
                                                disabled={joining}
                                                className="h-12 w-full justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 sm:h-[3rem] sm:w-auto sm:min-w-[11rem]"
                                            >
                                                {joining ? (
                                                    <>
                                                        <Loader2 size={18} className="mr-2 animate-spin shrink-0" />
                                                        Joining...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={18} className="mr-2 shrink-0" />
                                                        Join Event
                                                    </>
                                                )}
                                            </Button>
                                        )
                                    ) : (
                                        // Private Event: Join with Code
                                        isAttendee ? (
                                            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/90 px-5 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200 sm:h-[3rem]">
                                                <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                Joined
                                            </div>
                                        ) : !isActive ? (
                                            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-100 px-5 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/10 dark:text-gray-300 sm:h-[3rem]">
                                                Event Concluded
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    if (!currentUser) {
                                                        router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
                                                    } else {
                                                        setIsJoinModalOpen(true);
                                                    }
                                                }}
                                                className="h-12 w-full justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 font-semibold text-white shadow-lg shadow-amber-500/25 hover:from-amber-500 hover:to-orange-500 sm:h-[3rem] sm:w-auto sm:min-w-[11rem]"
                                            >
                                                <KeyRound size={18} className="mr-2 shrink-0" />
                                                Enter Code to Join
                                            </Button>
                                        )
                                    )}

                                    <Button
                                        onClick={handleShare}
                                        variant="outline"
                                        className="h-12 w-full justify-center rounded-2xl border-zinc-300 bg-white/95 font-semibold shadow-sm dark:border-white/15 dark:bg-white/5 sm:h-[3rem] sm:w-auto sm:min-w-[10rem]"
                                    >
                                        <Share2 size={18} className="mr-2 shrink-0" />
                                        Share
                                    </Button>
                                </div>
                            </div>

                            <aside className={`min-w-0 rounded-2xl p-5 sm:p-7 ${softSurface}`}>
                                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white sm:text-xl">
                                    <Sparkles className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                                    Details
                                </h3>

                                <dl className="space-y-5">
                                    <div className="flex gap-3 border-b border-zinc-100 pb-5 dark:border-white/[0.07]">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                                            <Calendar className="text-violet-600 dark:text-violet-300" size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-gray-500">When</dt>
                                            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                                                {startDate.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </dd>
                                            <dd className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-gray-400">
                                                <Clock size={14} className="shrink-0 text-violet-600 dark:text-violet-400" />
                                                {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} –{' '}
                                                {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </dd>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 border-b border-zinc-100 pb-5 dark:border-white/[0.07]">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-500/15">
                                            <MapPin className="text-pink-600 dark:text-pink-300" size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-gray-500">Where</dt>
                                            <dd className="mt-1 text-sm leading-relaxed text-zinc-800 dark:text-gray-200">
                                                {event.venue || event.location || 'To be announced'}
                                            </dd>
                                        </div>
                                    </div>

                                    {event.organizer && (
                                        <div className="flex gap-3 border-b border-zinc-100 pb-5 dark:border-white/[0.07]">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                                                <User className="text-emerald-700 dark:text-emerald-300" size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-gray-500">Organizer</dt>
                                                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{event.organizerName || event.organizer.name}</dd>
                                                <dd className="mt-0.5 break-all text-xs text-zinc-500 dark:text-gray-500">{event.organizer.email}</dd>
                                            </div>
                                        </div>
                                    )}

                                    {(currentUser?.role === 'admin' ||
                                        event.organizer?._id === currentUser?.id ||
                                        event.organizer === currentUser?.id) &&
                                        event.accessCode && (
                                        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/95 to-indigo-50/80 p-4 dark:border-violet-500/25 dark:from-violet-500/10 dark:to-indigo-500/10">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">Join code</dt>
                                            <dd className="mt-2 font-mono text-lg font-semibold tracking-widest text-violet-950 break-all dark:text-violet-100">
                                                {event.accessCode}
                                            </dd>
                                            <dd className="mt-2 text-xs text-zinc-600 dark:text-gray-400">Share with guests so they can join.</dd>
                                        </div>
                                    )}
                                </dl>
                            </aside>
                        </div>
                    </div>
                </header>

            <section id="event-gallery" className="scroll-mt-24 py-1 sm:py-2">
                <div className="mb-8 text-center sm:mb-10">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15 sm:h-12 sm:w-12">
                        <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400 sm:h-6 sm:w-6" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                        Gallery
                    </h2>
                    <p className="mx-auto mt-2 max-w-lg px-2 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-gray-400">
                        {!currentUser
                            ? 'Preview below — sign in for the full set and downloads.'
                            : totalPhotos > 0
                              ? `${totalPhotos} moment${totalPhotos === 1 ? '' : 's'} from this event`
                              : 'Photos will show here after upload'}
                    </p>
                </div>

                {isGuest && currentUser && !currentUser.faceRegistered && (
                    <div className="mb-6 mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-4 text-left backdrop-blur-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                    <Camera size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Face selfie not registered
                                    </p>
                                    <p className="text-xs text-zinc-600 dark:text-gray-300">
                                        Add your selfie once to see your photos automatically
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => router.push(`/register-face?redirect=/events/${eventId}`)}
                                className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-105 text-xs px-4 py-2 font-semibold shadow-md shadow-amber-500/25"
                            >
                                Register Face
                            </Button>
                        </div>
                    </div>
                )}

                {isGuest && currentUser && (
                    <div className="mb-8 flex justify-center px-0 sm:px-2">
                        <div className={`flex w-full max-w-md rounded-2xl p-1 ${softSurface}`}>
                            <button
                                type="button"
                                onClick={() => setPhotoViewMode('all')}
                                className={`min-h-[48px] flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                                    photoViewMode === 'all'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setPhotoViewMode('my')}
                                className={`min-h-[48px] flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                    photoViewMode === 'my'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                <span>My photos</span>
                                {!currentUser.faceRegistered && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Face registration required" />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {isScanningUpdatedSelfie && photoViewMode === 'my' && (
                    <div className="mb-6 mx-auto max-w-xl flex items-center justify-between gap-3 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-violet-600/5 p-4 text-violet-900 dark:text-violet-200 shadow-sm animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
                                <Sparkles className="h-5 w-5 animate-spin" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Updating Gallery with Your New Selfie</p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Our AI is re-scanning this event's photos in the background. Matched photos will appear automatically in ~30 seconds.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsScanningUpdatedSelfie(false);
                                sessionStorage.removeItem('justUpdatedSelfie');
                            }}
                            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {isLoadingPhotos ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                        {[...Array(!currentUser ? 4 : 8)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square animate-pulse rounded-xl bg-zinc-100 ring-1 ring-zinc-900/[0.04] dark:bg-white/[0.06] dark:ring-white/[0.06]"
                            />
                        ))}
                    </div>
                ) : !currentUser ? (
                    <div className="space-y-6 sm:space-y-8">
                        {previewPhotos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                                {previewPhotos.map((photo: any, index: number) => {
                                    const src =
                                        getPhotoDisplayUrl(photo) ||
                                        photo.thumbnailUrl ||
                                        photo.url ||
                                        photo.s3Url;
                                    return (
                                        <button
                                            key={photo._id || photo.imageId || index}
                                            type="button"
                                            className={`group relative aspect-square overflow-hidden rounded-xl text-left ring-1 ring-zinc-900/[0.06] transition-transform active:scale-[0.98] dark:ring-white/[0.08] sm:rounded-2xl ${softSurface} ${softSurfaceHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
                                            onClick={() => setSelectedPhoto(photo)}
                                        >
                                            {src ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={src}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-white/5">
                                                    <ImageIcon className="text-zinc-400" size={36} />
                                                </div>
                                            )}
                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent pt-8 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" />
                                            <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:text-[11px]">
                                                Preview
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className={`relative overflow-hidden rounded-[1.65rem] p-6 sm:p-8 ${softSurface}`}>
                            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
                            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                <div className="flex gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
                                        <Lock className="text-violet-600 dark:text-violet-300" size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white sm:text-xl">
                                            Unlock the full gallery
                                        </h3>
                                        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
                                            {previewPhotos.length > 0
                                                ? 'Sign in to see every photo, use My Photos, and download originals.'
                                                : 'Sign in or create an account to view photos from this event.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:shrink-0">
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="h-12 w-full justify-center rounded-2xl font-semibold shadow-lg shadow-violet-500/20 sm:w-auto sm:min-w-[8.5rem]"
                                    >
                                        Log in
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/register')}
                                        className="h-12 w-full justify-center rounded-2xl border-zinc-300 font-semibold dark:border-white/20 sm:w-auto sm:min-w-[8.5rem]"
                                    >
                                        Sign up
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : photos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                            {photos.map((photo: any, index: number) => (
                                <button
                                    key={photo._id}
                                    type="button"
                                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl text-left ring-1 ring-zinc-900/[0.06] transition-transform active:scale-[0.98] dark:ring-white/[0.08] sm:rounded-2xl ${softSurface} ${softSurfaceHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={
                                            getPhotoDisplayUrl(photo) ||
                                            photo.thumbnailUrl ||
                                            photo.url ||
                                            photo.s3Url
                                        }
                                        alt={`Event photo ${startIndex + index + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:opacity-0">
                                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                            <div className="flex items-center justify-between text-xs text-white sm:text-sm">
                                                <span className="font-medium">Open</span>
                                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] backdrop-blur-sm">
                                                    #{(startIndex + index + 1).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className={`mt-8 rounded-2xl p-4 sm:mt-10 sm:p-6 ${softSurface}`}>
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
                    photoViewMode === 'my' && isGuest ? (
                        !currentUser?.faceRegistered ? (
                            <div className={`rounded-[1.65rem] px-6 py-12 sm:py-16 text-center ${softSurface} border border-amber-400/30 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent`}>
                                <div className="mx-auto mb-5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25">
                                    <Camera className="h-9 w-9" />
                                    <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black text-xs font-bold ring-2 ring-white dark:ring-[#14121f]">
                                        !
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                                    Face Not Registered Yet
                                </h3>
                                <p className="mx-auto max-w-md text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-gray-300 mb-6">
                                    No photos are visible in &quot;My photos&quot; because you haven&apos;t registered your face yet. Take a quick 30-second selfie once so our AI can automatically find you in all event photos!
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                                    <Button
                                        onClick={() => router.push(`/register-face?redirect=/events/${eventId}`)}
                                        className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2"
                                    >
                                        <Camera className="h-5 w-5" />
                                        Register Face (Take Quick Selfie)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPhotoViewMode('all')}
                                        className="w-full sm:w-auto h-12 px-5 rounded-xl border-zinc-300 dark:border-white/20"
                                    >
                                        Browse All Event Photos
                                    </Button>
                                </div>
                                <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-white/10 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs text-zinc-500 dark:text-gray-400">
                                    <div>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">1. Take Selfie</p>
                                        <p className="text-[11px]">Takes ~30 sec</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">2. AI Matches</p>
                                        <p className="text-[11px]">Instant scan</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">3. View Photos</p>
                                        <p className="text-[11px]">Your shots appear</p>
                                    </div>
                                </div>
                            </div>
                        ) : allPhotos.length === 0 ? (
                            <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
                                    <ImageIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                    No Photos in This Event Yet
                                </h3>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                    Your face is registered and ready! The photographer is still capturing moments or hasn&apos;t uploaded photos to this event yet. As soon as photos are uploaded, our AI will automatically find and deliver your shots here.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            queryClient.invalidateQueries(['eventPhotos', eventId]);
                                            queryClient.invalidateQueries(['myEventPhotos', eventId]);
                                            toast.success('Gallery refreshed');
                                        }}
                                        className="rounded-xl px-5 h-11"
                                    >
                                        Refresh Gallery
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
                                    <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                    No Photos Matched to You Yet
                                </h3>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                    Your face is registered and active! We scanned {allPhotos.length} uploaded event photos, but didn&apos;t detect your face in them yet. Either the photographer hasn&apos;t uploaded photos of you yet, or you weren&apos;t captured in this event&apos;s current uploads.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPhotoViewMode('all')}
                                        className="rounded-xl px-5 h-11"
                                    >
                                        Browse All Event Photos ({allPhotos.length})
                                    </Button>
                                    <Link
                                        href={`/register-face?redirect=/events/${eventId}`}
                                        className="text-xs text-zinc-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 py-2 inline-flex items-center gap-1"
                                    >
                                        Look changed? Update your face selfie →
                                    </Link>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                                <ImageIcon className="h-8 w-8 text-zinc-400 dark:text-gray-500" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                                No photos uploaded yet
                            </h3>
                            <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
                                Uploaded photos from organizers and photographers will appear here.
                            </p>
                        </div>
                    )
                )}
            </section>

            {selectedPhoto && currentIndex >= 0 && (
                <PhotoLightbox
                    items={lightboxItems}
                    startIndex={currentIndex}
                    onIndexChange={(i) => setSelectedPhoto(displayPhotos[i])}
                    onClose={() => setSelectedPhoto(null)}
                    onUntag={photoViewMode === 'my' ? () => handleUntag(selectedPhoto) : undefined}
                    footer={
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-white" title={selectedPhoto.fileName}>
                                    {selectedPhoto.fileName}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-300">
                                    {new Date(
                                        selectedPhoto.uploadedAt || selectedPhoto.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            {currentUser ? (
                                <Button
                                    onClick={() => handleDownload(selectedPhoto)}
                                    disabled={!!downloading}
                                    className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 sm:h-10 sm:w-auto"
                                >
                                    {downloading === selectedPhoto._id ? (
                                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Download size={18} className="mr-2" />
                                    )}
                                    {downloading === selectedPhoto._id ? 'Downloading…' : 'Download'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 sm:h-10 sm:w-auto"
                                >
                                    Log in to download
                                </Button>
                            )}
                        </div>
                    }
                />
            )}

            {/* Join Event Modal for Private Events */}
            <JoinEventModal
                isOpen={isJoinModalOpen}
                onClose={() => {
                    setIsJoinModalOpen(false);
                    queryClient.invalidateQueries(['event', eventId]);
                    queryClient.invalidateQueries(['myPhotos']);
                    queryClient.invalidateQueries(['myEventPhotos']);
                }}
            />

            {/* Instant Post-Join Selfie Modal */}
            <PostJoinSelfieModal
                isOpen={showPostJoinSelfieModal}
                onClose={() => setShowPostJoinSelfieModal(false)}
                eventName={event?.name}
                eventId={eventId}
                redirectPath={`/events/${eventId}`}
            />
            </div>
        </div>
    );
}
