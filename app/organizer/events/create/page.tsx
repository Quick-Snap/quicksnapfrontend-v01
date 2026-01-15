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
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back to Events</span>
                    </Link>
                </div>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl p-8 border border-white/5 bg-gradient-to-br from-[#1c1430] via-[#0f0b1d] to-[#0b1224] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet-500/20 blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/20 blur-3xl" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/10 mb-4">
                            <Sparkles className="h-4 w-4 text-violet-300" />
                            <span className="text-sm text-gray-200">New Event</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-2">Create Your Event</h1>
                        <p className="text-gray-300 max-w-2xl">
                            Set up a new event for your organization. Once created, you'll receive a unique access code to share with attendees and photographers.
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Event Details Section */}
                            <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Event Details</h2>
                                        <p className="text-sm text-gray-500">Basic information about your event</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Event Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                                                placeholder="e.g. Annual College Fest 2025"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none resize-none"
                                            placeholder="Describe your event, what attendees can expect..."
                                        />
                                    </div>

                                    {/* Venue */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                                                placeholder="e.g. Main Auditorium, Building A"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time Section */}
                            <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Date & Time</h2>
                                        <p className="text-sm text-gray-500">When will your event take place?</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visibility Section */}
                            <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Event Visibility</h2>
                                        <p className="text-sm text-gray-500">Who can see and join your event?</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`
                                        relative p-5 rounded-xl border-2 cursor-pointer transition-all group
                                        ${formData.isPublic 
                                            ? 'border-violet-500/50 bg-violet-500/10' 
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
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
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                formData.isPublic ? 'bg-violet-500/20' : 'bg-white/10 group-hover:bg-white/15'
                                            }`}>
                                                <Eye size={24} className={formData.isPublic ? 'text-violet-400' : 'text-gray-400'} />
                                            </div>
                                            <div>
                                                <p className={`font-semibold mb-1 ${formData.isPublic ? 'text-white' : 'text-gray-300'}`}>
                                                    Public Event
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Visible to everyone. Anyone can discover and join with the access code.
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`
                                        relative p-5 rounded-xl border-2 cursor-pointer transition-all group
                                        ${!formData.isPublic 
                                            ? 'border-violet-500/50 bg-violet-500/10' 
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
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
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                !formData.isPublic ? 'bg-violet-500/20' : 'bg-white/10 group-hover:bg-white/15'
                                            }`}>
                                                <Lock size={24} className={!formData.isPublic ? 'text-violet-400' : 'text-gray-400'} />
                                            </div>
                                            <div>
                                                <p className={`font-semibold mb-1 ${!formData.isPublic ? 'text-white' : 'text-gray-300'}`}>
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
                                        className="w-full py-3.5 px-6 rounded-xl font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
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
                        <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)] sticky top-24">
                            <h3 className="text-lg font-semibold text-white mb-4">Event Preview</h3>
                            
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Name</p>
                                    <p className="text-white font-medium truncate">
                                        {formData.name || 'Your event name...'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-xs text-gray-500 mb-1">Venue</p>
                                        <p className="text-sm text-gray-300 truncate">
                                            {formData.venue || '—'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-xs text-gray-500 mb-1">Visibility</p>
                                        <p className="text-sm text-gray-300">
                                            {formData.isPublic ? '🌐 Public' : '🔒 Private'}
                                        </p>
                                    </div>
                                </div>

                                {formData.startDate && (
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-xs text-gray-500 mb-1">Date</p>
                                        <p className="text-sm text-gray-300">
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

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white mb-1">Access Code</p>
                                        <p className="text-xs text-gray-500">
                                            A unique 6-character code will be generated automatically after creation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="card bg-[#0d0b14] border-white/5 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Tips</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-400">Use a clear, descriptive event name</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-400">Include venue details like building or room number</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-400">Set accurate dates to help attendees plan</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-400">Share the access code with your photographers</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
