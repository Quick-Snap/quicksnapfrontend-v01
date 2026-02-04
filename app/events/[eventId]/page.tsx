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
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, photoApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import Pagination from '@/app/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from 'react-query';

const PHOTOS_PER_PAGE = 12;

export default function PublicEventPage() {
    const { user: currentUser } = useAuth();
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

    // Fetch All Photos with caching
    const { data: photosResult, isLoading: photosLoading } = useQuery(
        ['eventPhotos', eventId],
        () => photoApi.getPublicPhotos(eventId, { limit: 500 }),
        {
            enabled: !!eventId,
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
    const isLoadingPhotos = photoViewMode === 'my' && isGuest ? myPhotosLoading : photosLoading;

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
                    <p className="text-gray-400 font-medium">Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Event not found</h2>
                    <p className="text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
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
            <div className="relative overflow-hidden rounded-3xl mb-10 border border-white/5 bg-gradient-to-br from-[#181025] via-[#0f0b1d] to-[#0a0d1e] shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
                <div className="absolute -left-16 -bottom-10 w-72 h-72 bg-violet-500/20 blur-3xl" />
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/15 blur-3xl" />

                <div className="relative px-6 py-10 md:px-10 md:py-12">
                    <Link href="/events" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Events</span>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Event Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${isActive
                                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                                    : 'bg-white/10 text-gray-200 border-white/20'
                                    }`}>
                                    {isActive ? 'Active Event' : 'Past Event'}
                                </span>
                                {event.isPublic && (
                                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-gray-200 border border-white/20">
                                        Public
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
                                    {photoViewMode === 'my' && isGuest 
                                        ? `${totalPhotos} my photos` 
                                        : `${allPhotos.length} photos`}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">{event.name}</h1>
                                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                                    {event.description || 'Join us for an amazing event!'}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0f0c18] rounded-2xl p-4 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                            <Users className="text-violet-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Attendees</p>
                                            <p className="text-2xl font-semibold text-white">{event.attendees?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#0f0c18] rounded-2xl p-4 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                            <Camera className="text-indigo-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Photos</p>
                                            <p className="text-2xl font-semibold text-white">{allPhotos.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={handleShare}
                                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.3)]"
                                >
                                    <Share2 size={20} className="mr-2" />
                                    Share Event
                                </Button>
                            </div>
                        </div>

                        {/* Event Details Card */}
                        <div className="bg-[#0f0c18] rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-8 border border-white/10">
                            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Sparkles className="text-violet-300" size={24} />
                                Event Details
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-12 h-12 bg-violet-500/15 border border-violet-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Calendar className="text-violet-300" size={22} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Date & Time</p>
                                        <p className="text-gray-300 text-sm">
                                            {startDate.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                                            <Clock size={14} className="text-violet-300" />
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

                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-12 h-12 bg-pink-500/15 border border-pink-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-pink-300" size={22} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Location</p>
                                        <p className="text-gray-300 text-sm">{event.venue || event.location || 'To be announced'}</p>
                                    </div>
                                </div>

                                {event.organizer && (
                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <User className="text-emerald-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white mb-1">Organized by</p>
                                            <p className="text-gray-300 text-sm">{event.organizer.name}</p>
                                            <p className="text-gray-500 text-xs">{event.organizer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {(currentUser?.role === 'admin' || event.organizer?._id === currentUser?.id || event.organizer === currentUser?.id) && event.accessCode && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#181025] to-[#121022] rounded-xl border border-violet-500/30">
                                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-violet-300" size={22} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white mb-1">Access Code</p>
                                            <p className="text-violet-200 text-lg font-mono tracking-widest font-semibold">{event.accessCode}</p>
                                            <p className="text-gray-500 text-xs mt-1">Share this code with guests to let them join.</p>
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
                    <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <ImageIcon className="text-violet-400" size={36} />
                        Event Gallery
                    </h2>
                    <p className="text-gray-400 text-lg">
                        {totalPhotos > 0
                            ? `Browse through ${totalPhotos} captured moments`
                            : 'Photos will appear here once they are uploaded'}
                    </p>
                </div>

                {/* Toggle for Guest Users Only */}
                {isGuest && currentUser && (
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-[#0f0c18] border border-white/10 rounded-xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                            <button
                                onClick={() => setPhotoViewMode('all')}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    photoViewMode === 'all'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                All Photos
                            </button>
                            <button
                                onClick={() => setPhotoViewMode('my')}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    photoViewMode === 'my'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-gray-400 hover:text-white'
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
                            <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : photos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo: any, index: number) => (
                                <div
                                    key={photo._id}
                                    className="group relative aspect-square bg-[#0f0c18] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 border border-white/5 hover:border-violet-500/30"
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
                    <div className="text-center py-20 card bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
                        <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="text-violet-400" size={48} />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {photoViewMode === 'my' && isGuest 
                                ? 'No photos of you yet' 
                                : 'No photos yet'}
                        </h3>
                        <p className="text-gray-400">
                            {photoViewMode === 'my' && isGuest
                                ? 'Photos where you appear in this event will show here'
                                : 'Photos from this event will appear here'}
                        </p>
                    </div>
                )}
            </div>

            {/* Photo Modal */}
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
                        <div className="mt-4 flex items-center justify-between bg-[#0f0c18]/95 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                            <div className="text-white">
                                <p className="font-medium">{selectedPhoto.fileName}</p>
                                <p className="text-sm text-gray-400">
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
