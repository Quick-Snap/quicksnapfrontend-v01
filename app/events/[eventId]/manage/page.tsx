'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from 'react-query';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    ChevronLeft,
    Trash2,
    Edit,
    Image as ImageIcon,
    Shield,
    AlertTriangle,
    X,
    Copy,
    Check,
    Sparkles,
    Upload,
    Camera,
    UserPlus,
    Mail,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';
import { canAccessEventManagePage, canFullManageEvent } from '@/lib/eventPermissions';
import { enrichPhotosWithDisplayUrls, getPhotoDisplayUrl } from '@/lib/photoUrl';
import RefreshAttendeeMatchesCard from '@/app/components/events/RefreshAttendeeMatchesCard';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/app/components/RoleGuard';
import { useAppStore } from '@/stores/appStore';

const MANAGE_CARD =
    'card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]';
const MANAGE_STAT =
    'stat-card group border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-white shadow-sm shadow-zinc-900/5 dark:border-white/10 dark:from-[#121022] dark:via-[#0d0c19] dark:to-[#0b0a14] dark:shadow-none';

/** Normalize GET /events/:id/photos body — supports { data: { photos } }, { data: Photo[] }, or { photos }. */
function normalizePhotosFromGet(res: any): any[] {
    if (!res) return [];
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.photos)) return d.photos;
    if (d?.data && Array.isArray(d.data.photos)) return d.data.photos;
    if (Array.isArray(res.photos)) return res.photos;
    return [];
}

function photoRowId(photo: any) {
    return photo?._id || photo?.imageId || '';
}

/** Reconcile GET /events/:id/photos with embedded `event.photos` (count / IDs can update before the list endpoint). */
function mergeMissingPhotosFromEvent(existing: any[], eventPhotos: any[] | undefined): any[] {
    if (!Array.isArray(eventPhotos) || eventPhotos.length === 0) return existing;
    const seen = new Set(existing.map((p) => String(photoRowId(p))).filter(Boolean));
    const additions: any[] = [];
    for (const raw of eventPhotos) {
        const id =
            typeof raw === 'string'
                ? raw.trim()
                : raw && typeof raw === 'object'
                  ? String(raw._id || raw.imageId || '').trim()
                  : '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            additions.push(raw);
        } else {
            additions.push({ _id: id });
        }
    }
    return additions.length > 0 ? [...existing, ...additions] : existing;
}

function isPhotoOfficial(photo: any) {
    return !!(photo?.isOfficial ?? photo?.is_official);
}

/** Prefer full-size URL for organizer preview; falls back to display/thumbnail. */
function getPhotoPreviewUrl(photo: any): string | undefined {
    if (!photo || typeof photo !== 'object') return undefined;
    const p = photo as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    return (
        str(p.url) ||
        str(p.s3Url) ||
        str(p.imageUrl) ||
        str(p.publicUrl) ||
        getPhotoDisplayUrl(photo)
    );
}

