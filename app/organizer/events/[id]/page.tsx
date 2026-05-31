'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/api/axios';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Users,
    Image as ImageIcon,
    Edit,
    Trash2,
    Upload,
    UserPlus,
    ExternalLink,
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import { eventApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import RefreshAttendeeMatchesCard from '@/app/components/events/RefreshAttendeeMatchesCard';

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    // Trash Bin integration states
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashCount, setTrashCount] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchEvent = useCallback(async () => {
        try {
            const data = await eventApi.getById(eventId);
            setEvent(data.data);
        } catch (error) {
            console.error('Error fetching event:', error);
            toast.error('Failed to load event details');
            router.push('/organizer/events');
        } finally {
            setLoading(false);
        }
    }, [eventId, router]);

    const fetchTrashCount = useCallback(async () => {
        try {
            const res = await api.get(`/photos/event/${eventId}/trash`);
            if (res.data?.success && res.data?.data?.photos) {
                setTrashCount(res.data.data.photos.length);
            }
        } catch (err) {
            console.error("Failed to fetch trash count:", err);
        }
    }, [eventId]);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchTrashCount();
        }
    }, [eventId, fetchEvent, fetchTrashCount]);

    const triggerGridRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        fetchTrashCount();
        fetchEvent();
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            await eventApi.delete(eventId);
            toast.success('Event deleted successfully');
            router.push('/organizer/events');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    if (!event) return null;

    const isActive = new Date(event.endDate) > new Date();

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/organizer/events" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {isActive ? <CheckCircle size={12} /> : <Clock size={12} />}
                                    {isActive ? 'Active' : 'Past'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${event.isPublic
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>
                                    {event.isPublic ? 'Public Event' : 'Private Event'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/organizer/events/${eventId}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit size={16} className="mr-2" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            loading={deleting}
                        >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Event Details</h2>
                            {/* ... existing event details ... */}
                            <div className="space-y-4">
                                <p className="text-gray-600 leading-relaxed">
                                    {event.description || 'No description provided.'}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Calendar className="text-primary-600 mt-1" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-900">Date & Time</p>
                                            <p className="text-sm text-gray-600">
                                                Start: {new Date(event.startDate).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                End: {new Date(event.endDate).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <MapPin className="text-primary-600 mt-1" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-900">Location</p>
                                            <p className="text-sm text-gray-600">{event.location || 'TBD'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Photos Grid Section */}
                        <div className="card">
                            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    Event Photos
                                    {trashCount > 0 && (
                                        <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">
                                            {trashCount} in Trash
                                        </span>
                                    )}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsTrashOpen(true)}
                                        className="text-xs text-zinc-500 hover:text-red-500 font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 size={14} />
                                        Trash Bin
                                    </button>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <Link
                                        href={`/organizer/events/${eventId}/upload`}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        + Add Photos
                                    </Link>
                                </div>
                            </h3>
                            <EventPhotosGrid 
                                eventId={eventId} 
                                onPhotoDeleted={fetchTrashCount} 
                                refreshTrigger={refreshTrigger} 
                            />
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ... actions ... */}
                            <Link href={`/organizer/events/${eventId}/upload`} className="group">
                                <div className="card h-full hover:border-primary-500 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                            <Upload className="text-blue-600 group-hover:text-white transition-colors" size={20} />
                                        </div>
                                        <h3 className="font-bold text-lg">Upload Photos</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Bulk upload photos to this event. Supporting drag and drop.
                                    </p>
                                </div>
                            </Link>

                            <Link href={`/organizer/events/${eventId}/photographers`} className="group">
                                <div className="card h-full hover:border-primary-500 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                            <UserPlus className="text-purple-600 group-hover:text-white transition-colors" size={20} />
                                        </div>
                                        <h3 className="font-bold text-lg">Assign Photographers</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Grant upload permissions to specific users or photographers.
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="card bg-slate-900 text-white">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <ImageIcon size={20} />
                                Event Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-800 rounded-lg">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider">Total Photos</p>
                                    <p className="text-2xl font-bold">{event.stats?.totalPhotos || 0}</p>
                                </div>
                                <div className="p-3 bg-slate-800 rounded-lg">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider">Processed</p>
                                    <p className="text-2xl font-bold">{event.stats?.processedPhotos || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-bold text-lg mb-4">Photographers</h3>
                            {event.photographers && event.photographers.length > 0 ? (
                                <div className="space-y-3">
                                    {event.photographers.slice(0, 3).map((p: any) => (
                                        <div key={p._id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                {p.name?.[0] || 'U'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium truncate">{p.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{p.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {event.photographers.length > 3 && (
                                        <Link
                                            href={`/organizer/events/${eventId}/photographers`}
                                            className="text-sm text-primary-600 hover:text-primary-700 block mt-2"
                                        >
                                            View all {event.photographers.length} photographers
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                    <p className="text-sm">No photographers assigned</p>
                                </div>
                            )}
                        </div>

                        <RefreshAttendeeMatchesCard eventId={eventId} event={event} variant="light" className="mb-6" />

                        <div className="card">
                            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                            <Link
                                href={`/events/${eventId}`}
                                target="_blank"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <ExternalLink size={18} className="text-gray-400 group-hover:text-primary-600" />
                                    <span className="text-sm font-medium">Public Event Page</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trash Bin modal */}
            <TrashBinModal 
                isOpen={isTrashOpen} 
                onClose={() => setIsTrashOpen(false)} 
                eventId={eventId} 
                onRefresh={triggerGridRefresh} 
            />
        </RoleGuard>
    );
}

function EventPhotosGrid({ 
    eventId, 
    onPhotoDeleted, 
    refreshTrigger 
}: { 
    eventId: string; 
    onPhotoDeleted?: () => void; 
    refreshTrigger?: number; 
}) {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPhotos = useCallback(async () => {
        try {
            const data = await eventApi.getPhotos(eventId, { limit: 12 });
            setPhotos(data?.data?.photos || []);
        } catch (err) {
            console.error("Failed to fetch photos", err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchPhotos();
    }, [eventId, refreshTrigger, fetchPhotos]);

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('Are you sure you want to delete this photo? It will be moved to the Trash Bin for 3 days.')) {
            return;
        }

        try {
            await api.delete(`/photos/${photoId}`);
            toast.success('Photo moved to Trash Bin');
            
            // Instantly remove from UI grid
            setPhotos(prev => prev.filter(p => p._id !== photoId && p.imageId !== photoId));
            
            if (onPhotoDeleted) {
                onPhotoDeleted();
            }
        } catch (err) {
            console.error("Failed to delete photo:", err);
            toast.error("Failed to delete photo");
        }
    };

    if (loading) return <div className="text-center py-8">Loading photos...</div>;

    if (photos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No photos uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
                <div key={photo._id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group border border-zinc-200 dark:border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {photo.isPublic && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                            Public
                        </div>
                    )}
                    {/* Hover Overlay Delete Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button
                            onClick={() => handleDeletePhoto(photo._id || photo.imageId)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md active:scale-95"
                            title="Move to Trash"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            {photos.length > 12 && (
                <div className="flex items-center justify-center aspect-square bg-gray-50 rounded-lg border text-sm text-gray-500">
                    + More
                </div>
            )}
        </div>
    );
}

interface TrashBinModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onRefresh: () => void;
}

function TrashBinModal({ isOpen, onClose, eventId, onRefresh }: TrashBinModalProps) {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchTrashPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/photos/event/${eventId}/trash`);
            if (res.data?.success && res.data?.data?.photos) {
                setPhotos(res.data.data.photos);
            }
        } catch (err) {
            console.error("Failed to load trash photos:", err);
            toast.error("Failed to load trash photos");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (isOpen && eventId) {
            fetchTrashPhotos();
        }
    }, [isOpen, eventId, fetchTrashPhotos]);

    const handleRestore = async (photoId: string) => {
        setActioning(photoId);
        try {
            await api.post(`/photos/${photoId}/restore`);
            toast.success("Photo restored successfully!");
            setPhotos(prev => prev.filter(p => p._id !== photoId && p.imageId !== photoId));
            onRefresh();
        } catch (err) {
            console.error("Failed to restore photo:", err);
            toast.error("Failed to restore photo");
        } finally {
            setActioning(null);
        }
    };

    const handlePurge = async (photoId: string) => {
        if (!confirm("Are you sure you want to permanently delete this photo? This cannot be undone and S3 storage will be cleared immediately.")) {
            return;
        }
        setActioning(photoId);
        try {
            await api.delete(`/photos/${photoId}?hard=true`);
            toast.success("Photo permanently deleted!");
            setPhotos(prev => prev.filter(p => p._id !== photoId && p.imageId !== photoId));
            onRefresh();
        } catch (err) {
            console.error("Failed to purge photo:", err);
            toast.error("Failed to permanently delete photo");
        } finally {
            setActioning(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-[#0f0c18] border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-bold">Trash Bin - Recently Deleted</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 transition-colors"
                    >
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[30vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
                            <div className="spinner w-6 h-6 border-2 border-primary-500 border-t-transparent animate-spin" />
                            <p className="text-sm">Loading trash bin...</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 dark:text-gray-400 gap-2">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300">
                                <Trash2 size={24} />
                            </div>
                            <p className="font-semibold text-sm">Trash is empty</p>
                            <p className="text-xs text-zinc-400 dark:text-gray-500 max-w-xs">
                                Deleted photos remain here for up to 3 days before being permanently purged.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {photos.map((photo) => {
                                // Calculate days remaining (3 days from deletedAt)
                                const deletedTime = photo.deletedAt ? new Date(photo.deletedAt).getTime() : Date.now();
                                const expiryTime = deletedTime + 3 * 24 * 60 * 60 * 1000;
                                const timeRemainingMs = Math.max(0, expiryTime - Date.now());
                                const daysLeft = Math.floor(timeRemainingMs / (24 * 60 * 60 * 1000));
                                const hoursLeft = Math.floor((timeRemainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                
                                let countText = "Expired";
                                if (daysLeft > 0) {
                                    countText = `${daysLeft}d left`;
                                } else if (hoursLeft > 0) {
                                    countText = `${hoursLeft}h left`;
                                } else if (timeRemainingMs > 0) {
                                    countText = "<1h left";
                                }

                                return (
                                    <div 
                                        key={photo._id} 
                                        className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 group shadow-sm animate-scale-in"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.thumbnailUrl || photo.url}
                                            alt={photo.fileName}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Days Left badge */}
                                        <div className="absolute top-2 left-2 bg-zinc-950/75 dark:bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                            {countText}
                                        </div>

                                        {/* Hover Overlay Controls */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2 text-center z-10">
                                            <p className="text-[10px] text-white/90 truncate max-w-full font-medium">{photo.fileName}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRestore(photo._id || photo.imageId)}
                                                    disabled={actioning !== null}
                                                    className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
                                                >
                                                    Restore
                                                </button>
                                                <button
                                                    onClick={() => handlePurge(photo._id || photo.imageId)}
                                                    disabled={actioning !== null}
                                                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
                                                >
                                                    Purge
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] flex justify-end">
                    <button
                        onClick={onClose}
                        className="py-2 px-5 text-sm font-semibold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 transition-all dark:text-gray-300 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
