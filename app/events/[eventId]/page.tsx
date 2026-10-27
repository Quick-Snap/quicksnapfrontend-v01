'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
    Tv,
    Heart,
    Bookmark,
    AlertCircle,
    Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, photoApi } from '@/lib/api';
import {
    fetchAllEventPhotos,
    fetchAllMyPhotos,
    fetchEventPhotosProgressive,
    fetchMyPhotosProgressive,
    extractEventPhotosTotal,
    extractMyPhotosTotal,
    normalizeEventPhotosPayload,
} from '@/lib/photoFetch';
import { buildEventShareText, buildSelectionShareText } from '@/lib/eventShareText';
import { getPhotoDisplayUrl } from '@/lib/photoUrl';
import { Button } from '@/app/components/ui/Button';
import Pagination from '@/app/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { useQuery, useQueryClient } from 'react-query';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';
import JoinEventModal from '@/app/components/student/JoinEventModal';
import PostJoinSelfieModal from '@/app/components/events/PostJoinSelfieModal';
import GuestUploadModal from '@/app/components/events/GuestUploadModal';
import { formatEventSchedule } from '@/lib/eventDateUtils';
import { getEventProfile } from '@/lib/eventProfiles';

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
    const { user: currentUser, activeRole, updateUser } = useAuth();
    const { isUser: isViewingAsUser, isOrganizer: isRoleOrganizer, isAdmin: isRoleAdmin } = useRole();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const eventId = params?.eventId as string;

    const proofTokenParam = searchParams?.get('proofToken') || '';
    const accessCodeParam = searchParams?.get('code') || '';

    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [selectedSubEventId, setSelectedSubEventId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [photoViewMode, setPhotoViewMode] = useState<'all' | 'my' | 'album' | 'bookmark'>('all');
    const [myPhotosFilter, setMyPhotosFilter] = useState<'all' | 'favorites'>('all');
    const [batchDownloading, setBatchDownloading] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [joining, setJoining] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isGuestUploadModalOpen, setIsGuestUploadModalOpen] = useState(false);
    const [showPostJoinSelfieModal, setShowPostJoinSelfieModal] = useState(false);
    const [isScanningUpdatedSelfie, setIsScanningUpdatedSelfie] = useState(false);
    const [showSelectionAuthModal, setShowSelectionAuthModal] = useState(false);
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

    const handleReportPhoto = async (photo: any) => {
        if (!currentUser) {
            toast.error('Please log in to report photos');
            router.push('/login');
            return;
        }
        const photoId = photo._id || photo.imageId;
        if (!photoId) return;
        try {
            const res = await photoApi.reportPhoto(photoId);
            toast.success(res.message || 'Photo reported successfully');
            setSelectedPhoto(null);
        } catch (err: any) {
            console.error('Failed to report photo:', err);
            toast.error(err.response?.data?.message || 'Failed to report photo');
        }
    };

    // Fetch Event details (with proofToken validation if present)
    const { data: eventResult, isLoading: loading } = useQuery(
        ['event', eventId, proofTokenParam],
        () => eventApi.getById(eventId, { lite: true, proofToken: proofTokenParam }),
        { enabled: !!eventId, staleTime: 60 * 1000, retry: reactQueryRetry }
    );
    const event = eventResult?.data;
    const eventProfile = getEventProfile(event?.category);
    const studioInfo = (event?.organizer as any)?.studioSettings;
    const isProofingAuthorized = Boolean(event?.isProofingAuthorized);
    const isProofingMode = isProofingAuthorized;
    const isProofingDisabled = event?.isProofingEnabled === false && Boolean(proofTokenParam);

    // The viewer is acting as an organizer for this event ONLY IF their active role is organizer or admin,
    // and they have event ownership or admin permissions.
    // If they switched to Guest/User in the role switcher, they are strictly in Guest view.
    const isOrganizer = useMemo(() => {
        if (!currentUser || isViewingAsUser) return false;
        if (isRoleAdmin) return true;
        if (isRoleOrganizer) {
            const currentId = (currentUser.id || (currentUser as any)._id)?.toString();
            const organizerId = (event?.organizer?._id || event?.organizer)?.toString();
            return Boolean(organizerId) && currentId === organizerId;
        }
        return false;
    }, [currentUser, event, isViewingAsUser, isRoleAdmin, isRoleOrganizer]);

    // Regular attendee/guest who is viewing this event
    const isGuest = Boolean(currentUser && !isOrganizer);

    // Can only manage if actively viewing as an organizer/admin and have event management rights
    const canManageEvent = isOrganizer;

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
                if (isGuest && !currentUser?.faceRegistered) {
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
    }, [currentUser, eventId, event?.name, isGuest, loadUser, queryClient, router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const justJoined = searchParams.get('justJoined') === '1';

            if (justJoined) {
                if (isGuest && currentUser && !currentUser.faceRegistered) {
                    setShowPostJoinSelfieModal(true);
                }
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [currentUser, isGuest, isOrganizer]);

    // Full gallery (hybrid progressive loading: instant initial paint, background stream)
    const { data: photosResult, isLoading: photosLoading } = useQuery(
        ['eventPhotos', eventId, proofTokenParam, accessCodeParam],
        () => fetchEventPhotosProgressive(eventId, {
            initialLimit: 24,
            all: isProofingMode || isOrganizer,
            proofToken: proofTokenParam,
            code: accessCodeParam,
            onBatch: ({ photos, total, hasMore, isInitial }) => {
                if (!isInitial) {
                    queryClient.setQueryData(['eventPhotos', eventId, proofTokenParam, accessCodeParam], (prev: any) => ({
                        ...(prev && typeof prev === 'object' ? prev : {}),
                        success: true,
                        data: {
                            photos,
                            total,
                            pagination: { total, pages: 1, page: 1, limit: photos.length, hasMore },
                        },
                    }));
                }
            },
        }),
        {
            enabled: !!eventId && (!!currentUser || isProofingMode),
            staleTime: 5 * 60 * 1000,
            retry: reactQueryRetry,
        }
    );
    const allPhotos = normalizeEventPhotosPayload(photosResult);

    // Teaser for shared links — uses existing GET photos with limit (only for logged-out non-proofing visitors)
    const { data: previewResult, isLoading: previewLoading } = useQuery(
        ['eventPhotosPreview', eventId],
        () => eventApi.getPhotos(eventId, { limit: PREVIEW_PHOTO_COUNT }),
        {
            enabled: !!eventId && !currentUser && !isProofingMode,
            staleTime: 5 * 60 * 1000,
            retry: false,
        }
    );
    const previewPhotos = normalizeEventPhotosPayload(previewResult).slice(0, PREVIEW_PHOTO_COUNT);

    /** Real gallery count for logged-out visitors: API total, then event fields from getById. */
    const anonymousPhotoTotal = useMemo(() => {
        const fromApi = extractTotalFromPhotosApi(previewResult);
        if (fromApi !== undefined) return fromApi;

        const responseData = (previewResult as any)?.data;
        const pagination = responseData?.pagination;
        const hasMore = Boolean(pagination?.hasMore || pagination?.lastKey);

        // If preview query returned photos and hasMore is false, the real total is previewPhotos.length
        if (!previewLoading && previewResult && !hasMore) {
            return previewPhotos.length;
        }

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
    }, [event, previewResult, previewLoading, previewPhotos.length]);

    // Fetch My Photos (filtered by eventId) - only for guest users (hybrid progressive loading)
    const { data: myPhotosResult, isLoading: myPhotosLoading } = useQuery(
        ['myEventPhotos', eventId],
        () => fetchMyPhotosProgressive(
            { eventId },
            {
                initialLimit: 24,
                batchLimit: 48,
                onBatch: ({ photos, total, isInitial }) => {
                    if (!isInitial) {
                        queryClient.setQueryData(['myEventPhotos', eventId], (prev: any) => ({
                            success: true,
                            data: {
                                photos,
                                pagination: { total },
                            },
                        }));
                    }
                },
            }
        ),
        {
            enabled: !!eventId && !!currentUser,
            staleTime: 5 * 60 * 1000,
            retry: reactQueryRetry,
        }
    );
    const myPhotos = myPhotosResult?.data?.photos || [];

    // Self-healing: If user has matched photos, their face is definitively registered
    useEffect(() => {
        if (myPhotos.length > 0 && currentUser && !currentUser.faceRegistered) {
            updateUser({ ...currentUser, faceRegistered: true });
        }
    }, [myPhotos.length, currentUser, updateUser]);

    // Fetch Event Selections (❤️ Album and 🔖 Keepers) directly from backend (same as Studio)
    const { data: selectionsResult } = useQuery(
        ['eventSelections', eventId],
        () => eventApi.getSelections(eventId),
        {
            enabled: !!eventId && (!!currentUser || isProofingMode),
            staleTime: 30 * 1000,
            retry: reactQueryRetry,
        }
    );

    // Build unified map of all known event photos (official, personal matched, and selections)
    const allKnownPhotosMap = useMemo(() => {
        const map = new Map<string, any>();

        // 1. Populate with any selections from backend (ensures all selected photos from DB exist)
        for (const p of selectionsResult?.data?.combined || selectionsResult?.data?.albumFavorites || []) {
            const id = p.imageId || p._id;
            if (id) {
                map.set(id, { ...p, _id: id, imageId: id });
            }
        }
        for (const p of selectionsResult?.data?.originalRequests || []) {
            const id = p.imageId || p._id;
            if (id) {
                const existing = map.get(id);
                map.set(id, {
                    ...(existing || {}),
                    ...p,
                    _id: id,
                    imageId: id,
                    isOriginalRequested: true,
                });
            }
        }

        // 2. Overlay allPhotos (official event photos)
        for (const p of allPhotos || []) {
            const id = p.imageId || p._id;
            if (id) {
                const existing = map.get(id);
                map.set(id, {
                    ...(existing || {}),
                    ...p,
                    _id: id,
                    imageId: id,
                    isAlbumFavorite: p.isAlbumFavorite !== undefined ? p.isAlbumFavorite : (existing?.isAlbumFavorite ?? false),
                    isOriginalRequested: p.isOriginalRequested !== undefined ? p.isOriginalRequested : (existing?.isOriginalRequested ?? false),
                    albumFavoritedCount: existing?.albumFavoritedCount ?? p.albumFavoritedCount ?? (existing?.isAlbumFavorite || p.isAlbumFavorite ? 1 : 0),
                    originalRequestedCount: existing?.originalRequestedCount ?? p.originalRequestedCount ?? (existing?.isOriginalRequested || p.isOriginalRequested ? 1 : 0),
                    albumFavoritedBy: existing?.albumFavoritedBy ?? p.albumFavoritedBy ?? [],
                    originalRequestedBy: existing?.originalRequestedBy ?? p.originalRequestedBy ?? [],
                });
            }
        }

        // 3. Overlay myPhotos (user's personal matched photos)
        for (const p of myPhotos || []) {
            const id = p.imageId || p._id;
            if (id) {
                const existing = map.get(id);
                map.set(id, {
                    ...(existing || {}),
                    ...p,
                    _id: id,
                    imageId: id,
                    isAlbumFavorite: p.isAlbumFavorite !== undefined ? p.isAlbumFavorite : (existing?.isAlbumFavorite ?? false),
                    isOriginalRequested: p.isOriginalRequested !== undefined ? p.isOriginalRequested : (existing?.isOriginalRequested ?? false),
                    albumFavoritedCount: existing?.albumFavoritedCount ?? p.albumFavoritedCount ?? (existing?.isAlbumFavorite || p.isAlbumFavorite ? 1 : 0),
                    originalRequestedCount: existing?.originalRequestedCount ?? p.originalRequestedCount ?? (existing?.isOriginalRequested || p.isOriginalRequested ? 1 : 0),
                    albumFavoritedBy: existing?.albumFavoritedBy ?? p.albumFavoritedBy ?? [],
                    originalRequestedBy: existing?.originalRequestedBy ?? p.originalRequestedBy ?? [],
                });
            }
        }

        return map;
    }, [allPhotos, myPhotos, selectionsResult]);

    const isSelectedByCurrentUser = useCallback((photo: any, type: 'album' | 'original') => {
        if (!currentUser || !photo) return false;
        const myId = (currentUser.id || (currentUser as any)._id)?.toString();
        const list = type === 'album' ? photo.albumFavoritedBy : photo.originalRequestedBy;
        if (Array.isArray(list)) {
            return list.some((u: any) => {
                const uid = typeof u === 'string' ? u : (u?._id || u?.id)?.toString();
                return uid === myId;
            });
        }
        return false;
    }, [currentUser]);

    const allKnownPhotosList = useMemo(() => {
        if (allPhotos && allPhotos.length > 0) {
            return allPhotos.map((p: any) => allKnownPhotosMap.get(p.imageId || p._id) || p);
        }
        return Array.from(allKnownPhotosMap.values());
    }, [allPhotos, allKnownPhotosMap]);

    // Personal picks (strictly for the logged-in user)
    const myAlbumPhotos = useMemo(
        () => (currentUser ? allKnownPhotosList.filter((p: any) => isSelectedByCurrentUser(p, 'album')) : []),
        [allKnownPhotosList, currentUser, isSelectedByCurrentUser]
    );

    const myBookmarkPhotos = useMemo(
        () => (currentUser ? allKnownPhotosList.filter((p: any) => isSelectedByCurrentUser(p, 'original')) : []),
        [allKnownPhotosList, currentUser, isSelectedByCurrentUser]
    );

    // Shoot-wide deduplicated totals (all loved ones combined)
    const shootWideAlbumPhotos = useMemo(
        () => allKnownPhotosList.filter((p: any) => p.isAlbumFavorite === true),
        [allKnownPhotosList]
    );

    const shootWideBookmarkPhotos = useMemo(
        () => allKnownPhotosList.filter((p: any) => p.isOriginalRequested === true),
        [allKnownPhotosList]
    );

    // Photos matched to current user that are also favorited (heart)
    const myLikedPhotos = useMemo(() => {
        if (!currentUser || !myPhotos || myPhotos.length === 0) return [];
        return myPhotos.filter((p: any) => {
            const photoObj = allKnownPhotosMap.get(p.imageId || p._id) || p;
            return isSelectedByCurrentUser(photoObj, 'album');
        });
    }, [currentUser, myPhotos, allKnownPhotosMap, isSelectedByCurrentUser]);

    const myAlbumCount = myAlbumPhotos.length;
    const myBookmarkCount = myBookmarkPhotos.length;
    const shootWideAlbumCount = shootWideAlbumPhotos.length;
    const shootWideBookmarkCount = shootWideBookmarkPhotos.length;

    // Base photos before ceremony / sub-event filtering
    const baseDisplayPhotos = useMemo(() => {
        if (photoViewMode === 'my') {
            if (!currentUser) return [];
            if (myPhotosFilter === 'favorites') {
                return myLikedPhotos;
            }
            return myPhotos;
        }
        if (photoViewMode === 'album') {
            if (!currentUser) return [];
            return myAlbumPhotos;
        }
        if (photoViewMode === 'bookmark') {
            if (!currentUser) return [];
            return myBookmarkPhotos;
        }
        return allKnownPhotosList;
    }, [photoViewMode, myPhotosFilter, currentUser, myPhotos, myLikedPhotos, myAlbumPhotos, myBookmarkPhotos, allKnownPhotosList]);

    // Filter by selected ceremony / sub-event if active
    const displayPhotos = useMemo(() => {
        if (!selectedSubEventId) return baseDisplayPhotos;
        return baseDisplayPhotos.filter((p: any) => {
            const sId = p.subEventId?._id || p.subEventId;
            return sId && sId.toString() === selectedSubEventId;
        });
    }, [baseDisplayPhotos, selectedSubEventId]);

    // Count photos per ceremony within the current active tab
    const countPhotosInSubEvent = useCallback((subId: string) => {
        if (!baseDisplayPhotos) return 0;
        return baseDisplayPhotos.filter((p: any) => {
            const sId = p.subEventId?._id || p.subEventId;
            return sId && sId.toString() === subId;
        }).length;
    }, [baseDisplayPhotos]);

    const handleSwitchViewMode = useCallback((mode: 'all' | 'my' | 'album' | 'bookmark') => {
        setPhotoViewMode(mode);
        if (mode === 'my') {
            setMyPhotosFilter('all');
        }
        setSelectedSubEventId(null);
        setCurrentPage(1);
    }, []);

    const getSelectionTooltip = useCallback((photo: any, type: 'album' | 'original') => {
        const isMyPick = isSelectedByCurrentUser(photo, type);
        const totalCount = (type === 'album' ? photo.albumFavoritedCount : photo.originalRequestedCount) ?? 0;
        const isSelectedAny = type === 'album' ? Boolean(photo.isAlbumFavorite) : Boolean(photo.isOriginalRequested);
        const otherCount = Math.max(0, isMyPick ? totalCount - 1 : totalCount);

        if (type === 'album') {
            if (isMyPick) {
                if (otherCount === 1) return 'In your album picks (❤️) • Also picked by 1 loved one (click to remove)';
                if (otherCount > 1) return `In your album picks (❤️) • Also picked by ${otherCount} loved ones (click to remove)`;
                return 'In your album picks (❤️) — click to remove';
            }
            if (isSelectedAny) {
                if (totalCount === 1) return 'Picked by 1 loved one (❤️) — click to add to your picks';
                if (totalCount > 1) return `Picked by ${totalCount} loved ones (❤️) — click to add to your picks`;
                return 'Picked by a loved one (❤️) — click to add to your picks';
            }
            return 'Select for Album (❤️)';
        } else {
            if (isMyPick) {
                if (otherCount === 1) return 'In your keepers (🔖) • Also kept by 1 loved one (click to remove)';
                if (otherCount > 1) return `In your keepers (🔖) • Also kept by ${otherCount} loved ones (click to remove)`;
                return 'In your keepers (🔖) — click to remove';
            }
            if (isSelectedAny) {
                if (totalCount === 1) return 'Kept by 1 loved one (🔖) — click to add to your keepers';
                if (totalCount > 1) return `Kept by ${totalCount} loved ones (🔖) — click to add to your keepers`;
                return 'Kept by a loved one (🔖) — click to add to your keepers';
            }
            return 'Save as High-Res Keeper (🔖)';
        }
    }, [isSelectedByCurrentUser]);

    const handleToggleSelection = useCallback(async (photo: any, type: 'album' | 'original') => {
        if (!currentUser) {
            setShowSelectionAuthModal(true);
            return;
        }
        if (!photo?._id && !photo?.imageId) return;
        const photoId = photo.imageId || photo._id;

        const myUserId = (currentUser.id || (currentUser as any)._id)?.toString();
        const isSelectedByMe = isSelectedByCurrentUser(photo, type);
        const nextStatus = !isSelectedByMe;

        const updateList = (list: any[]) =>
            (list || []).map((p) => {
                if (p.imageId === photoId || p._id === photoId) {
                    const oldList = (type === 'album' ? p.albumFavoritedBy : p.originalRequestedBy) || [];
                    let updatedUsers = [...oldList];
                    const oldCount = typeof (type === 'album' ? p.albumFavoritedCount : p.originalRequestedCount) === 'number'
                        ? (type === 'album' ? p.albumFavoritedCount : p.originalRequestedCount)
                        : (Array.isArray(oldList) ? oldList.length : 0) || ((type === 'album' ? p.isAlbumFavorite : p.isOriginalRequested) ? 1 : 0);
                    let updatedCount = oldCount;
                    if (nextStatus) {
                        if (!updatedUsers.some((u: any) => (u?._id || u?.id || u)?.toString() === myUserId)) {
                            updatedUsers.push({ _id: myUserId, name: currentUser.name || 'You', email: currentUser.email || '' });
                        }
                        updatedCount = Math.max(1, oldCount + 1);
                    } else {
                        updatedUsers = updatedUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId);
                        updatedCount = Math.max(0, oldCount - 1);
                    }
                    const overallActive = nextStatus || updatedUsers.length > 0 || updatedCount > 0;
                    return {
                        ...p,
                        [type === 'album' ? 'albumFavoritedBy' : 'originalRequestedBy']: updatedUsers,
                        [type === 'album' ? 'isAlbumFavorite' : 'isOriginalRequested']: overallActive,
                        [type === 'album' ? 'albumFavoritedCount' : 'originalRequestedCount']: updatedCount,
                    };
                }
                return p;
            });

        // Update selectedPhoto if currently open in lightbox
        setSelectedPhoto((prev: any) => {
            if (!prev) return prev;
            if (prev.imageId === photoId || prev._id === photoId) {
                const oldList = (type === 'album' ? prev.albumFavoritedBy : prev.originalRequestedBy) || [];
                let updatedUsers = [...oldList];
                const oldCount = typeof (type === 'album' ? prev.albumFavoritedCount : prev.originalRequestedCount) === 'number'
                    ? (type === 'album' ? prev.albumFavoritedCount : prev.originalRequestedCount)
                    : (Array.isArray(oldList) ? oldList.length : 0) || ((type === 'album' ? prev.isAlbumFavorite : prev.isOriginalRequested) ? 1 : 0);
                let updatedCount = oldCount;
                if (nextStatus) {
                    if (!updatedUsers.some((u: any) => (u?._id || u?.id || u)?.toString() === myUserId)) {
                        updatedUsers.push({ _id: myUserId, name: currentUser.name || 'You', email: currentUser.email || '' });
                    }
                    updatedCount = Math.max(1, oldCount + 1);
                } else {
                    updatedUsers = updatedUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId);
                    updatedCount = Math.max(0, oldCount - 1);
                }
                const overallActive = nextStatus || updatedUsers.length > 0 || updatedCount > 0;
                return {
                    ...prev,
                    [type === 'album' ? 'albumFavoritedBy' : 'originalRequestedBy']: updatedUsers,
                    [type === 'album' ? 'isAlbumFavorite' : 'isOriginalRequested']: overallActive,
                    [type === 'album' ? 'albumFavoritedCount' : 'originalRequestedCount']: updatedCount,
                };
            }
            return prev;
        });

        // Optimistically update caches
        queryClient.setQueryData(['eventPhotos', eventId, proofTokenParam, accessCodeParam], (prev: any) => {
            if (!prev?.data?.photos) return prev;
            return {
                ...prev,
                data: {
                    ...prev.data,
                    photos: updateList(prev.data.photos),
                },
            };
        });

        queryClient.setQueryData(['eventPhotos', eventId], (prev: any) => {
            if (!prev?.data?.photos) return prev;
            return {
                ...prev,
                data: {
                    ...prev.data,
                    photos: updateList(prev.data.photos),
                },
            };
        });

        queryClient.setQueryData(['myEventPhotos', eventId], (prev: any) => {
            if (!prev?.data?.photos) return prev;
            return {
                ...prev,
                data: {
                    ...prev.data,
                    photos: updateList(prev.data.photos),
                },
            };
        });

        // Optimistically update eventSelections query cache
        queryClient.setQueryData(['eventSelections', eventId], (prev: any) => {
            if (!prev?.data) return prev;
            const data = prev.data;
            let albumFavs = [...(data.albumFavorites || [])];
            let origReqs = [...(data.originalRequests || [])];

            const updatedPhoto = {
                ...photo,
                _id: photoId,
                imageId: photoId,
                [type === 'album' ? 'isAlbumFavorite' : 'isOriginalRequested']: nextStatus,
            };

            if (type === 'album') {
                const idx = albumFavs.findIndex((p: any) => (p.imageId || p._id) === photoId);
                const existingItem = idx >= 0 ? albumFavs[idx] : photo;
                const oldCount = typeof existingItem?.albumFavoritedCount === 'number'
                    ? existingItem.albumFavoritedCount
                    : (existingItem?.isAlbumFavorite ? 1 : 0);
                const updatedCount = nextStatus ? Math.max(1, oldCount + 1) : Math.max(0, oldCount - 1);
                const oldUsers = existingItem?.albumFavoritedBy || [];
                const updatedUsers = nextStatus
                    ? [...oldUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId), { _id: myUserId, name: currentUser.name || 'You' }]
                    : oldUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId);

                if (updatedCount > 0 || updatedUsers.length > 0) {
                    const mergedItem = {
                        ...existingItem,
                        _id: photoId,
                        imageId: photoId,
                        isAlbumFavorite: true,
                        albumFavoritedCount: updatedCount,
                        albumFavoritedBy: updatedUsers
                    };
                    if (idx >= 0) albumFavs[idx] = mergedItem;
                    else albumFavs.unshift(mergedItem);
                } else {
                    albumFavs = albumFavs.filter((p: any) => (p.imageId || p._id) !== photoId);
                }
            } else {
                const idx = origReqs.findIndex((p: any) => (p.imageId || p._id) === photoId);
                const existingItem = idx >= 0 ? origReqs[idx] : photo;
                const oldCount = typeof existingItem?.originalRequestedCount === 'number'
                    ? existingItem.originalRequestedCount
                    : (existingItem?.isOriginalRequested ? 1 : 0);
                const updatedCount = nextStatus ? Math.max(1, oldCount + 1) : Math.max(0, oldCount - 1);
                const oldUsers = existingItem?.originalRequestedBy || [];
                const updatedUsers = nextStatus
                    ? [...oldUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId), { _id: myUserId, name: currentUser.name || 'You' }]
                    : oldUsers.filter((u: any) => (u?._id || u?.id || u)?.toString() !== myUserId);

                if (updatedCount > 0 || updatedUsers.length > 0) {
                    const mergedItem = {
                        ...existingItem,
                        _id: photoId,
                        imageId: photoId,
                        isOriginalRequested: true,
                        originalRequestedCount: updatedCount,
                        originalRequestedBy: updatedUsers
                    };
                    if (idx >= 0) origReqs[idx] = mergedItem;
                    else origReqs.unshift(mergedItem);
                } else {
                    origReqs = origReqs.filter((p: any) => (p.imageId || p._id) !== photoId);
                }
            }

            const combinedMap = new Map<string, any>();
            albumFavs.forEach((p: any) => combinedMap.set(p.imageId || p._id, p));
            origReqs.forEach((p: any) => {
                const id = p.imageId || p._id;
                const existing = combinedMap.get(id);
                combinedMap.set(id, { ...existing, ...p });
            });

            return {
                ...prev,
                data: {
                    ...data,
                    albumFavorites: albumFavs,
                    originalRequests: origReqs,
                    combined: Array.from(combinedMap.values()),
                    counts: {
                        albumCount: albumFavs.length,
                        originalCount: origReqs.length,
                        combinedCount: combinedMap.size,
                    },
                },
            };
        });

        try {
            await photoApi.toggleSelection(photoId, { type, status: nextStatus });
            queryClient.invalidateQueries(['eventSelections', eventId]);
            toast.success(
                type === 'album'
                    ? (nextStatus ? 'Added to your Album picks (❤️)' : 'Removed from your picks')
                    : (nextStatus ? 'Saved as your High-Res Keeper (🔖)' : 'Removed from your keepers'),
                { id: `sel-${photoId}-${type}`, duration: 1800 }
            );
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update selection');
            queryClient.invalidateQueries(['eventPhotos', eventId]);
            queryClient.invalidateQueries(['myEventPhotos', eventId]);
            queryClient.invalidateQueries(['eventSelections', eventId]);
        }
    }, [currentUser, eventId, queryClient, proofTokenParam, accessCodeParam]);

    const handleNotifyPhotographer = useCallback(async () => {
        let clientName = currentUser?.name;
        if (!clientName) {
            const entered = prompt('Please enter your name or email so the photographer knows who submitted this selection:');
            if (entered === null) return;
            clientName = entered.trim() || 'Client';
        }

        setNotifying(true);
        try {
            await eventApi.notifySelectionReady(eventId, { clientName });

            const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://roopixo.com/events/${eventId}`;
            const shareText = buildSelectionShareText({
                eventName: event?.name || 'our event',
                clientName,
                albumCount: myAlbumCount,
                keeperCount: myBookmarkCount,
                url: shareUrl,
            });

            // 1. Copy text directly to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
            } catch (clipErr) {
                console.warn('Clipboard write fallback error:', clipErr);
            }

            // 2. Immediate toast with clipboard confirmation & 1-tap WhatsApp button
            toast.success(
                (t) => (
                    <div className="flex flex-col gap-1.5 py-0.5">
                        <span className="font-semibold text-zinc-900 dark:text-white">
                            Selection copied to clipboard! 📋
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            Ready to share via WhatsApp, Instagram, or Messages.
                        </span>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => toast.dismiss(t.id)}
                            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
                        >
                            Share via WhatsApp 💬
                        </a>
                    </div>
                ),
                { duration: 7500 }
            );

            // 3. Open Native Share Sheet if available (iOS / Android: WhatsApp, Instagram, Messages, etc.)
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                navigator.share({
                    title: `Photo Selection - ${event?.name || 'Event'}`,
                    text: shareText,
                    url: shareUrl,
                }).catch((shareErr: any) => {
                    if (shareErr?.name !== 'AbortError') {
                        console.warn('Native share dismissed or not supported:', shareErr);
                    }
                });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to notify photographer');
        } finally {
            setNotifying(false);
        }
    }, [eventId, currentUser, event?.name, myAlbumCount, myBookmarkCount]);

    /** Real total count of all event photos for authenticated visitors: server total first while streaming, then exact loaded count. */
    const authenticatedPhotoTotal = useMemo(() => {
        const responseData = (photosResult as any)?.data;
        const pagination = responseData?.pagination;
        const hasMore = Boolean(pagination?.hasMore || pagination?.lastKey);

        // When gallery photos have finished streaming and there are no more pages:
        // The real total count visible to the user is allPhotos.length.
        if (!photosLoading && photosResult && !hasMore) {
            return allPhotos.length;
        }

        const fromApi = extractEventPhotosTotal(photosResult);
        const apiTotal = fromApi !== undefined && fromApi > 0 ? fromApi : 0;

        const e = event as Record<string, unknown> | undefined;
        const fromField =
            typeof e?.photoCount === 'number' && !Number.isNaN(e.photoCount)
                ? e.photoCount
                : 0;
        const stats = e?.stats as Record<string, unknown> | undefined;
        const fromStats =
            stats && typeof stats.totalPhotos === 'number' && !Number.isNaN(stats.totalPhotos)
                ? stats.totalPhotos
                : 0;
        const fromArr = Array.isArray(e?.photos) ? e.photos.length : 0;

        const knownTotal = Math.max(apiTotal, fromField, fromStats, fromArr);
        return Math.max(knownTotal, allPhotos.length);
    }, [event, photosResult, photosLoading, allPhotos.length]);

    const currentIndex = useMemo(() => {
        if (!selectedPhoto) return -1;
        const selId = selectedPhoto.imageId || selectedPhoto._id;
        return displayPhotos.findIndex((p: any) => (p.imageId || p._id) === selId);
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
        !currentUser && !isProofingMode
            ? previewLoading
            : photoViewMode === 'my' && !!currentUser
              ? myPhotosLoading
              : photoViewMode === 'all'
                ? photosLoading
                : false;

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

    const handleBatchDownloadFavorites = async (photosToDownload?: any[], customLabel?: string) => {
        if (batchDownloading) return;
        const list = photosToDownload || (photoViewMode === 'album' ? myAlbumPhotos : (myPhotosFilter === 'favorites' ? myLikedPhotos : myPhotos));
        if (!list || list.length === 0) {
            toast.error('No photos to download.');
            return;
        }

        setBatchDownloading(true);
        const label = customLabel || (photoViewMode === 'album' ? 'Album' : (myPhotosFilter === 'favorites' ? 'Favorites' : 'Matched_Photos'));
        const friendlyName = label.replace(/_/g, ' ').toLowerCase();
        const t = toast.loading(`Preparing high-res ZIP of your ${list.length} ${friendlyName}...`);

        try {
            const photoIds = list.map((p: any) => p.imageId || p._id).filter(Boolean);
            const blob = await eventApi.downloadFavoritesZip(eventId, photoIds);
            const downloadUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/zip' }));
            const link = document.createElement('a');
            link.href = downloadUrl;
            const cleanName = (event?.name || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
            link.download = `${cleanName}_${label}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success(`Downloaded ${list.length} ${friendlyName}!`, { id: t });
        } catch (error) {
            console.error('Batch download error:', error);
            toast.error(`Failed to download ${friendlyName} ZIP. Please try again.`, { id: t });
        } finally {
            setBatchDownloading(false);
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
                    {eventProfile?.accentGlow && (
                        <div className={`pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full bg-gradient-to-br ${eventProfile.accentGlow} blur-3xl opacity-60`} />
                    )}

                    <div className="relative min-w-0">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <Link
                                href="/events"
                                className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-900/[0.06] transition-colors hover:bg-white hover:text-zinc-900 dark:bg-white/[0.07] dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/10"
                            >
                                <ChevronLeft size={18} />
                                Events
                            </Link>

                            {canManageEvent && (
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
                                    {eventProfile && (
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm border shadow-sm ${eventProfile.badgeClass}`}>
                                            <span className="mr-1">{eventProfile.icon}</span>
                                            {eventProfile.name.split('&')[0].trim()}
                                        </span>
                                    )}
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
                                        {!currentUser && !isProofingMode
                                            ? anonymousPhotoTotal != null
                                                ? `${anonymousPhotoTotal} photos`
                                                : previewPhotos.length > 0
                                                  ? `${previewPhotos.length}+ preview`
                                                  : 'Gallery'
                                            : photoViewMode === 'my' && !!currentUser
                                              ? `${totalPhotos} yours`
                                              : `${authenticatedPhotoTotal || totalPhotos} photos`}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {studioInfo && (studioInfo.businessName || studioInfo.logoUrl) && (
                                        <div className="inline-flex items-center gap-3 rounded-2xl border border-violet-500/25 bg-white/80 dark:bg-black/40 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                                            {studioInfo.logoUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={studioInfo.logoUrl}
                                                    alt={studioInfo.businessName || 'Studio Logo'}
                                                    className="h-6 w-auto max-w-[120px] object-contain rounded"
                                                />
                                            ) : (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                                                    {studioInfo.businessName ? studioInfo.businessName.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                            )}
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                                                    {studioInfo.businessName || 'Pro Studio Shoot'}
                                                </p>
                                                <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                                                    Client Proofing &amp; Selection Gallery
                                                </p>
                                            </div>
                                        </div>
                                    )}
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
                                                    {currentUser || isProofingMode
                                                        ? authenticatedPhotoTotal || totalPhotos
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
                                        onClick={() => setIsGuestUploadModalOpen(true)}
                                        variant="outline"
                                        className="h-12 w-full justify-center rounded-2xl border-violet-300/80 bg-violet-50/70 font-semibold text-violet-700 shadow-sm hover:bg-violet-100 hover:text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20 sm:h-[3rem] sm:w-auto sm:min-w-[10rem]"
                                    >
                                        <Camera size={18} className="mr-2 shrink-0 text-violet-600 dark:text-violet-400" />
                                        Share Photos
                                    </Button>

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
                                            {(() => {
                                                const schedule = formatEventSchedule(event.startDate, event.endDate);
                                                return (
                                                    <>
                                                        <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                                                            {schedule.dateLabel}
                                                        </dd>
                                                        <dd className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-gray-400">
                                                            <Clock size={14} className="shrink-0 text-violet-600 dark:text-violet-400" />
                                                            <span>{schedule.timeLabel}</span>
                                                        </dd>
                                                    </>
                                                );
                                            })()}
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
                        {!currentUser && !isProofingMode
                            ? 'Preview below — sign in for the full set and downloads.'
                            : photoViewMode === 'my'
                              ? !currentUser
                                ? 'Sign in to match your face and find your photos.'
                                : myPhotos.length > 0
                                  ? `${myPhotos.length} photo${myPhotos.length === 1 ? '' : 's'} with you`
                                  : 'No photos found with your face yet'
                              : photoViewMode === 'album'
                                ? !currentUser
                                  ? 'Sign in to view your personal album selection.'
                                  : myAlbumCount > 0
                                    ? `${myAlbumCount} photo${myAlbumCount === 1 ? '' : 's'} in your album selection`
                                    : 'Your album selection is currently empty'
                                : photoViewMode === 'bookmark'
                                  ? !currentUser
                                    ? 'Sign in to view your personal keepers.'
                                    : myBookmarkCount > 0
                                      ? `${myBookmarkCount} keeper${myBookmarkCount === 1 ? '' : 's'} saved`
                                      : 'No keepers saved yet'
                                  : (authenticatedPhotoTotal || totalPhotos) > 0
                                    ? `${authenticatedPhotoTotal || totalPhotos} moments from this event`
                                    : 'Photos will show here after upload'}
                    </p>
                </div>

                {isProofingDisabled && (
                    <div className="mb-6 mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-left text-amber-800 dark:text-amber-200 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                        <p className="text-xs sm:text-sm">
                            Client proofing is currently paused for this shoot. Please contact your photographer for an updated link.
                        </p>
                    </div>
                )}

                {isGuest && currentUser && !currentUser.faceRegistered && myPhotos.length === 0 && (
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

                {(currentUser || isProofingMode) && (
                    <div className="mb-8 flex flex-col items-center gap-3 px-0 sm:px-2">
                        <div className={`flex items-center justify-between sm:justify-center w-full max-w-2xl rounded-2xl p-1.5 gap-1.5 transition-all duration-300 ${softSurface}`}>
                            {/* TAB 1: ALL PHOTOS */}
                            <button
                                type="button"
                                onClick={() => handleSwitchViewMode('all')}
                                aria-label="View all event photos"
                                className={`min-h-[44px] whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                                    photoViewMode === 'all'
                                        ? 'flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                                        : 'flex-initial shrink-0 px-2.5 sm:px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                <ImageIcon className={`h-3.5 w-3.5 shrink-0 ${photoViewMode === 'all' ? 'text-white' : 'text-zinc-500 dark:text-gray-400'}`} />
                                <span className={photoViewMode === 'all' ? 'inline' : 'hidden sm:inline'}>
                                    {photoViewMode === 'all' ? 'All Photos' : 'All'}
                                </span>
                                {(authenticatedPhotoTotal || totalPhotos) > 0 && (
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        photoViewMode === 'all'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-zinc-200/80 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'
                                    }`}>
                                        {authenticatedPhotoTotal || totalPhotos}
                                    </span>
                                )}
                            </button>

                            {/* TAB 2: MY PHOTOS / FIND MY FACE */}
                            <button
                                type="button"
                                onClick={() => handleSwitchViewMode('my')}
                                aria-label="View my matched photos"
                                className={`min-h-[44px] whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                                    photoViewMode === 'my'
                                        ? 'flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                                        : 'flex-initial shrink-0 px-2.5 sm:px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                <Sparkles className={`h-3.5 w-3.5 shrink-0 ${photoViewMode === 'my' ? 'text-white' : 'text-violet-500 dark:text-violet-400'}`} />
                                <span className={photoViewMode === 'my' ? 'inline' : 'hidden sm:inline'}>
                                    {currentUser ? 'My photos' : 'Find My Face'}
                                </span>
                                {myPhotos.length > 0 && (
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        photoViewMode === 'my'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300'
                                    }`}>
                                        {myPhotos.length}
                                    </span>
                                )}
                                {isGuest && currentUser && !currentUser.faceRegistered && myPhotos.length === 0 && (
                                    <span className="inline-block w-2 h-2 shrink-0 rounded-full bg-amber-400 animate-pulse" title="Face registration required" />
                                )}
                            </button>

                            {/* TAB 3: ALBUM */}
                            <button
                                type="button"
                                onClick={() => handleSwitchViewMode('album')}
                                aria-label="View album favorites"
                                className={`min-h-[44px] whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                                    photoViewMode === 'album'
                                        ? 'flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25'
                                        : 'flex-initial shrink-0 px-2.5 sm:px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                <Heart className={`h-3.5 w-3.5 shrink-0 ${photoViewMode === 'album' ? 'fill-current text-white' : 'text-rose-500'}`} />
                                <span className={photoViewMode === 'album' ? 'inline' : 'hidden sm:inline'}>
                                    Album
                                </span>
                                {currentUser && myAlbumCount > 0 && (
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        photoViewMode === 'album'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'
                                    }`}>
                                        {myAlbumCount}
                                    </span>
                                )}
                            </button>

                            {/* TAB 4: KEEPERS */}
                            <button
                                type="button"
                                onClick={() => handleSwitchViewMode('bookmark')}
                                aria-label="View keepers"
                                className={`min-h-[44px] whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                                    photoViewMode === 'bookmark'
                                        ? 'flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25'
                                        : 'flex-initial shrink-0 px-2.5 sm:px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                            >
                                <Bookmark className={`h-3.5 w-3.5 shrink-0 ${photoViewMode === 'bookmark' ? 'fill-current text-white' : 'text-amber-500'}`} />
                                <span className={photoViewMode === 'bookmark' ? 'inline' : 'hidden sm:inline'}>
                                    Keepers
                                </span>
                                {currentUser && myBookmarkCount > 0 && (
                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        photoViewMode === 'bookmark'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                                    }`}>
                                        {myBookmarkCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Quick Notify Bar when client has selected items */}
                        {currentUser && (myAlbumCount > 0 || myBookmarkCount > 0) && (
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                                <span className="text-xs text-zinc-500 dark:text-gray-400 font-medium">
                                    Your personal picks: <strong className="text-rose-500">{myAlbumCount}</strong> Album • <strong className="text-amber-500">{myBookmarkCount}</strong> Keepers
                                </span>
                                <Button
                                    onClick={handleNotifyPhotographer}
                                    disabled={notifying}
                                    className="h-8 px-3 text-xs rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-sm transition"
                                >
                                    {notifying ? 'Notifying...' : 'Notify Photographer (My Selection Ready) 🚀'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Ceremony / Sub-Event Horizontal Filter Bar */}
                {event?.subEvents && event.subEvents.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2 px-1">
                            <button
                                type="button"
                                onClick={() => { setSelectedSubEventId(null); setCurrentPage(1); }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                                    selectedSubEventId === null
                                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-sm'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200/80 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-white/10 dark:hover:bg-zinc-800'
                                }`}
                            >
                                ✨ All Ceremonies
                                <span className="ml-1.5 opacity-75">({baseDisplayPhotos.length})</span>
                            </button>
                            {event.subEvents.map((sub: any) => {
                                const subIdStr = (sub._id || sub.id)?.toString();
                                const isSelected = selectedSubEventId === subIdStr;
                                const count = countPhotosInSubEvent(subIdStr);
                                return (
                                    <button
                                        key={subIdStr || sub.name}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSubEventId(isSelected ? null : subIdStr);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-sm'
                                                : 'bg-zinc-100 text-zinc-600 border-zinc-200/80 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-white/10 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {sub.name}
                                        {count > 0 && <span className="ml-1.5 opacity-75">({count})</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dedicated 1-Click Download for Active Ceremony Tab */}
                        {selectedSubEventId && (() => {
                            const activeCeremony = event.subEvents.find((s: any) => (s._id || s.id)?.toString() === selectedSubEventId);
                            if (!activeCeremony || displayPhotos.length === 0) return null;
                            return (
                                <div className="mt-2.5 mx-auto max-w-xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-violet-600/5 border border-violet-300/40 dark:border-violet-600/30 shadow-sm backdrop-blur-sm animate-fadeIn">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Layers size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                {activeCeremony.name}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                {displayPhotos.length} {displayPhotos.length === 1 ? 'photo' : 'photos'} available
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleBatchDownloadFavorites(displayPhotos, `${activeCeremony.name}_Ceremony`)}
                                        disabled={batchDownloading}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm transition active:scale-95 disabled:opacity-50 shrink-0"
                                        title={`Download all ${activeCeremony.name} photos as ZIP`}
                                    >
                                        {batchDownloading ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download size={13} />
                                        )}
                                        <span>Download {activeCeremony.name} ({displayPhotos.length})</span>
                                    </button>
                                </div>
                            );
                        })()}
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
                        {[...Array(!currentUser && !isProofingMode ? 4 : 8)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square animate-pulse rounded-xl bg-zinc-100 ring-1 ring-zinc-900/[0.04] dark:bg-white/[0.06] dark:ring-white/[0.06]"
                            />
                        ))}
                    </div>
                ) : (!currentUser && !isProofingMode) ? (
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
                        {/* Sub-filter inside My Photos */}
                        {photoViewMode === 'my' && currentUser && myPhotos.length > 0 && (
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-2.5 px-1">
                                <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMyPhotosFilter('all');
                                            setCurrentPage(1);
                                        }}
                                        className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                                            myPhotosFilter === 'all'
                                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/15 dark:text-white'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                        }`}
                                    >
                                        All Matched ({myPhotos.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMyPhotosFilter('favorites');
                                            setCurrentPage(1);
                                        }}
                                        className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                                            myPhotosFilter === 'favorites'
                                                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <Heart size={12} className={myPhotosFilter === 'favorites' ? 'fill-current' : 'text-rose-500'} />
                                        <span>Favorites ({myLikedPhotos.length})</span>
                                    </button>
                                </div>

                                {/* Contextual 1-Tap Download Button: Matched vs Favorites */}
                                {myPhotosFilter === 'all' && myPhotos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleBatchDownloadFavorites(myPhotos, 'Matched_Photos')}
                                        disabled={batchDownloading}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-violet-600 px-2 sm:px-2.5 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {batchDownloading ? (
                                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <Download size={11} />
                                        )}
                                        <span>Download Matched ({myPhotos.length})</span>
                                    </button>
                                )}

                                {myPhotosFilter === 'favorites' && myLikedPhotos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleBatchDownloadFavorites(myLikedPhotos, 'Favorites')}
                                        disabled={batchDownloading}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-2 sm:px-2.5 text-[11px] font-medium text-white shadow-sm shadow-rose-500/20 transition-all hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {batchDownloading ? (
                                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <Download size={11} />
                                        )}
                                        <span>Download Favorites ({myLikedPhotos.length})</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 1-Tap Download All Album Selections in Album Tab */}
                        {photoViewMode === 'album' && currentUser && myAlbumCount > 0 && (
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-2.5 px-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                    Showing your {myAlbumCount} shortlisted album picks
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleBatchDownloadFavorites(myAlbumPhotos, 'Album')}
                                    disabled={batchDownloading}
                                    className="inline-flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-2 sm:px-2.5 text-[11px] font-medium text-white shadow-sm shadow-rose-500/20 transition-all hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    {batchDownloading ? (
                                        <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Download size={11} />
                                    )}
                                    <span>Download All ({myAlbumCount})</span>
                                </button>
                            </div>
                        )}

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
                                    {/* Quick Selection Heart ❤️ and Bookmark 🔖 Buttons (Instagram-style counts) */}
                                    {(currentUser || isProofingMode) && (() => {
                                        const isMyAlbumPick = isSelectedByCurrentUser(photo, 'album');
                                        const albumCount = typeof photo.albumFavoritedCount === 'number'
                                            ? photo.albumFavoritedCount
                                            : Array.isArray(photo.albumFavoritedBy)
                                            ? photo.albumFavoritedBy.length
                                            : ((isMyAlbumPick || photo.isAlbumFavorite) ? 1 : 0);

                                        const isMyOriginalPick = isSelectedByCurrentUser(photo, 'original');
                                        const originalCount = typeof photo.originalRequestedCount === 'number'
                                            ? photo.originalRequestedCount
                                            : Array.isArray(photo.originalRequestedBy)
                                            ? photo.originalRequestedBy.length
                                            : ((isMyOriginalPick || photo.isOriginalRequested) ? 1 : 0);

                                        return (
                                            <div
                                                className="absolute top-2 right-2 z-10 flex items-center gap-1.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleSelection(photo, 'album');
                                                    }}
                                                    className={`backdrop-blur-md transition-all ${
                                                        isMyAlbumPick
                                                            ? 'flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30 opacity-100 scale-100 hover:scale-105 active:scale-95'
                                                            : albumCount > 0
                                                            ? 'flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-full bg-black/60 text-white/90 border border-white/25 opacity-100 hover:border-rose-400 hover:text-rose-400 active:scale-95'
                                                            : 'flex items-center justify-center p-2 sm:p-1.5 rounded-full bg-black/50 text-white/80 hover:text-rose-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95'
                                                    }`}
                                                    title={getSelectionTooltip(photo, 'album')}
                                                    aria-label="Toggle album selection"
                                                >
                                                    <Heart className={`h-3.5 w-3.5 ${isMyAlbumPick ? 'fill-current text-white' : ''}`} />
                                                    {albumCount > 0 && (
                                                        <span className="text-[11px] font-bold leading-none">{albumCount}</span>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleSelection(photo, 'original');
                                                    }}
                                                    className={`backdrop-blur-md transition-all ${
                                                        isMyOriginalPick
                                                            ? 'flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-full bg-amber-500 text-white shadow-md shadow-amber-500/30 opacity-100 scale-100 hover:scale-105 active:scale-95'
                                                            : originalCount > 0
                                                            ? 'flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-full bg-black/60 text-white/90 border border-white/25 opacity-100 hover:border-amber-400 hover:text-amber-400 active:scale-95'
                                                            : 'flex items-center justify-center p-2 sm:p-1.5 rounded-full bg-black/50 text-white/80 hover:text-amber-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95'
                                                    }`}
                                                    title={getSelectionTooltip(photo, 'original')}
                                                    aria-label="Toggle high-res bookmark"
                                                >
                                                    <Bookmark className={`h-3.5 w-3.5 ${isMyOriginalPick ? 'fill-current text-white' : ''}`} />
                                                    {originalCount > 0 && (
                                                        <span className="text-[11px] font-bold leading-none">{originalCount}</span>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}
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
                    photoViewMode === 'my' ? (
                        !currentUser ? (
                            <div className={`rounded-[1.65rem] px-6 py-12 sm:py-16 text-center ${softSurface} border border-violet-500/20 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent`}>
                                <div className="mx-auto mb-5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25">
                                    <Sparkles className="h-9 w-9" />
                                </div>
                                <h3 className="mb-2 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                                    Find Your Photos with Face Match
                                </h3>
                                <p className="mx-auto max-w-md text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-gray-300 mb-6">
                                    Sign in or create a quick account to register your face. Our AI will automatically scan this gallery and isolate only your photos!
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                                    <Button
                                        onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/register-face?redirect=/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2"
                                    >
                                        <Camera className="h-5 w-5" />
                                        Sign In to Find Photos
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/register?redirect=${encodeURIComponent(`/register-face?redirect=/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-5 rounded-xl border-zinc-300 dark:border-white/20 font-semibold"
                                    >
                                        Create Free Account
                                    </Button>
                                </div>
                            </div>
                        ) : isGuest && !currentUser?.faceRegistered && myPhotos.length === 0 ? (
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
                        ) : isOrganizer && myPhotos.length === 0 ? (
                            <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
                                    <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                    Personal Photos
                                </h3>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                    You are viewing this event as an organizer. Switch to &quot;All&quot; to view and manage all official photos.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPhotoViewMode('all')}
                                        className="rounded-xl px-5 h-11"
                                    >
                                        Browse All Event Photos{authenticatedPhotoTotal > 0 ? ` (${authenticatedPhotoTotal})` : ''}
                                    </Button>
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
                            myPhotosFilter === 'favorites' && myLikedPhotos.length === 0 && myPhotos.length > 0 ? (
                                <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface} border border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent`}>
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
                                        <Heart className="h-8 w-8 text-rose-500" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                        No Favorites Selected in My Photos Yet
                                    </h3>
                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                        Tap the Heart (❤️) icon on any of your {myPhotos.length} matched photos to shortlist your top favorites for quick viewing and downloading.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setMyPhotosFilter('all');
                                            setCurrentPage(1);
                                        }}
                                        className="rounded-xl px-5 h-11"
                                    >
                                        View All {myPhotos.length} Matched Photos
                                    </Button>
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
                                        Your face is registered and active! We scanned {authenticatedPhotoTotal} uploaded event photos, but didn&apos;t detect your face in them yet. Either the photographer hasn&apos;t uploaded photos of you yet, or you weren&apos;t captured in this event&apos;s current uploads.
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setPhotoViewMode('all')}
                                            className="rounded-xl px-5 h-11"
                                        >
                                            Browse All Event Photos ({authenticatedPhotoTotal})
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
                        )
                    ) : photoViewMode === 'album' ? (
                        !currentUser ? (
                            <div className={`rounded-[1.65rem] px-6 py-12 sm:py-16 text-center ${softSurface} border border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent`}>
                                <div className="mx-auto mb-5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/25">
                                    <Heart className="h-9 w-9 fill-current" />
                                </div>
                                <h3 className="mb-2 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                                    Curate Your Personal Album Picks
                                </h3>
                                <p className="mx-auto max-w-md text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-gray-300 mb-6">
                                    Sign in or create a quick account so you can shortlist your personal picks for the album!
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                                    <Button
                                        onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold shadow-lg shadow-rose-500/25 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                                    >
                                        <Heart className="h-5 w-5 fill-current" />
                                        Sign In to Select Photos
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/register?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-5 rounded-xl border-zinc-300 dark:border-white/20 font-semibold"
                                    >
                                        Create Free Account
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
                                    <Heart className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                    No Album Photos Selected Yet
                                </h3>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                    Tap the Heart (❤️) icon on any photo in the gallery to add it to your personal album selection.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setPhotoViewMode('all')}
                                    className="rounded-xl px-5 h-11"
                                >
                                    Browse All Photos
                                </Button>
                            </div>
                        )
                    ) : photoViewMode === 'bookmark' ? (
                        !currentUser ? (
                            <div className={`rounded-[1.65rem] px-6 py-12 sm:py-16 text-center ${softSurface} border border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent`}>
                                <div className="mx-auto mb-5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/25">
                                    <Bookmark className="h-9 w-9 fill-current" />
                                </div>
                                <h3 className="mb-2 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                                    Save Your Personal Keepers
                                </h3>
                                <p className="mx-auto max-w-md text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-gray-300 mb-6">
                                    Sign in or create a quick account to bookmark your personal high-res keepers for download and sharing!
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                                    <Button
                                        onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold shadow-lg shadow-amber-500/25 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white flex items-center justify-center gap-2"
                                    >
                                        <Bookmark className="h-5 w-5 fill-current" />
                                        Sign In to Save Keepers
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/register?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                        className="w-full sm:w-auto h-12 px-5 rounded-xl border-zinc-300 dark:border-white/20 font-semibold"
                                    >
                                        Create Free Account
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
                                    <Bookmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                                    No High-Res Keepers Bookmarked Yet
                                </h3>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-gray-400 mb-6">
                                    Tap the Bookmark (🔖) icon on any photo in the gallery to save it as your personal high-res keeper.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setPhotoViewMode('all')}
                                    className="rounded-xl px-5 h-11"
                                >
                                    Browse All Photos
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className={`rounded-[1.65rem] px-6 py-16 text-center ${softSurface}`}>
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                                <ImageIcon className="h-8 w-8 text-zinc-400 dark:text-gray-500" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                                {selectedSubEventId ? 'No photos in this ceremony yet' : 'No photos uploaded yet'}
                            </h3>
                            <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-gray-400">
                                {selectedSubEventId
                                    ? 'Try selecting "✨ All Ceremonies" or a different ceremony tag above.'
                                    : 'Uploaded photos from organizers and photographers will appear here.'}
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
                    onReport={() => handleReportPhoto(selectedPhoto)}
                    isAlbumFavorite={isSelectedByCurrentUser(selectedPhoto, 'album')}
                    isOriginalRequested={isSelectedByCurrentUser(selectedPhoto, 'original')}
                    albumCount={
                        typeof selectedPhoto?.albumFavoritedCount === 'number'
                            ? selectedPhoto.albumFavoritedCount
                            : Array.isArray(selectedPhoto?.albumFavoritedBy)
                            ? selectedPhoto.albumFavoritedBy.length
                            : (isSelectedByCurrentUser(selectedPhoto, 'album') || selectedPhoto?.isAlbumFavorite ? 1 : 0)
                    }
                    originalCount={
                        typeof selectedPhoto?.originalRequestedCount === 'number'
                            ? selectedPhoto.originalRequestedCount
                            : Array.isArray(selectedPhoto?.originalRequestedBy)
                            ? selectedPhoto.originalRequestedBy.length
                            : (isSelectedByCurrentUser(selectedPhoto, 'original') || selectedPhoto?.isOriginalRequested ? 1 : 0)
                    }
                    albumTooltip={selectedPhoto ? getSelectionTooltip(selectedPhoto, 'album') : undefined}
                    originalTooltip={selectedPhoto ? getSelectionTooltip(selectedPhoto, 'original') : undefined}
                    onToggleAlbum={(currentUser || isProofingMode) ? () => handleToggleSelection(selectedPhoto, 'album') : undefined}
                    onToggleOriginal={(currentUser || isProofingMode) ? () => handleToggleSelection(selectedPhoto, 'original') : undefined}
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

            {/* Guest Photo Upload Modal */}
            <GuestUploadModal
                isOpen={isGuestUploadModalOpen}
                onClose={() => setIsGuestUploadModalOpen(false)}
                eventId={eventId}
                eventName={event?.name || 'Event'}
                onSuccess={() => {
                    toast.success('Photos submitted for organizer review!');
                    queryClient.invalidateQueries(['event', eventId]);
                }}
            />

            {/* Selection Authentication Modal for Loved Ones */}
            {showSelectionAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-[#13111f] dark:border dark:border-white/10 text-center">
                        <button
                            type="button"
                            onClick={() => setShowSelectionAuthModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                            <Heart className="h-8 w-8 fill-current" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                            Sign in to Save Your Selections
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                            Please sign in or create a quick account so your selections are saved to you. This allows you and your loved ones to curate your personal picks together while keeping track of everyone&apos;s choices!
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25"
                            >
                                Log In to Select
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/register?redirect=${encodeURIComponent(`/events/${eventId}${proofTokenParam ? `?proofToken=${proofTokenParam}` : ''}`)}`)}
                                className="w-full h-11 rounded-xl font-semibold border-zinc-200 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                            >
                                Create Quick Account
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
