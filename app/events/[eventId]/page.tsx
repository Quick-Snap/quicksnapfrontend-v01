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
    Heart,
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

const PHOTOS_PER_PAGE = 20;

export default function PublicEventPage() {
    const { user: currentUser } = useAuth();
    const params = useParams();
    const router = useRouter();
    const eventId = params?.eventId as string;

    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch Event details
    const { data: eventResult, isLoading: loading } = useQuery(
        ['event', eventId],
        () => eventApi.getById(eventId),
        { enabled: !!eventId }
    );
    const event = eventResult?.data;

    // Fetch Photos with caching
    const { data: photosResult, isLoading: photosLoading } = useQuery(
        ['eventPhotos', eventId],
        () => photoApi.getPublicPhotos(eventId, { limit: 500 }),
        {
            enabled: !!eventId,
            staleTime: 5 * 60 * 1000, // 5 mins cache
        }
    );
    const allPhotos = photosResult?.data?.photos || [];
    
    // Pagination calculations
    const totalPhotos = allPhotos.length;
    const totalPages = Math.ceil(totalPhotos / PHOTOS_PER_PAGE);
    const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
    const endIndex = startIndex + PHOTOS_PER_PAGE;
    const photos = allPhotos.slice(startIndex, endIndex);

    // Reset to page 1 if current page exceeds total pages (e.g., after data changes)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

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
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white overflow-hidden rounded-2xl mb-8">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float delay-200" />
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float delay-400" />
                </div>

                <div className="relative px-6 py-10 md:px-10 md:py-12">
                    {/* Back Button */}
                    <Link href="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Events</span>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Event Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isActive
                                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                                    : 'bg-gray-400/20 text-gray-100 border border-gray-300/30'
                                    }`}>
                                    {isActive ? '🎉 Active Event' : '📅 Past Event'}
                                </span>
                                {event.isPublic && (
                                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-400/20 text-blue-100 border border-blue-300/30">
                                        🌐 Public
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{event.name}</h1>
                            <p className="text-xl text-white/90 mb-8 leading-relaxed">
                                {event.description || 'Join us for an amazing event!'}
                            </p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Users className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-sm">Attendees</p>
                                            <p className="text-2xl font-bold">{event.attendees?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Camera className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-sm">Photos</p>
                                            <p className="text-2xl font-bold">{totalPhotos}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={handleShare}
                                    className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold px-6 py-3 rounded-xl border border-white/20"
                                >
                                    <Share2 size={20} className="mr-2" />
                                    Share Event
                                </Button>
                                {isActive && (
                                    <Button
                                        variant="outline"
                                        className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl"
                                    >
                                        <Heart size={20} className="mr-2" />
                                        Register
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Event Details Card */}
                        <div className="bg-[#111111]/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Sparkles className="text-violet-400" size={24} />
                                Event Details
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Calendar className="text-violet-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Date & Time</p>
                                        <p className="text-gray-400 text-sm">
                                            {startDate.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                                            <Clock size={14} className="text-violet-400" />
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

                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="text-pink-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Location</p>
                                        <p className="text-gray-400 text-sm">{event.venue || event.location || 'To be announced'}</p>
                                    </div>
                                </div>

                                {event.organizer && (
                                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <User className="text-emerald-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white mb-1">Organized by</p>
                                            <p className="text-gray-400 text-sm">{event.organizer.name}</p>
                                            <p className="text-gray-500 text-xs">{event.organizer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {(currentUser?.role === 'admin' || event.organizer?._id === currentUser?.id || event.organizer === currentUser?.id) && event.accessCode && (
                                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-indigo-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1">Access Code</p>
                                            <p className="text-indigo-600 text-lg font-mono tracking-widest font-bold">{event.accessCode}</p>
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
                            ? `Browse through ${totalPhotos} amazing moments captured at this event`
                            : 'Photos will appear here once they are uploaded'}
                    </p>
                </div>

                {photosLoading ? (
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
                                    className="group relative aspect-square bg-[#111111] rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10 border border-white/5 hover:border-violet-500/30"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.url || photo.s3Url}
                                        alt={`Event photo ${startIndex + index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <p className="text-white text-sm font-medium">View Photo</p>
                                        </div>
                                    </div>
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
                    <div className="text-center py-20 card">
                        <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="text-violet-400" size={48} />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No photos yet</h3>
                        <p className="text-gray-400">Photos from this event will appear here</p>
                    </div>
                )}
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                        <div className="mt-4 flex items-center justify-between bg-[#111111]/90 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                            <div className="text-white">
                                <p className="font-medium">{selectedPhoto.fileName}</p>
                                <p className="text-sm text-gray-400">
                                    {new Date(selectedPhoto.uploadedAt || selectedPhoto.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                onClick={() => handleDownload(selectedPhoto)}
                                disabled={!!downloading}
                                className="bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
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
