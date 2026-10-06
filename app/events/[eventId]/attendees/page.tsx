'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft,
    Users,
    Search,
    Download,
    UserCheck,
    Copy,
    Check,
    Mail,
    RefreshCw,
    X,
    Calendar,
    ArrowUpDown,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessEventManagePage } from '@/lib/eventPermissions';
import RoleGuard from '@/app/components/RoleGuard';

export default function EventAttendeesPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const eventId = params?.eventId as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [codeCopied, setCodeCopied] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'email'>('name');

    const fetchEvent = useCallback(async () => {
        if (!eventId) return;
        try {
            setLoading(true);
            const data = await eventApi.getById(eventId);
            setEvent(data);
        } catch (err: any) {
            console.error('Failed to load event attendees:', err);
            toast.error('Failed to load event attendees');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    const canAccess = useMemo(() => {
        if (!event || !user) return false;
        return canAccessEventManagePage(user, event);
    }, [event, user]);

    const attendees = useMemo(() => {
        if (!event?.attendees || !Array.isArray(event.attendees)) return [];
        return event.attendees;
    }, [event]);

    const filteredAttendees = useMemo(() => {
        let list = [...attendees];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((a: any) => {
                const name = (a.name || '').toLowerCase();
                const email = (a.email || '').toLowerCase();
                return name.includes(q) || email.includes(q);
            });
        }

        list.sort((a: any, b: any) => {
            const valA = (a[sortBy] || '').toLowerCase();
            const valB = (b[sortBy] || '').toLowerCase();
            return valA.localeCompare(valB);
        });

        return list;
    }, [attendees, searchQuery, sortBy]);

    const handleCopyCode = () => {
        if (!event?.accessCode) return;
        navigator.clipboard.writeText(event.accessCode);
        setCodeCopied(true);
        toast.success('Event code copied to clipboard');
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (attendees.length === 0) {
            toast.error('No attendees to export');
            return;
        }

        const csvRows = [
            ['Name', 'Email', 'Role', 'Event Name', 'Event Code'].join(','),
            ...attendees.map((a: any) => [
                `"${(a.name || 'Anonymous Guest').replace(/"/g, '""')}"`,
                `"${(a.email || '').replace(/"/g, '""')}"`,
                `"${(a.role || 'attendee').replace(/"/g, '""')}"`,
                `"${(event.name || '').replace(/"/g, '""')}"`,
                `"${(event.accessCode || '').replace(/"/g, '""')}"`
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${(event.name || 'event').replace(/[^a-z0-9]/gi, '_')}_attendees.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${attendees.length} attendees to CSV`);
    };

    if (loading) {
        return (
            <RoleGuard allowedRoles={['admin', 'organizer']}>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                        <p className="text-sm font-medium text-zinc-500 dark:text-gray-400">Loading attendee roster...</p>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    if (!canAccess) {
        return (
            <RoleGuard allowedRoles={['admin', 'organizer']}>
                <div className="mx-auto max-w-lg py-16 text-center">
                    <Shield className="mx-auto h-12 w-12 text-zinc-400 dark:text-gray-500 mb-3" />
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Access Denied</h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-gray-400">
                        Only the event organizer and admins can view the attendee roster.
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
        <RoleGuard allowedRoles={['admin', 'organizer']}>
            <div className="mx-auto max-w-6xl space-y-6 pb-16">
                {/* Header & Navigation */}
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
                            <span>Joined Attendees</span>
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                {attendees.length}
                            </span>
                        </h1>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
                            Roster of guests who joined <span className="font-semibold text-zinc-900 dark:text-white">{event.name}</span>
                        </p>
                    </div>

                    {/* Actions: Export & Refresh */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchEvent}
                            className="p-2.5 rounded-xl border border-zinc-200/90 bg-white text-zinc-600 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white transition-colors"
                            title="Refresh List"
                        >
                            <RefreshCw size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={attendees.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0f0c18]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/80 py-2.5 pl-10 pr-9 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 dark:text-gray-400">Sort:</span>
                        <div className="flex rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-0.5 dark:border-white/10 dark:bg-white/5">
                            <button
                                type="button"
                                onClick={() => setSortBy('name')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    sortBy === 'name'
                                        ? 'bg-white shadow-sm text-violet-700 dark:bg-white/15 dark:text-white'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                Name
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortBy('email')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    sortBy === 'email'
                                        ? 'bg-white shadow-sm text-violet-700 dark:bg-white/15 dark:text-white'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                Email
                            </button>
                        </div>
                    </div>
                </div>

                {/* Attendee Roster Grid */}
                {attendees.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <Users className="h-8 w-8 text-zinc-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No Attendees Have Joined Yet</h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400 max-w-md mx-auto">
                            Share the event QR code or access code with your guests. Once they join, their details will be cataloged here automatically.
                        </p>
                        {event?.accessCode && (
                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors"
                            >
                                {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                                <span>Copy Access Code: {event.accessCode}</span>
                            </button>
                        )}
                    </div>
                ) : filteredAttendees.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200/90 bg-white p-10 text-center dark:border-white/10 dark:bg-[#0f0c18]">
                        <p className="text-sm font-medium text-zinc-600 dark:text-gray-300">
                            No attendees found matching &quot;{searchQuery}&quot;
                        </p>
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
                        >
                            Clear search filter
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAttendees.map((attendee: any, idx: number) => {
                            const id = attendee._id || attendee.id || idx;
                            const name = attendee.name || 'Guest User';
                            const email = attendee.email || 'No email provided';
                            const initial = name.charAt(0).toUpperCase();

                            return (
                                <div
                                    key={id}
                                    className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-white/5 dark:bg-[#0f0c18] dark:hover:border-violet-500/20"
                                >
                                    {attendee.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={attendee.avatar}
                                            alt={name}
                                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white shadow-sm text-base">
                                            {initial}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate text-sm font-bold text-zinc-900 dark:text-white" title={name}>
                                                {name}
                                            </p>
                                        </div>
                                        <p className="truncate text-xs text-zinc-500 dark:text-gray-400 mt-0.5" title={email}>
                                            {email}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                <UserCheck size={10} />
                                                Joined
                                            </span>
                                            {attendee.role && attendee.role !== 'user' && (
                                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 uppercase tracking-wider">
                                                    {attendee.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
