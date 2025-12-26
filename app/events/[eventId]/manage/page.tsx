'use client';

import { useState, useEffect } from 'react';
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
    Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/app/components/RoleGuard';

export default function ManageEventPage() {
    const { user } = useAuth();
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

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await eventApi.getById(eventId);
                setEvent(data.data);
            } catch (error) {
                console.error('Error fetching event:', error);
                toast.error('Failed to load event details');
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

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

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/dashboard" 
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                            {isActive ? 'Active' : 'Past'}
                        </span>
                    </div>
                </div>

                {/* Event Header Card */}
                <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-violet-500/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-5 w-5 text-violet-200" />
                            <span className="text-violet-200 text-sm font-medium">Event Management</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.name}</h1>
                        <p className="text-violet-100 text-lg">{event.description || 'No description provided'}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Attendees</p>
                                <p className="text-2xl font-bold text-white">{event.attendees?.length || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Users className="h-5 w-5 text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Photos</p>
                                <p className="text-2xl font-bold text-white">{event.photos?.length || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                <ImageIcon className="h-5 w-5 text-violet-400" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Photographers</p>
                                <p className="text-2xl font-bold text-white">{event.photographers?.length || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Sparkles className="h-5 w-5 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Status</p>
                                <p className={`text-2xl font-bold ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {isActive ? 'Live' : 'Ended'}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${isActive ? 'bg-emerald-500/10' : 'bg-gray-500/10'} flex items-center justify-center`}>
                                <Clock className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Details */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="text-violet-400" size={24} />
                        Event Details
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar className="text-violet-400" size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-white mb-1">Date</p>
                                    <p className="text-gray-400 text-sm">
                                        {startDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-white mb-1">Time</p>
                                    <p className="text-gray-400 text-sm">
                                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="text-pink-400" size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-white mb-1">Venue</p>
                                    <p className="text-gray-400 text-sm">{event.venue || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Access Code */}
                            {event.accessCode && (
                                <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl border border-indigo-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-white">Access Code</p>
                                        <button
                                            onClick={handleCopyCode}
                                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                                        >
                                            {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                                            {codeCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p className="text-2xl font-mono font-bold text-violet-400 tracking-widest">{event.accessCode}</p>
                                    <p className="text-xs text-gray-500 mt-2">Share this code with guests to let them join</p>
                                </div>
                            )}

                            {/* Visibility */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="font-medium text-white mb-1">Visibility</p>
                                <p className={`text-sm ${event.isPublic ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {event.isPublic ? '🌐 Public Event' : '🔒 Private Event'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assign Photographer Section */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Assign Photographer</h2>
                            <p className="text-sm text-gray-400">Invite photographers to capture this event</p>
                        </div>
                    </div>

                    {/* Assignment Form */}
                    <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl p-6 border border-emerald-500/10 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Enter photographer's email address"
                                    value={photographerEmail}
                                    onChange={(e) => setPhotographerEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAssignPhotographer()}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
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
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            The photographer will receive access to upload photos for this event
                        </p>
                    </div>

                    {/* Current Photographers */}
                    {event.photographers && event.photographers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                Assigned Photographers ({event.photographers.length})
                            </h3>
                            <div className="grid gap-3">
                                {event.photographers.map((photographer: any, index: number) => (
                                    <div
                                        key={photographer._id || photographer.id || index}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                            {(photographer.name || photographer.email || 'P').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {photographer.name || 'Photographer'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {photographer.email || 'No email provided'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
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
                        <div className="text-center py-8 text-gray-500">
                            <Camera className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                            <p className="font-medium text-gray-400">No photographers assigned yet</p>
                            <p className="text-sm">Add photographers using the form above</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href={`/organizer/events/${eventId}/upload`} className="action-card group">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                <Upload className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Upload Photos</p>
                                <p className="text-sm text-gray-400">Add photos to this event</p>
                            </div>
                        </Link>

                        <Link href={`/events/${eventId}`} className="action-card group">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <ImageIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">View Event Page</p>
                                <p className="text-sm text-gray-400">See public event view</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card border-red-500/20 bg-red-500/5">
                    <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle size={24} />
                        Danger Zone
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Once you delete an event, there is no going back. All photos and data associated with this event will be permanently removed.
                    </p>
                    <Button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
                    >
                        <Trash2 size={18} className="mr-2" />
                        Delete Event
                    </Button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-400" size={24} />
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">Delete Event?</h3>
                            <p className="text-gray-400 mb-2">
                                You are about to delete <span className="text-white font-semibold">"{event.name}"</span>
                            </p>
                            <p className="text-gray-500 text-sm mb-6">
                                This action cannot be undone. All photos, attendee data, and event information will be permanently deleted.
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowDeleteModal(false)}
                                    variant="outline"
                                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
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

