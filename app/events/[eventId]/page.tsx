'use client';

import { useState, useEffect } from 'react';
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
    X,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, photoApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import Pagination from '@/app/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from 'react-query';

const PHOTOS_PER_PAGE = 12;

const GALLERY_SURFACE =
    'border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]';

const STAT_TILE =
    'stat-card border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-white shadow-sm shadow-zinc-900/5 dark:border-white/10 dark:from-[#121022] dark:via-[#0d0c19] dark:to-[#0b0a14] dark:shadow-none';

export default function PublicEventPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const eventId = params?.eventId as string;

    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [photoViewMode, setPhotoViewMode] = useState<'all' | 'my'>('all');

    // Check if user is a guest (not organizer or admin)
    const isGuest = currentUser && currentUser.role !== 'organizer' && currentUser.role !== 'admin';

    // Fetch Event details
    const { data: eventResult, isLoading: loading } = useQuery(
        ['event', eventId],
        () => eventApi.getById(eventId),
        { enabled: !!eventId }
    );
    const event = eventResult?.data;

    // Fetch official event gallery photos (dashboard shows only official)
    const { data: photosResult, isLoading: photosLoading } = useQuery(
        ['eventPhotos', eventId],
        () => eventApi.getPhotos(eventId, { limit: 500 }),
        {
            enabled: !!eventId && !!currentUser,
            staleTime: 5 * 60 * 1000, // 5 mins cache
        }
    );
    const allPhotos = photosResult?.data?.photos || [];

    // Fetch My Photos (filtered by eventId) - only for guest users
    const { data: myPhotosResult, isLoading: myPhotosLoading } = useQuery(
        ['myEventPhotos', eventId],
        () => photoApi.getMyPhotos({ eventId, limit: 500 }),
        {
            enabled: !!eventId && !!currentUser && !!isGuest,
            staleTime: 5 * 60 * 1000, // 5 mins cache
        }
    );
    const myPhotos = myPhotosResult?.data?.photos || [];

    // Determine which photos to display based on view mode
    const displayPhotos = photoViewMode === 'my' && isGuest ? myPhotos : allPhotos;
    const isLoadingPhotos =
        !currentUser
            ? authLoading
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
        // Scroll to gallery section
        window.scrollTo({ top: 400, behavior: 'smooth' });
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
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.name,
                    text: event.description,
                    url: url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-gray-400 font-medium">Loading event...</p>
                </div>
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
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl mb-10 border border-zinc-200/80 dark:border-white/5 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] shadow-[0_25px_90px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-mesh opacity-35 dark:opacity-60" />
                <div className="absolute -left-16 -bottom-10 w-72 h-72 bg-violet-400/15 dark:bg-violet-500/20 blur-3xl" />
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/15 blur-3xl" />

                <div className="relative px-6 py-10 md:px-10 md:py-12">
                    <Link href="/events" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white mb-6 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Events</span>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start min-w-0">
                        {/* Event Info */}
                        <div className="space-y-6 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${isActive
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300/90 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30'
                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200/90 dark:bg-white/10 dark:text-gray-200 dark:border-white/20'
                                    }`}>
                                    {isActive ? 'Active Event' : 'Past Event'}
                                </span>
                                {event.isPublic && (
                                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/90 dark:bg-white/10 dark:text-gray-200 dark:border-white/20">
                                        Public
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs bg-zinc-100 border border-zinc-200/90 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
                                    {!currentUser
                                        ? 'Sign in to view gallery'
                                        : photoViewMode === 'my' && isGuest
                                          ? `${totalPhotos} my photos`
                                          : `${allPhotos.length} photos`}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-semibold text-zinc-900 dark:text-white leading-tight">{event.name}</h1>
                                <p className="text-lg text-zinc-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                    {event.description || 'Join us for an amazing event!'}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`${STAT_TILE} rounded-2xl p-4`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-violet-100 border border-violet-200/90 dark:bg-white/5 dark:border-white/10 rounded-xl flex items-center justify-center">
                                            <Users className="text-violet-600 dark:text-violet-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 dark:text-gray-400 text-sm">Attendees</p>
                                            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{event.attendees?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`${STAT_TILE} rounded-2xl p-4`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-100 border border-indigo-200/90 dark:bg-white/5 dark:border-white/10 rounded-xl flex items-center justify-center">
                                            <Camera className="text-indigo-600 dark:text-indigo-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 dark:text-gray-400 text-sm">Photos</p>
                                            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                                {currentUser ? allPhotos.length : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={handleShare}
                                    className="border border-zinc-200/90 bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-semibold px-6 py-3 rounded-xl shadow-md shadow-zinc-900/5 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)]"
                                >
                                    <Share2 size={20} className="mr-2" />
                                    Share Event
                                </Button>
                            </div>
                        </div>

                        {/* Event Details Card */}
                        <div className="rounded-2xl bg-white shadow-xl shadow-zinc-900/10 p-4 sm:p-8 border border-zinc-200/90 min-w-0 dark:bg-[#0f0c18] dark:border-white/10 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                                <Sparkles className="text-violet-600 dark:text-violet-300" size={24} />
                                Event Details
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200/90 dark:bg-white/5 dark:border-white/10 min-w-0">
                                    <div className="w-12 h-12 bg-violet-100 border border-violet-200/90 dark:bg-violet-500/15 dark:border-violet-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Calendar className="text-violet-600 dark:text-violet-300" size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-zinc-900 dark:text-white mb-1">Date & Time</p>
                                        <p className="text-zinc-600 dark:text-gray-300 text-sm">
                                            {startDate.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-zinc-500 dark:text-gray-400 text-sm flex items-center gap-2 mt-1">
                                            <Clock size={14} className="text-violet-600 dark:text-violet-300" />
                                            {startDate.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })} - {endDate.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200/90 dark:bg-white/5 dark:border-white/10 min-w-0">
                                    <div className="w-12 h-12 bg-pink-100 border border-pink-200/90 dark:bg-pink-500/15 dark:border-pink-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-pink-600 dark:text-pink-300" size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-zinc-900 dark:text-white mb-1">Location</p>
                                        <p className="text-zinc-600 dark:text-gray-300 text-sm break-words">{event.venue || event.location || 'To be announced'}</p>
                                    </div>
                                </div>

                                {event.organizer && (
                                    <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200/90 dark:bg-white/5 dark:border-white/10 min-w-0">
                                        <div className="w-12 h-12 bg-emerald-100 border border-emerald-200/90 dark:bg-emerald-500/15 dark:border-emerald-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <User className="text-emerald-700 dark:text-emerald-300" size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-zinc-900 dark:text-white mb-1">Organized by</p>
                                            <p className="text-zinc-600 dark:text-gray-300 text-sm break-words">{event.organizer.name}</p>
                                            <p className="text-zinc-500 dark:text-gray-500 text-xs break-all">{event.organizer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {(currentUser?.role === 'admin' || event.organizer?._id === currentUser?.id || event.organizer === currentUser?.id) && event.accessCode && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200/90 dark:from-[#181025] dark:to-[#121022] dark:border-violet-500/30 min-w-0">
                                        <div className="w-12 h-12 bg-white border border-zinc-200/90 dark:bg-white/5 dark:border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-violet-600 dark:text-violet-300" size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-zinc-900 dark:text-white mb-1">Access Code</p>
                                            <p className="text-violet-800 dark:text-violet-200 text-lg font-mono tracking-widest font-semibold break-all">{event.accessCode}</p>
                                            <p className="text-zinc-500 dark:text-gray-500 text-xs mt-1">Share this code with guests to let them join.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Gallery Section */}
            <div className="py-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                        <ImageIcon className="text-violet-600 dark:text-violet-400" size={36} />
                        Event Gallery
                    </h2>
                    <p className="text-zinc-600 dark:text-gray-400 text-lg">
                        {!currentUser
                            ? 'Log in or create an account to browse this gallery.'
                            : totalPhotos > 0
                              ? `Browse through ${totalPhotos} captured moments`
                              : 'Photos will appear here once they are uploaded'}
                    </p>
                </div>

                {/* Toggle for Guest Users Only */}
                {isGuest && currentUser && (
                    <div className="flex justify-center mb-8">
                        <div className={`inline-flex items-center gap-2 rounded-xl p-1.5 ${GALLERY_SURFACE}`}>
                            <button
                                onClick={() => setPhotoViewMode('all')}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    photoViewMode === 'all'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                                }`}
                            >
                                All Photos
                            </button>
                            <button
                                onClick={() => setPhotoViewMode('my')}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    photoViewMode === 'my'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                                }`}
                            >
                                My Photos
                            </button>
                        </div>
                    </div>
                )}

                {isLoadingPhotos ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-square bg-zinc-100 rounded-2xl animate-pulse border border-zinc-200/80 dark:bg-white/5 dark:border-white/5" />
                        ))}
                    </div>
                ) : !currentUser ? (
                    <div className="relative min-h-[220px] rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/90 dark:border-white/15 dark:bg-[#0f0c18]/50 flex items-center justify-center px-6">
                        <p className="text-zinc-600 dark:text-gray-500 text-center text-sm">
                            Photo thumbnails are hidden until you sign in.
                        </p>
                    </div>
                ) : photos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo: any, index: number) => (
                                <div
                                    key={photo._id}
                                    className="group relative aspect-square bg-zinc-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 border border-zinc-200/90 hover:border-violet-400/50 dark:bg-[#0f0c18] dark:border-white/5 dark:hover:border-violet-500/30"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.thumbnailUrl || photo.url || photo.s3Url}
                                        alt={`Event photo ${startIndex + index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                            <div className="flex items-center justify-between text-white text-sm">
                                                <span className="font-medium">View Photo</span>
                                                <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 border border-white/15 text-gray-100 backdrop-blur-sm">
                                                    #{(startIndex + index + 1).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={`mt-10 card ${GALLERY_SURFACE}`}>
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
                    <div className={`text-center py-20 card ${GALLERY_SURFACE}`}>
                        <div className="w-24 h-24 bg-violet-100 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="text-violet-600 dark:text-violet-400" size={48} />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                            {photoViewMode === 'my' && isGuest 
                                ? 'No photos of you yet' 
                                : 'No photos yet'}
                        </h3>
                        <p className="text-zinc-600 dark:text-gray-400">
                            {photoViewMode === 'my' && isGuest
                                ? 'Photos where you appear in this event will show here'
                                : 'Photos from this event will appear here'}
                        </p>
                    </div>
                )}
            </div>

            {/* Photo Modal */}
            {/* Login gate for shared event links — photos are not fetched until authenticated */}
            {!authLoading && !currentUser && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/65 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="event-gallery-login-title"
                >
                    <div className="w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#0f0c18] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-violet-100 border border-violet-200/90 dark:bg-violet-500/15 dark:border-violet-400/25 flex items-center justify-center">
                                <Lock className="text-violet-600 dark:text-violet-300" size={32} />
                            </div>
                        </div>
                        <h2
                            id="event-gallery-login-title"
                            className="text-2xl font-semibold text-zinc-900 dark:text-white text-center mb-3"
                        >
                            Sign in to view photos
                        </h2>
                        <p className="text-zinc-600 dark:text-gray-400 text-center text-sm leading-relaxed mb-8">
                            This shared event link opens the event page, but the gallery is only available after you log in or sign up.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => router.push('/login')}
                                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 font-semibold py-3 rounded-xl justify-center"
                            >
                                Go to login
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/register')}
                                className="flex-1 border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10 font-semibold py-3 rounded-xl justify-center"
                            >
                                Create account
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <X size={20} />
                    </button>
                    <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedPhoto.url || selectedPhoto.s3Url}
                            alt="Selected photo"
                            className="w-full h-auto rounded-2xl shadow-2xl"
                        />
                        <div className="mt-4 flex items-center justify-between bg-white/95 dark:bg-[#0f0c18]/95 backdrop-blur-lg rounded-xl p-4 border border-zinc-200/90 dark:border-white/10 shadow-sm">
                            <div className="text-zinc-900 dark:text-white">
                                <p className="font-medium">{selectedPhoto.fileName}</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-400">
                                    {new Date(selectedPhoto.uploadedAt || selectedPhoto.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                onClick={() => handleDownload(selectedPhoto)}
                                disabled={!!downloading}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                            >
                                {downloading === selectedPhoto._id ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                    <Download size={18} className="mr-2" />
                                )}
                                {downloading === selectedPhoto._id ? 'Downloading...' : 'Download Original'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
