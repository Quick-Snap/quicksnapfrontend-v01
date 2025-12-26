'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoleGuard from '../components/RoleGuard';
import { Calendar, Plus, Upload, Users, Image as ImageIcon, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/app/api/axios'; // Or wherever api is configured

export default function OrganizerDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalPhotos: 0,
        totalAttendees: 0
    });
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch only the organizer's own events
                const eventsRes = await api.get('/events/my-organized');
                const myEvents = eventsRes.data.data || [];
                setRecentEvents(myEvents.slice(0, 5));

                // Calculate stats from organizer's own events
                const totalAttendees = myEvents.reduce((sum: number, event: any) => 
                    sum + (event.attendees?.length || 0), 0
                );
                const totalPhotos = myEvents.reduce((sum: number, event: any) => 
                    sum + (event.photos?.length || 0), 0
                );

                setStats({
                    totalEvents: myEvents.length,
                    totalPhotos: totalPhotos,
                    totalAttendees: totalAttendees
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="space-y-8">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 shadow-2xl shadow-indigo-500/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-indigo-200" />
                                <span className="text-indigo-200 text-sm font-medium">Event Management</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
                            <p className="text-indigo-100 mt-1">Welcome back, {user?.name}</p>
                        </div>
                        <Link href="/organizer/events/create">
                            <button className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl font-semibold">
                                <Plus size={20} />
                                <span>Create New Event</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">My Events</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{loading ? '...' : stats.totalEvents}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Calendar size={24} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="h-1 mt-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
                    </div>

                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">My Photos</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{loading ? '...' : stats.totalPhotos}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                <ImageIcon size={24} className="text-violet-400" />
                            </div>
                        </div>
                        <div className="h-1 mt-4 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"></div>
                    </div>

                    <div className="stat-card group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">My Attendees</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{loading ? '...' : stats.totalAttendees}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Users size={24} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="h-1 mt-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
                    </div>
                </div>

                {/* Recent Events Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 size={20} className="text-violet-400" />
                            My Events
                        </h2>
                        <Link href="/organizer/events" className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 text-sm transition-colors">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="card animate-pulse h-40"></div>
                    ) : recentEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentEvents.map(event => (
                                <div key={event._id} className="card-hover flex flex-col justify-between h-full group">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-white/5 text-gray-400 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 border border-white/5">
                                                <Calendar size={12} className="text-violet-400" />
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${event.isActive ? 'bg-emerald-400' : 'bg-gray-600'}`}></span>
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-2 group-hover:text-violet-400 transition-colors">{event.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">{event.description}</p>

                                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Users size={14} className="text-emerald-400" />
                                                <span className="text-gray-400">{event.attendees?.length || 0}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ImageIcon size={14} className="text-violet-400" />
                                                <span className="text-gray-400">-</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-2">
                                        <Link href={`/events/${event._id}/upload`} className="flex-1">
                                            <button className="btn-primary w-full text-sm py-2 flex justify-center items-center gap-2 rounded-xl">
                                                <Upload size={14} /> Upload
                                            </button>
                                        </Link>
                                        <Link href={`/events/${event._id}/manage`} className="flex-1">
                                            <button className="btn-secondary w-full text-sm py-2 rounded-xl">
                                                Manage
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
                                <Calendar size={32} className="text-violet-400" />
                            </div>
                            <p className="text-lg font-medium text-white">No events created yet</p>
                            <p className="text-sm text-gray-500 mb-6">Get started by creating your first event</p>
                            <Link href="/organizer/events/create">
                                <button className="btn-gradient px-6 py-3 rounded-xl font-semibold">Create Event</button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
