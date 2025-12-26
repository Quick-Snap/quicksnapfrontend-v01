'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from 'react-query';
import { ArrowLeft, Calendar, MapPin, Type, Eye, Lock } from 'lucide-react';
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

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/organizer" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create New Event</h1>
                        <p className="text-gray-500">Fill in the details to create an event</p>
                    </div>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Type size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input pl-10"
                                    placeholder="e.g. Annual College Fest 2025"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="input"
                                placeholder="Describe your event..."
                            />
                        </div>

                        {/* Venue */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Venue
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="venue"
                                    required
                                    value={formData.venue}
                                    onChange={handleChange}
                                    className="input pl-10"
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date & Time
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="input pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date & Time
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        required
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visibility
                            </label>
                            <div className="flex gap-4">
                                <label className={`
                  flex-1 p-4 rounded-lg border cursor-pointer transition-all
                  ${formData.isPublic ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}
                `}>
                                    <input
                                        type="radio"
                                        name="isPublic"
                                        checked={formData.isPublic}
                                        onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${formData.isPublic ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Eye size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Public Event</p>
                                            <p className="text-sm text-gray-500">Visible to all students</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`
                  flex-1 p-4 rounded-lg border cursor-pointer transition-all
                  ${!formData.isPublic ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'}
                `}>
                                    <input
                                        type="radio"
                                        name="isPublic"
                                        checked={!formData.isPublic}
                                        onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${!formData.isPublic ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Private Event</p>
                                            <p className="text-sm text-gray-500">Invitation only</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Link href="/organizer" className="flex-1">
                                <button type="button" className="btn btn-secondary w-full">
                                    Cancel
                                </button>
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex-1 flex justify-center items-center gap-2"
                            >
                                {loading ? <span className="spinner w-5 h-5 border-white border-t-transparent" /> : null}
                                {loading ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </RoleGuard>
    );
}
