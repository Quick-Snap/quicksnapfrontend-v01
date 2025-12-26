'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
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
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId, router]);

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
                                <span>Event Photos</span>
                                <Link
                                    href={`/organizer/events/${eventId}/upload`}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    + Add Photos
                                </Link>
                            </h3>
                            <EventPhotosGrid eventId={eventId} />
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
        </RoleGuard>
    );
}

function EventPhotosGrid({ eventId }: { eventId: string }) {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const data = await eventApi.getPhotos(eventId, { limit: 12 });
                setPhotos(data?.data?.photos || []);
            } catch (err) {
                console.error("Failed to fetch photos", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPhotos();
    }, [eventId]);

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
                <div key={photo._id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {photo.isPublic && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            Public
                        </div>
                    )}
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
