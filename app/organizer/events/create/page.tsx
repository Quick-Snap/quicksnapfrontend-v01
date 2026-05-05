'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from 'react-query';
import { 
    ChevronLeft, 
    Calendar, 
    MapPin, 
    Type, 
    Eye, 
    Lock, 
    Sparkles, 
    FileText,
    Clock,
    Users,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';

export default function CreateEventPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        venue: '',
        startDate: '',
        endDate: '',
        isPublic: true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                toast.error('End date must be after start date');
                setLoading(false);
                return;
            }

            const response = await api.post('/events', formData);

            if (response.data.success) {
                toast.success('Event created successfully!');
                // Invalidate all event-related queries to refresh data
                await queryClient.invalidateQueries('events');
                await queryClient.invalidateQueries('myOrganizedEvents');
                await queryClient.invalidateQueries('photographerEvents');
                await queryClient.invalidateQueries('organizerStats');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error: any) {
            console.error('Create event error:', error);
            toast.error(error.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    // Check if form is valid for visual feedback
    const isFormValid = formData.name && formData.venue && formData.startDate && formData.endDate;

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/organizer/events" 
                        className="inline-flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Events</span>
                    </Link>
                </div>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#1c1430] dark:via-[#0f0b1d] dark:to-[#0b1224] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-70" />
                    <div className="absolute -right-10 -top-10 h-48 w-48 bg-violet-300/40 blur-3xl dark:bg-violet-500/20" />
                    <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-indigo-300/35 blur-3xl dark:bg-indigo-500/20" />
                    <div className="relative">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-4 py-1.5 dark:border-white/10 dark:bg-white/5">
                            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                            <span className="text-sm text-zinc-700 dark:text-gray-200">New Event</span>
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-4xl">Create Your Event</h1>
                        <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
                            Set up a new event for your organization. Once created, you&apos;ll receive a unique access code to share with attendees and photographers.
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Event Details Section */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Event Details</h2>
                                        <p className="text-sm text-gray-500">Basic information about your event</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Event Name */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                                            Event Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Type size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="input w-full rounded-xl py-3.5 pl-12 pr-4 transition-all"
                                                placeholder="e.g. Annual College Fest 2025"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="input w-full resize-none rounded-xl py-3.5 px-4 transition-all"
                                            placeholder="Describe your event, what attendees can expect..."
                                        />
                                    </div>

                                    {/* Venue */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                                            Venue <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <MapPin size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                name="venue"
                                                required
                                                value={formData.venue}
                                                onChange={handleChange}
                                                className="input w-full rounded-xl py-3.5 pl-12 pr-4 transition-all"
                                                placeholder="e.g. Main Auditorium, Building A"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time Section */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Date & Time</h2>
                                        <p className="text-sm text-gray-500">When will your event take place?</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                                            Start Date & Time <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Calendar size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                required
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                className="input w-full rounded-xl py-3.5 pl-12 pr-4 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                                            End Date & Time <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Calendar size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                required
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                className="input w-full rounded-xl py-3.5 pl-12 pr-4 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visibility Section */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Event Visibility</h2>
                                        <p className="text-sm text-gray-500">Who can see and join your event?</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`
                                        relative cursor-pointer rounded-xl border-2 p-5 transition-all group
                                        ${formData.isPublic 
                                            ? 'border-violet-400 bg-violet-50 dark:border-violet-500/50 dark:bg-violet-500/10' 
                                            : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'}
                                    `}>
                                        <input
                                            type="radio"
                                            name="isPublic"
                                            checked={formData.isPublic}
                                            onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                            className="sr-only"
                                        />
                                        {formData.isPublic && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle className="h-5 w-5 text-violet-400" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                                                formData.isPublic ? 'bg-violet-200/80 dark:bg-violet-500/20' : 'bg-zinc-200 group-hover:bg-zinc-100 dark:bg-white/10 dark:group-hover:bg-white/15'
                                            }`}>
                                                <Eye size={24} className={formData.isPublic ? 'text-violet-400' : 'text-gray-400'} />
                                            </div>
                                            <div>
                                                <p className={`mb-1 font-semibold ${formData.isPublic ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-gray-300'}`}>
                                                    Public Event
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Visible to everyone. Anyone can discover and join with the access code.
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`
                                        relative cursor-pointer rounded-xl border-2 p-5 transition-all group
                                        ${!formData.isPublic 
                                            ? 'border-violet-400 bg-violet-50 dark:border-violet-500/50 dark:bg-violet-500/10' 
                                            : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'}
                                    `}>
                                        <input
                                            type="radio"
                                            name="isPublic"
                                            checked={!formData.isPublic}
                                            onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                                            className="sr-only"
                                        />
                                        {!formData.isPublic && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle className="h-5 w-5 text-violet-400" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                                                !formData.isPublic ? 'bg-violet-200/80 dark:bg-violet-500/20' : 'bg-zinc-200 group-hover:bg-zinc-100 dark:bg-white/10 dark:group-hover:bg-white/15'
                                            }`}>
                                                <Lock size={24} className={!formData.isPublic ? 'text-violet-400' : 'text-gray-400'} />
                                            </div>
                                            <div>
                                                <p className={`mb-1 font-semibold ${!formData.isPublic ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-gray-300'}`}>
                                                    Private Event
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Hidden from public. Only people with the access code can join.
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/organizer/events" className="flex-1 order-2 sm:order-1">
                                    <button 
                                        type="button" 
                                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3.5 px-6 font-semibold text-zinc-800 transition-all hover:bg-zinc-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading || !isFormValid}
                                    className="flex-1 order-1 sm:order-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-violet-500/25 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating Event...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            Create Event
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar - Tips */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Preview Card */}
                        <div className="card sticky top-24 border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Event Preview</h3>
                            
                            <div className="space-y-4">
                                <div className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-indigo-500/10">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-gray-500">Event Name</p>
                                    <p className="truncate font-medium text-zinc-900 dark:text-white">
                                        {formData.name || 'Your event name...'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50 p-3 dark:border-white/5 dark:bg-white/5">
                                        <p className="mb-1 text-xs text-zinc-500 dark:text-gray-500">Venue</p>
                                        <p className="truncate text-sm text-zinc-700 dark:text-gray-300">
                                            {formData.venue || '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50 p-3 dark:border-white/5 dark:bg-white/5">
                                        <p className="mb-1 text-xs text-zinc-500 dark:text-gray-500">Visibility</p>
                                        <p className="text-sm text-zinc-700 dark:text-gray-300">
                                            {formData.isPublic ? '🌐 Public' : '🔒 Private'}
                                        </p>
                                    </div>
                                </div>

                                {formData.startDate && (
                                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50 p-3 dark:border-white/5 dark:bg-white/5">
                                        <p className="mb-1 text-xs text-zinc-500 dark:text-gray-500">Date</p>
                                        <p className="text-sm text-zinc-700 dark:text-gray-300">
                                            {new Date(formData.startDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 border-t border-zinc-200/90 pt-6 dark:border-white/10">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                                        <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-zinc-900 dark:text-white">Access Code</p>
                                        <p className="text-xs text-zinc-500 dark:text-gray-500">
                                            A unique 6-character code will be generated automatically after creation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Tips</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-zinc-600 dark:text-gray-400">Use a clear, descriptive event name</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-zinc-600 dark:text-gray-400">Include venue details like building or room number</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-zinc-600 dark:text-gray-400">Set accurate dates to help attendees plan</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-zinc-600 dark:text-gray-400">Share the access code with your photographers</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