export default function ManageEventPage() {
    const { user } = useAuth();
    const uiTheme = useAppStore((s) => s.ui.theme);
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const eventId = params?.eventId as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [canDelete, setCanDelete] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [photographerEmail, setPhotographerEmail] = useState('');
    const [assigningPhotographer, setAssigningPhotographer] = useState(false);
    // Select photos for dashboard (official)
    const [allEventPhotos, setAllEventPhotos] = useState<any[]>([]);
    const [photosLoading, setPhotosLoading] = useState(false);
    const [selectedOfficialIds, setSelectedOfficialIds] = useState<Set<string>>(new Set());
    const [savingOfficial, setSavingOfficial] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<any>(null);

    // Countdown timer for delete confirmation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showDeleteModal && deleteCountdown > 0) {
            timer = setTimeout(() => {
                setDeleteCountdown(prev => prev - 1);
            }, 1000);
        } else if (deleteCountdown === 0) {
            setCanDelete(true);
        }
        return () => clearTimeout(timer);
    }, [showDeleteModal, deleteCountdown]);

    // Reset countdown when modal closes
    useEffect(() => {
        if (!showDeleteModal) {
            setDeleteCountdown(5);
            setCanDelete(false);
        }
    }, [showDeleteModal]);

    const applyPhotosAndOfficialState = useCallback((photos: any[]) => {
        setAllEventPhotos(photos);
        const official = new Set<string>();
        photos.forEach((p: any) => {
            const id = p._id || p.imageId;
            if (id && isPhotoOfficial(p)) official.add(id);
        });
        setSelectedOfficialIds(official);
    }, []);

    const refreshEventPhotos = useCallback(
        async (options?: { quiet?: boolean }) => {
            if (!eventId) return;
            const quiet = options?.quiet === true;
            if (quiet) {
                setPhotosLoading(true);
            } else {
                setLoading(true);
                setPhotosLoading(true);
            }
            try {
                const [eventOutcome, photosOutcome] = await Promise.allSettled([
                    eventApi.getById(eventId),
                    eventApi.getPhotos(eventId, { all: true, limit: 500 }),
                ]);

                const latestEvent =
                    eventOutcome.status === 'fulfilled' ? (eventOutcome.value as any)?.data : undefined;

                if (latestEvent) {
                    setEvent(latestEvent);
                } else if (!quiet && eventOutcome.status === 'rejected') {
                    console.error('Error fetching event:', eventOutcome.reason);
                    toast.error('Failed to load event details');
                    setEvent(null);
                }

                let photos =
                    photosOutcome.status === 'fulfilled'
                        ? normalizePhotosFromGet(photosOutcome.value)
                        : [];
                if (photosOutcome.status === 'rejected') {
                    console.error('Error fetching event photos:', photosOutcome.reason);
                    if (!quiet) toast.error('Failed to load photos for selection');
                }

                if (latestEvent?.photos?.length) {
                    photos = mergeMissingPhotosFromEvent(photos, latestEvent.photos);
                }

                photos = await enrichPhotosWithDisplayUrls(photos, photoRowId);
                applyPhotosAndOfficialState(photos);
            } catch (err) {
                console.error('Error loading event / photos:', err);
                toast.error(quiet ? 'Failed to refresh photos' : 'Failed to load event');
            } finally {
                if (!quiet) setLoading(false);
                setPhotosLoading(false);
            }
        },
        [eventId, applyPhotosAndOfficialState]
    );

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;

        const run = async () => {
            await refreshEventPhotos({ quiet: false });
            if (cancelled) return;
            const key = `qs_event_photos_dirty_${eventId}`;
            if (sessionStorage.getItem(key)) {
                sessionStorage.removeItem(key);
                await new Promise((r) => setTimeout(r, 650));
                if (!cancelled) await refreshEventPhotos({ quiet: true });
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [eventId, refreshEventPhotos]);

    const getPhotoId = (photo: any) => photoRowId(photo);

    /** Include both _id and imageId so the API can match whichever the backend stores. */
    const expandIdsForPatch = (ids: string[]) => {
        const out = new Set<string>();
        ids.forEach((id) => {
            if (!id) return;
            out.add(String(id));
            const photo = allEventPhotos.find((p) => getPhotoId(p) === id);
            if (photo?._id) out.add(String(photo._id));
            if (photo?.imageId) out.add(String(photo.imageId));
        });
        return Array.from(out);
    };

    const photosOnDashboard = useMemo(
        () => allEventPhotos.filter((p) => isPhotoOfficial(p)),
        [allEventPhotos]
    );
    const photosNotOnDashboard = useMemo(
        () => allEventPhotos.filter((p) => !isPhotoOfficial(p)),
        [allEventPhotos]
    );

    const displayedPhotoCount = useMemo(() => {
        const fromArr = Array.isArray(event?.photos) ? event.photos.length : 0;
        const fromField =
            typeof event?.photoCount === 'number' && !Number.isNaN(event.photoCount)
                ? event.photoCount
                : 0;
        return Math.max(fromArr, fromField, allEventPhotos.length);
    }, [event?.photos, event?.photoCount, allEventPhotos.length]);

    const togglePhotoOfficial = (photo: any) => {
        const id = getPhotoId(photo);
        if (!id) return;
        setSelectedOfficialIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSaveOfficialSelection = async () => {
        setSavingOfficial(true);
        try {
            const currentOfficial = new Set(
                allEventPhotos.filter((p: any) => isPhotoOfficial(p)).map((p: any) => getPhotoId(p)).filter(Boolean)
            );
            const toPromote = Array.from(selectedOfficialIds).filter((id) => !currentOfficial.has(id));
            const toDemote = Array.from(currentOfficial).filter((id) => !selectedOfficialIds.has(id));
            if (toPromote.length > 0) {
                await eventApi.setPhotosOfficial(eventId, {
                    imageIds: expandIdsForPatch(toPromote),
                    isOfficial: true,
                });
            }
            if (toDemote.length > 0) {
                await eventApi.setPhotosOfficial(eventId, {
                    imageIds: expandIdsForPatch(toDemote),
                    isOfficial: false,
                });
            }
            if (toPromote.length > 0 || toDemote.length > 0) {
                toast.success(
                    `Gallery updated: ${toPromote.length} added${toDemote.length ? `, ${toDemote.length} removed` : ''}`
                );
                const [eventRes, photosRes] = await Promise.allSettled([
                    eventApi.getById(eventId),
                    eventApi.getPhotos(eventId, { all: true, limit: 500 }),
                ]);
                const latestEvent =
                    eventRes.status === 'fulfilled' ? (eventRes.value as any)?.data : undefined;
                if (latestEvent) setEvent(latestEvent);
                let photos =
                    photosRes.status === 'fulfilled' ? normalizePhotosFromGet(photosRes.value) : [];
                if (latestEvent?.photos?.length) {
                    photos = mergeMissingPhotosFromEvent(photos, latestEvent.photos);
                }
                photos = await enrichPhotosWithDisplayUrls(photos, photoRowId);
                applyPhotosAndOfficialState(photos);
            } else {
                toast('No changes to save', { icon: 'ℹ️' });
            }
        } catch (err: any) {
            console.error('Error saving official selection:', err);
            toast.error(err.response?.data?.message || 'Failed to update dashboard photos');
        } finally {
            setSavingOfficial(false);
        }
    };

    const handleCopyCode = () => {
        if (event?.accessCode) {
            navigator.clipboard.writeText(event.accessCode);
            setCodeCopied(true);
            toast.success('Access code copied!');
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const handleAssignPhotographer = async () => {
        if (!photographerEmail.trim()) {
            toast.error('Please enter a photographer email');
            return;
        }
        
        setAssigningPhotographer(true);
        try {
            await eventApi.assignPhotographer(eventId, photographerEmail);
            toast.success('Photographer assigned successfully!');
            setPhotographerEmail('');
            // Refresh event data
            const data = await eventApi.getById(eventId);
            setEvent(data.data);
        } catch (error: any) {
            console.error('Error assigning photographer:', error);
            toast.error(error.response?.data?.message || 'Failed to assign photographer');
        } finally {
            setAssigningPhotographer(false);
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        
        setDeleting(true);
        try {
            await eventApi.delete(eventId);
            toast.success('Event deleted successfully');
            
            // Invalidate queries
            await queryClient.invalidateQueries('events');
            await queryClient.invalidateQueries('myOrganizedEvents');
            await queryClient.invalidateQueries('photographerEvents');
            
            router.push('/dashboard');
            router.refresh();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast.error(error.response?.data?.message || 'Failed to delete event');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-white/20 dark:border-t-violet-500" />
                    <p className="font-medium text-zinc-500 dark:text-gray-400">Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">Event not found</h2>
                    <p className="mb-6 text-zinc-600 dark:text-gray-400">The event you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/dashboard">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isActive = new Date(event.endDate) > new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const canAccessManage = canAccessEventManagePage(user, event);
    const canFullManage = canFullManageEvent(user, event);

    if (!canAccessManage) {
        return (
            <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
                <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
                    <Shield className="h-14 w-14 text-amber-400/90 mb-4" />
                    <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">Access denied</h2>
                    <p className="mb-6 max-w-md text-zinc-600 dark:text-gray-400">
                        Only the event organizer, an assigned photographer, or an admin can open this page.
                    </p>
                    <Link href={`/events/${eventId}`}>
                        <Button variant="outline">
                            Back to event
                        </Button>
                    </Link>
                </div>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-60" />
                    <div className="absolute -bottom-10 -left-14 h-60 w-60 bg-violet-300/35 blur-3xl dark:bg-violet-500/20" />
                    <div className="absolute right-0 top-0 h-64 w-64 bg-indigo-300/25 blur-3xl dark:bg-indigo-500/15" />
                    <div className="relative flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Link 
                                href="/dashboard" 
                                className="inline-flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white"
                            >
                                <ChevronLeft size={20} />
                                <span className="font-medium">Back to Dashboard</span>
                            </Link>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive 
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200' 
                                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/20 dark:bg-white/10 dark:text-gray-200'
                            }`}>
                                {isActive ? 'Active' : 'Past'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                                <Shield className="h-4 w-4 text-violet-600 dark:text-violet-200" />
                                <span className="text-xs uppercase tracking-[0.25em] text-violet-800/90 dark:text-gray-200">Event management</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-semibold leading-tight text-zinc-900 dark:text-white md:text-4xl">{event.name}</h1>
                                <span className="rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                                    {displayedPhotoCount} photos
                                </span>
                            </div>
                            <p className="text-lg text-zinc-600 dark:text-gray-300">{event.description || 'No description provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className={`${MANAGE_STAT}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Attendees</p>
                                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{event.attendees?.length || 0}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
                                <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"></div>
                    </div>

                    <div className={`${MANAGE_STAT}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Photos</p>
                                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{displayedPhotoCount}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
                                <ImageIcon className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"></div>
                    </div>

                    <div className={`${MANAGE_STAT}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Photographers</p>
                                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{event.photographers?.length || 0}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-200/80 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
                                <Sparkles className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    </div>

                    <div className={`${MANAGE_STAT}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Status</p>
                                <p className={`text-2xl font-semibold ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-gray-300'}`}>
                                    {isActive ? 'Live' : 'Ended'}
                                </p>
                            </div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-zinc-200 dark:bg-white/5'}`}>
                                <Clock className={`h-5 w-5 ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-gray-400'}`} />
                            </div>
                        </div>
                        <div className={`mt-4 h-1 rounded-full ${isActive ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-slate-400 to-zinc-400 dark:from-slate-500 dark:to-gray-500'}`}></div>
                    </div>
                </div>

                {/* Event Details */}
                <div className={MANAGE_CARD}>
                    <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
                        <Calendar className="text-violet-600 dark:text-violet-300" size={22} />
                        Event Details
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-100 dark:border-violet-400/20 dark:bg-violet-500/15">
                                    <Calendar className="text-violet-700 dark:text-violet-300" size={20} />
                                </div>
                                <div>
                                    <p className="mb-1 font-medium text-zinc-900 dark:text-white">Date</p>
                                    <p className="text-sm text-zinc-600 dark:text-gray-300">
                                        {startDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/15">
                                    <Clock className="text-blue-700 dark:text-blue-300" size={20} />
                                </div>
                                <div>
                                    <p className="mb-1 font-medium text-zinc-900 dark:text-white">Time</p>
                                    <p className="text-sm text-zinc-600 dark:text-gray-300">
                                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-pink-100 dark:border-pink-400/20 dark:bg-pink-500/15">
                                    <MapPin className="text-pink-700 dark:text-pink-300" size={20} />
                                </div>
                                <div>
                                    <p className="mb-1 font-medium text-zinc-900 dark:text-white">Venue</p>
                                    <p className="text-sm text-zinc-600 dark:text-gray-300">{event.venue || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Access Code */}
                            {event.accessCode && (
                                <div className="rounded-xl border border-violet-200/90 bg-gradient-to-r from-violet-50 to-indigo-50 p-4 dark:border-violet-500/30 dark:from-[#181025] dark:to-[#121022]">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="font-medium text-zinc-900 dark:text-white">Access Code</p>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="flex items-center gap-1 text-xs text-violet-700 transition-colors hover:text-violet-900 dark:text-violet-200 dark:hover:text-violet-100"
                                        >
                                            {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                                            {codeCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p className="font-mono text-2xl font-semibold tracking-widest text-violet-800 dark:text-violet-200">{event.accessCode}</p>
                                    <p className="mt-2 text-xs text-zinc-500 dark:text-gray-500">Share this code with guests to let them join</p>
                                </div>
                            )}

                            {/* Visibility */}
                            <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                <p className="mb-1 font-medium text-zinc-900 dark:text-white">Visibility</p>
                                <p className={`text-sm ${event.isPublic ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    {event.isPublic ? '🌐 Public Event' : '🔒 Private Event'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assign Photographer Section */}
                {canFullManage && (
                <div className={MANAGE_CARD}>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20">
                            <Camera className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Assign Photographer</h2>
                            <p className="text-sm text-zinc-500 dark:text-gray-400">Invite photographers to capture this event</p>
                        </div>
                    </div>

                    {/* Assignment Form */}
                    <div className="mb-6 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 p-6 dark:border-emerald-500/15 dark:from-emerald-500/5 dark:to-teal-500/5">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Mail className="h-5 w-5 text-zinc-400 dark:text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Enter photographer's email address"
                                    value={photographerEmail}
                                    onChange={(e) => setPhotographerEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAssignPhotographer()}
                                    className="input w-full rounded-xl py-3.5 pl-12 pr-4 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAssignPhotographer}
                                disabled={!photographerEmail.trim() || assigningPhotographer}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                            >
                                {assigningPhotographer ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-5 w-5" />
                                        Assign Photographer
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="mt-3 flex items-center gap-1 text-xs text-zinc-500 dark:text-gray-500">
                            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            The photographer will receive access to upload photos for this event
                        </p>
                    </div>

                    {/* Current Photographers */}
                    {event.photographers && event.photographers.length > 0 && (
                        <div>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-gray-400">
                                Assigned Photographers ({event.photographers.length})
                            </h3>
                            <div className="grid gap-3">
                                {event.photographers.map((photographer: any, index: number) => (
                                    <div
                                        key={photographer._id || photographer.id || index}
                                        className="flex items-center gap-4 rounded-xl border border-zinc-200/90 bg-white p-4 transition-colors hover:border-emerald-300/70 dark:border-white/5 dark:bg-white/5 dark:hover:border-emerald-500/20"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white shadow-lg shadow-emerald-500/20">
                                            {(photographer.name || photographer.email || 'P').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium text-zinc-900 dark:text-white">
                                                {photographer.name || 'Photographer'}
                                            </p>
                                            <p className="truncate text-sm text-zinc-500 dark:text-gray-500">
                                                {photographer.email || 'No email provided'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!event.photographers || event.photographers.length === 0) && (
                        <div className="py-8 text-center text-zinc-500 dark:text-gray-500">
                            <Camera className="mx-auto mb-3 h-12 w-12 text-zinc-400 dark:text-gray-600" />
                            <p className="font-medium text-zinc-600 dark:text-gray-400">No photographers assigned yet</p>
                            <p className="text-sm text-zinc-500 dark:text-gray-500">Add photographers using the form above</p>
                        </div>
                    )}
                </div>
                )}

                {/* Quick Actions */}
                <div className={MANAGE_CARD}>
                    <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Link href={`/organizer/events/${eventId}/upload`} className="action-card group border-zinc-200/90 bg-white hover:border-violet-300/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
                                <Upload className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900 dark:text-white">Upload Photos</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-400">Add photos to this event</p>
                            </div>
                        </Link>

                        <Link href={`/events/${eventId}`} className="action-card group border-zinc-200/90 bg-white hover:border-blue-300/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200/80 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
                                <ImageIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900 dark:text-white">View Event Page</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-400">See public event view</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <RefreshAttendeeMatchesCard eventId={eventId} event={event} variant={uiTheme === 'dark' ? 'dark' : 'light'} />

                {/* Select photos for dashboard (official gallery) */}
                {canFullManage && (
                <div className={MANAGE_CARD}>
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/20">
                            <ImageIcon className="h-6 w-6 text-violet-700 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Public event gallery</h2>
                            <p className="text-sm text-zinc-500 dark:text-gray-400">
                                Add photos from the pool below, then save. They move to “On public gallery” once the server confirms. Click a live photo to remove it from the public page.
                            </p>
                        </div>
                    </div>
                    {photosLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-8">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-square animate-pulse rounded-xl border border-zinc-200/90 bg-zinc-100 dark:border-white/5 dark:bg-white/5" />
                            ))}
                        </div>
                    ) : allEventPhotos.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-200/90 py-12 text-center text-zinc-500 dark:border-white/5 dark:text-gray-500">
                            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-zinc-400 dark:text-gray-600" />
                            <p className="font-medium text-zinc-600 dark:text-gray-400">No photos yet</p>
                            <p className="text-sm text-zinc-500 dark:text-gray-500">Upload photos first, then choose which ones appear on the public event gallery.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <span className="text-sm text-zinc-600 dark:text-gray-400">
                                    <span className="font-medium text-emerald-700 dark:text-emerald-300/90">{photosOnDashboard.length}</span> on public gallery
                                    <span className="mx-2 text-zinc-300 dark:text-white/20">·</span>
                                    <span className="text-zinc-700 dark:text-gray-300">{photosNotOnDashboard.length}</span> in pool
                                    <span className="mx-2 text-zinc-300 dark:text-white/20">·</span>
                                    {selectedOfficialIds.size} marked for gallery after save
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSaveOfficialSelection}
                                    disabled={savingOfficial}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                                >
                                    {savingOfficial ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Update dashboard
                                        </>
                                    )}
                                </button>
                            </div>

                            {photosOnDashboard.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300/90">
                                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                        On public gallery
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {photosOnDashboard.map((photo: any, index: number) => {
                                            const id = getPhotoId(photo);
                                            const displayUrl = getPhotoDisplayUrl(photo);
                                            const isSelected = !!(id && selectedOfficialIds.has(id));
                                            const pendingRemove = isPhotoOfficial(photo) && !isSelected;
                                            return (
                                                <div
                                                    key={id || `on-gallery-${index}`}
                                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-zinc-100/95 transition-all dark:bg-[rgba(15,12,24,0.92)]"
                                                    style={{
                                                        borderColor: isSelected
                                                            ? 'rgba(16, 185, 129, 0.45)'
                                                            : 'rgba(251, 191, 36, 0.45)',
                                                    }}
                                                    onClick={() => togglePhotoOfficial(photo)}
                                                >
                                                    {displayUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={displayUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                                            <ImageIcon className="h-10 w-10 text-gray-600" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                    <div className="absolute top-2 left-2 right-2 flex flex-wrap items-start justify-end gap-1.5">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                pendingRemove
                                                                    ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                                                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                            }`}
                                                        >
                                                            {pendingRemove ? 'Removing after save' : 'Live on gallery'}
                                                        </span>
                                                        <div
                                                            className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-emerald-500 border-emerald-400'
                                                                    : 'bg-black/40 border-white/30'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        title="Preview"
                                                        aria-label="Preview photo"
                                                        className="absolute bottom-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 border border-white/20 text-white hover:bg-black/80 hover:border-white/35 transition-colors shadow-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewPhoto(photo);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-300/90">
                                    <span className="inline-block h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                                    Pool — not on public gallery yet
                                </h3>
                                {photosNotOnDashboard.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-zinc-200/90 py-6 text-center text-sm text-zinc-500 dark:border-white/5 dark:text-gray-500">
                                        All uploaded photos are on the public gallery. Remove some from the section above if you want them back in the pool.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {photosNotOnDashboard.map((photo: any, index: number) => {
                                            const id = getPhotoId(photo);
                                            const displayUrl = getPhotoDisplayUrl(photo);
                                            const isSelected = !!(id && selectedOfficialIds.has(id));
                                            return (
                                                <div
                                                    key={id || `pool-${index}`}
                                                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-zinc-100/95 transition-all dark:bg-[rgba(15,12,24,0.92)] ${
                                                        isSelected ? '' : 'border-zinc-300 dark:border-white/10'
                                                    }`}
                                                    style={
                                                        isSelected ? { borderColor: 'rgba(139, 92, 246, 0.5)' } : undefined
                                                    }
                                                    onClick={() => togglePhotoOfficial(photo)}
                                                >
                                                    {displayUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={displayUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                                            <ImageIcon className="h-10 w-10 text-gray-600" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                    <div className="absolute top-2 left-2 right-2 flex flex-wrap items-start justify-end gap-1.5">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                isSelected
                                                                    ? 'bg-violet-500/25 text-violet-200 border-violet-500/50'
                                                                    : 'bg-white/10 text-gray-400 border-white/20'
                                                            }`}
                                                        >
                                                            {isSelected ? 'Will add after save' : 'Not on gallery'}
                                                        </span>
                                                        <div
                                                            className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-violet-500 border-violet-400'
                                                                    : 'bg-black/40 border-white/30'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        title="Preview"
                                                        aria-label="Preview photo"
                                                        className="absolute bottom-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 border border-white/20 text-white hover:bg-black/80 hover:border-white/35 transition-colors shadow-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewPhoto(photo);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                )}

                {/* Danger Zone */}
                {canFullManage && (
                <div className="card border-red-200 bg-red-50/80 shadow-sm shadow-zinc-900/5 dark:border-red-500/25 dark:bg-red-500/5 dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-red-800 dark:text-red-300">
                        <AlertTriangle size={24} />
                        Danger Zone
                    </h2>
                    <p className="mb-6 text-zinc-600 dark:text-gray-400">
                        Once you delete an event, there is no going back. All photos and data associated with this event will be permanently removed.
                    </p>
                    <Button
                        onClick={() => setShowDeleteModal(true)}
                        className="border border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/40 dark:hover:border-red-500/60 dark:hover:bg-red-500/25"
                    >
                        <Trash2 size={18} className="mr-2" />
                        Delete Event
                    </Button>
                </div>
                )}

                {/* Organizer photo preview (does not change selection) */}
                {previewPhoto && (
                    <div
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Photo preview"
                        onClick={() => setPreviewPhoto(null)}
                    >
                        <button
                            type="button"
                            className="absolute top-4 right-4 z-[71] w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                            onClick={() => setPreviewPhoto(null)}
                            aria-label="Close preview"
                        >
                            <X size={20} />
                        </button>
                        <div
                            className="relative flex w-[80vw] max-w-4xl max-h-[80vh] flex-col items-stretch justify-center gap-3 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {getPhotoPreviewUrl(previewPhoto) ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={getPhotoPreviewUrl(previewPhoto)}
                                    alt={previewPhoto.fileName || 'Photo preview'}
                                    className="mx-auto max-h-[min(72vh,calc(80vh-7rem))] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                                />
                            ) : (
                                <div className="rounded-xl border border-zinc-200/90 bg-zinc-50 px-8 py-12 text-center text-zinc-500 dark:border-white/10 dark:bg-[#0f0c18] dark:text-gray-400">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                                    <p>No preview URL available for this photo.</p>
                                </div>
                            )}
                            {previewPhoto.fileName && (
                                <p className="mt-4 max-w-full truncate px-2 text-sm text-zinc-500 dark:text-gray-400">
                                    {previewPhoto.fileName}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-md animate-in rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-900/15 fade-in zoom-in duration-200 dark:border-white/10 dark:bg-[#0f0c18] dark:shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                                    <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Delete Event?</h3>
                            <p className="mb-2 text-zinc-600 dark:text-gray-400">
                                You are about to delete <span className="font-semibold text-zinc-900 dark:text-white">&quot;{event.name}&quot;</span>
                            </p>
                            <p className="mb-6 text-sm text-zinc-500 dark:text-gray-500">
                                This action cannot be undone. All photos, attendee data, and event information will be permanently deleted.
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowDeleteModal(false)}
                                    variant="outline"
                                    className="flex-1 border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={!canDelete || deleting}
                                    className={`flex-1 ${
                                        canDelete 
                                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                                            : 'bg-red-500/20 text-red-400/50 cursor-not-allowed'
                                    }`}
                                >
                                    {deleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : canDelete ? (
                                        <>
                                            <Trash2 size={16} className="mr-2" />
                                            Delete Event
                                        </>
                                    ) : (
                                        <>Wait {deleteCountdown}s...</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}

