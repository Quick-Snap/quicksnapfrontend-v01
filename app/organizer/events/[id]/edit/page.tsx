'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, MapPin, AlignLeft, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import { eventApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        isPublic: true
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await eventApi.getById(eventId);
                const event = data.data;

                // Format dates for datetime-local input
                const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16); // YYYY-MM-DDThh:mm
                };

                setFormData({
                    name: event.name,
                    description: event.description || '',
                    startDate: formatDate(event.startDate),
                    endDate: formatDate(event.endDate),
                    location: event.location || '',
                    isPublic: event.isPublic
                });
            } catch (error) {
                console.error('Error fetching event:', error);
                toast.error('Failed to load event details');
                router.push(`/organizer/events/${eventId}`);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (isPublic: boolean) => {
        setFormData(prev => ({ ...prev, isPublic }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            toast.error('End date must be after start date');
            return;
        }

        setSaving(true);
        try {
            await eventApi.update(eventId, formData);
            toast.success('Event updated successfully');
            router.push(`/organizer/events/${eventId}`);
        } catch (error) {
            console.error('Error updating event:', error);
            toast.error('Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/organizer/events/${eventId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Event</h1>
                        <p className="text-gray-500">Update event details and settings</p>
                    </div>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                required
                                placeholder="e.g. Annual Tech Symposium 2024"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <AlignLeft size={18} className="text-gray-400" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="input pl-10 py-2"
                                    placeholder="Describe your event..."
                                />
                            </div>
                        </div>

                        {/* Date & Time */}
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
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        required
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
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Venue / Location
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input pl-10"
                                    required
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>
                        </div>

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Event Visibility
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleToggle(true)}
                                    className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${formData.isPublic
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-200'}
                  `}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe size={20} className={formData.isPublic ? 'text-blue-600' : 'text-gray-400'} />
                                        <span className={`font-medium ${formData.isPublic ? 'text-blue-900' : 'text-gray-900'}`}>
                                            Public
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Visible to all students in the college</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleToggle(false)}
                                    className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${!formData.isPublic
                                            ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                                            : 'border-gray-200 hover:border-purple-200'}
                  `}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Lock size={20} className={!formData.isPublic ? 'text-purple-600' : 'text-gray-400'} />
                                        <span className={`font-medium ${!formData.isPublic ? 'text-purple-900' : 'text-gray-900'}`}>
                                            Private
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Only visible to invited participants</p>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t flex items-center justify-end gap-3">
                            <Link href={`/organizer/events/${eventId}`}>
                                <Button variant="ghost" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" loading={saving}>
                                <Save size={18} className="mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </RoleGuard>
    );
}
